export {};

declare class AudioWorkletProcessor {
    readonly port: MessagePort;
}

declare function registerProcessor(
    name: string,
    processorCtor: new () => AudioWorkletProcessor,
): void;

class AudioRecorderProcessor extends AudioWorkletProcessor {
    process(inputs: Float32Array[][]) {
        const inputData = inputs.at(0)?.at(0);

        if (inputData) {
            const audioData = new Float32Array(inputData);
            this.port.postMessage(audioData, [audioData.buffer]);
        }

        return true;
    }
}

registerProcessor("audio-recorder-processor", AudioRecorderProcessor);
