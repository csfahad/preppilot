// browser mic → ws → deepgram STT → transcript
// LLM response → elevenlabs TTS → ws → browser speaker

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { createDeepgramStream, closeDeepgramStream } from "./stt.js";
import { streamTTS } from "./tts.js";

interface VoiceSession {
    userId: string;
    interviewId: string;
    voiceAccent: string;
    deepgramConnection: any;
    isActive: boolean;
}

const sessions = new Map<WebSocket, VoiceSession>();

export function setupVoiceWebSocket(server: Server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws/voice",
    });

    wss.on("connection", (ws, req) => {
        console.log("[Voice WS] New connection");

        ws.on("message", async (data, isBinary) => {
            try {
                if (isBinary) {
                    // binary data = audio chunk from microphone
                    const session = sessions.get(ws);
                    if (session?.isActive && session.deepgramConnection) {
                        session.deepgramConnection.send(data);
                    }
                    return;
                }

                // text data = control messages
                const message = JSON.parse(data.toString());

                switch (message.type) {
                    case "start_session": {
                        const { userId, interviewId, voiceAccent } = message;

                        // create deepgram streaming connection
                        const dgConnection = await createDeepgramStream({
                            onTranscript: (
                                transcript: string,
                                isFinal: boolean,
                            ) => {
                                ws.send(
                                    JSON.stringify({
                                        type: "transcript",
                                        text: transcript,
                                        isFinal,
                                    }),
                                );
                            },
                            onError: (error: Error) => {
                                ws.send(
                                    JSON.stringify({
                                        type: "error",
                                        message: error.message,
                                    }),
                                );
                            },
                        });

                        sessions.set(ws, {
                            userId,
                            interviewId,
                            voiceAccent: voiceAccent || "american",
                            deepgramConnection: dgConnection,
                            isActive: true,
                        });

                        ws.send(JSON.stringify({ type: "session_started" }));
                        break;
                    }

                    case "speak_ai": {
                        // stream LLM response as audio
                        const session = sessions.get(ws);
                        if (!session) break;

                        const { text } = message;

                        try {
                            const audioStream = await streamTTS(
                                text,
                                session.voiceAccent,
                            );

                            for await (const chunk of audioStream) {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(chunk); // send binary audio chunks
                                }
                            }

                            ws.send(JSON.stringify({ type: "ai_speech_done" }));
                        } catch (err) {
                            console.error("[Voice WS] TTS error:", err);
                            ws.send(
                                JSON.stringify({
                                    type: "error",
                                    message: "TTS failed",
                                }),
                            );
                        }
                        break;
                    }

                    case "end_session": {
                        const session = sessions.get(ws);
                        if (session) {
                            session.isActive = false;
                            closeDeepgramStream(session.deepgramConnection);
                            sessions.delete(ws);
                        }
                        ws.send(JSON.stringify({ type: "session_ended" }));
                        break;
                    }
                }
            } catch (err) {
                console.error("[Voice WS] Error processing message:", err);
            }
        });

        ws.on("close", () => {
            const session = sessions.get(ws);
            if (session) {
                closeDeepgramStream(session.deepgramConnection);
                sessions.delete(ws);
            }
            console.log("[Voice WS] Connection closed");
        });

        ws.on("error", (err) => {
            console.error("[Voice WS] WebSocket error:", err);
        });
    });

    console.log("[Voice WS] WebSocket server ready at /ws/voice");
}
