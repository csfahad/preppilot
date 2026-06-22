import { motion } from "motion/react";
import { useMemo } from "react";
import { IconBrain } from "@tabler/icons-react";

interface AIAvatarProps {
    name: string;
    role: string;
    isSpeaking: boolean;
    audioLevel: number;
    isThinking: boolean;
    isListening: boolean;
}

export function AIAvatar({
    name,
    role,
    isSpeaking,
    audioLevel,
    isThinking,
    isListening,
}: AIAvatarProps) {
    // Generate ripple rings when speaking
    const rippleCount = 4;
    const ripples = useMemo(
        () => Array.from({ length: rippleCount }, (_, i) => i),
        [],
    );

    // Generate orbital dots for thinking state
    const orbitalDots = useMemo(
        () => Array.from({ length: 8 }, (_, i) => i),
        [],
    );

    // Generate mesh gradient points for inner avatar visualization
    const meshPoints = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => ({
                id: i,
                angle: (i / 6) * 360,
                delay: i * 0.3,
            })),
        [],
    );

    const clampedLevel = Math.min(1, Math.max(0, audioLevel));

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Avatar container */}
            <div className="relative">
                {/* Outer glow / ambient light */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        boxShadow: isSpeaking
                            ? `0 0 ${40 + clampedLevel * 60}px ${8 + clampedLevel * 20}px oklch(0.768 0.233 130.85 / ${0.15 + clampedLevel * 0.25})`
                            : isThinking
                              ? "0 0 40px 8px oklch(0.768 0.233 130.85 / 0.1)"
                              : "0 0 20px 4px oklch(0.768 0.233 130.85 / 0.05)",
                    }}
                    transition={{
                        duration: isSpeaking ? 0.15 : 1.5,
                        ease: "easeOut",
                    }}
                    style={{ width: 220, height: 220 }}
                />

                {/* Concentric ripple rings — visible when speaking */}
                {isSpeaking &&
                    ripples.map((i) => (
                        <motion.div
                            key={`ripple-${i}`}
                            className="absolute top-1/2 left-1/2 rounded-full border border-primary/30"
                            initial={{
                                width: 220,
                                height: 220,
                                x: "-50%",
                                y: "-50%",
                                opacity: 0.6,
                            }}
                            animate={{
                                width: 220 + (i + 1) * 50 + clampedLevel * 30,
                                height: 220 + (i + 1) * 50 + clampedLevel * 30,
                                opacity: 0,
                            }}
                            transition={{
                                duration: 2,
                                delay: i * 0.4,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                {/* Thinking orbital ring */}
                {isThinking && (
                    <motion.div
                        className="absolute top-1/2 left-1/2"
                        style={{
                            width: 260,
                            height: 260,
                            x: "-50%",
                            y: "-50%",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        {orbitalDots.map((i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            const x = Math.cos(angle) * 130 + 130;
                            const y = Math.sin(angle) * 130 + 130;
                            return (
                                <motion.div
                                    key={`dot-${i}`}
                                    className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                                    style={{ left: x - 3, top: y - 3 }}
                                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.25,
                                        repeat: Infinity,
                                    }}
                                />
                            );
                        })}
                    </motion.div>
                )}

                {/* Gradient border ring */}
                <motion.div
                    className="relative rounded-full p-[3px]"
                    style={{
                        width: 220,
                        height: 220,
                        background: isSpeaking
                            ? "conic-gradient(from 0deg, oklch(0.768 0.233 130.85), oklch(0.7 0.18 160), oklch(0.768 0.233 130.85), oklch(0.65 0.2 100), oklch(0.768 0.233 130.85))"
                            : isThinking
                              ? "conic-gradient(from 0deg, oklch(0.768 0.233 130.85 / 0.6), oklch(0.5 0.1 130.85 / 0.2), oklch(0.768 0.233 130.85 / 0.6))"
                              : "conic-gradient(from 0deg, oklch(0.768 0.233 130.85 / 0.3), oklch(0.5 0.05 130.85 / 0.1), oklch(0.768 0.233 130.85 / 0.3))",
                    }}
                    animate={
                        isSpeaking
                            ? { rotate: 360, scale: 1 + clampedLevel * 0.04 }
                            : isThinking
                              ? { rotate: 360 }
                              : { rotate: 0, scale: 1 }
                    }
                    transition={
                        isSpeaking
                            ? {
                                  rotate: {
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "linear",
                                  },
                                  scale: { duration: 0.15, ease: "easeOut" },
                              }
                            : isThinking
                              ? {
                                    rotate: {
                                        duration: 12,
                                        repeat: Infinity,
                                        ease: "linear",
                                    },
                                }
                              : { duration: 0.5 }
                    }
                >
                    {/* Inner avatar face — generative mesh gradient */}
                    <div className="w-full h-full rounded-full bg-background overflow-hidden relative">
                        {/* Base mesh gradient */}
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "radial-gradient(ellipse at 30% 30%, oklch(0.768 0.233 130.85 / 0.15), transparent 60%), radial-gradient(ellipse at 70% 60%, oklch(0.65 0.18 160 / 0.12), transparent 55%), radial-gradient(ellipse at 50% 80%, oklch(0.7 0.12 100 / 0.1), transparent 50%)",
                            }}
                            animate={
                                isSpeaking
                                    ? { opacity: [0.6, 1, 0.6] }
                                    : { opacity: 1 }
                            }
                            transition={
                                isSpeaking
                                    ? { duration: 0.3, repeat: Infinity }
                                    : { duration: 1 }
                            }
                        />

                        {/* Dynamic mesh blobs reacting to audio */}
                        {meshPoints.map((point) => (
                            <motion.div
                                key={point.id}
                                className="absolute rounded-full"
                                style={{
                                    width: 80 + point.id * 10,
                                    height: 80 + point.id * 10,
                                    background: `radial-gradient(circle, oklch(0.768 0.233 130.85 / ${0.08 + point.id * 0.02}), transparent 70%)`,
                                    left: `${30 + Math.cos((point.angle * Math.PI) / 180) * 25}%`,
                                    top: `${30 + Math.sin((point.angle * Math.PI) / 180) * 25}%`,
                                }}
                                animate={
                                    isSpeaking
                                        ? {
                                              scale: [
                                                  1,
                                                  1.2 +
                                                      clampedLevel *
                                                          0.5 *
                                                          (1 +
                                                              Math.sin(
                                                                  point.id,
                                                              ) *
                                                                  0.3),
                                                  1,
                                              ],
                                              x: [
                                                  0,
                                                  Math.cos(
                                                      (point.angle * Math.PI) /
                                                          180,
                                                  ) *
                                                      (10 + clampedLevel * 15),
                                                  0,
                                              ],
                                              y: [
                                                  0,
                                                  Math.sin(
                                                      (point.angle * Math.PI) /
                                                          180,
                                                  ) *
                                                      (10 + clampedLevel * 15),
                                                  0,
                                              ],
                                          }
                                        : isThinking
                                          ? {
                                                scale: [1, 1.1, 1],
                                                opacity: [0.5, 0.8, 0.5],
                                            }
                                          : isListening
                                            ? { scale: [1, 1.03, 1] }
                                            : { scale: 1 }
                                }
                                transition={{
                                    duration: isSpeaking
                                        ? 0.5 + point.delay * 0.2
                                        : 3 + point.delay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: point.delay * 0.1,
                                }}
                            />
                        ))}

                        {/* Center abstract face element — stylized eyes/expression */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-24 h-24">
                                {/* Left eye */}
                                <motion.div
                                    className="absolute left-3 top-5 w-4 h-4 rounded-full"
                                    style={{
                                        background:
                                            "radial-gradient(circle, oklch(0.768 0.233 130.85 / 0.9), oklch(0.768 0.233 130.85 / 0.3) 70%)",
                                    }}
                                    animate={
                                        isSpeaking
                                            ? {
                                                  scale: [
                                                      1,
                                                      1.1 + clampedLevel * 0.2,
                                                      1,
                                                  ],
                                              }
                                            : isThinking
                                              ? { scale: [1, 0.8, 1] }
                                              : { scale: 1 }
                                    }
                                    transition={{
                                        duration: isSpeaking ? 0.4 : 2,
                                        repeat: Infinity,
                                    }}
                                />
                                {/* Right eye */}
                                <motion.div
                                    className="absolute right-3 top-5 w-4 h-4 rounded-full"
                                    style={{
                                        background:
                                            "radial-gradient(circle, oklch(0.768 0.233 130.85 / 0.9), oklch(0.768 0.233 130.85 / 0.3) 70%)",
                                    }}
                                    animate={
                                        isSpeaking
                                            ? {
                                                  scale: [
                                                      1,
                                                      1.1 + clampedLevel * 0.2,
                                                      1,
                                                  ],
                                              }
                                            : isThinking
                                              ? { scale: [1, 0.8, 1] }
                                              : { scale: 1 }
                                    }
                                    transition={{
                                        duration: isSpeaking ? 0.4 : 2,
                                        repeat: Infinity,
                                        delay: 0.1,
                                    }}
                                />
                                {/* Mouth / voice waveform line */}
                                <motion.div
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
                                    animate={
                                        isSpeaking
                                            ? {
                                                  width: [
                                                      16,
                                                      24 + clampedLevel * 16,
                                                      16,
                                                  ],
                                                  height: [
                                                      3,
                                                      6 + clampedLevel * 8,
                                                      3,
                                                  ],
                                                  borderRadius: [
                                                      "9999px",
                                                      `${4 + clampedLevel * 6}px`,
                                                      "9999px",
                                                  ],
                                              }
                                            : isThinking
                                              ? {
                                                    width: [16, 20, 16],
                                                    height: 3,
                                                }
                                              : { width: 16, height: 3 }
                                    }
                                    transition={{
                                        duration: isSpeaking ? 0.25 : 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        background:
                                            "oklch(0.768 0.233 130.85 / 0.7)",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Thinking indicator overlay */}
                        {isThinking && (
                            <motion.div
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <IconBrain className="w-3 h-3 text-primary" />
                                <motion.span
                                    className="text-[10px] font-medium text-primary"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                    }}
                                >
                                    Thinking...
                                </motion.span>
                            </motion.div>
                        )}

                        {/* Listening indicator */}
                        {isListening && !isSpeaking && !isThinking && (
                            <motion.div
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Animated listening bars */}
                                <div className="flex items-end gap-[2px] h-3">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-[3px] rounded-full bg-primary"
                                            animate={{
                                                height: [4, 10, 4],
                                            }}
                                            transition={{
                                                duration: 0.8,
                                                delay: i * 0.15,
                                                repeat: Infinity,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    Listening
                                </span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Name & role label */}
            <div className="text-center">
                <motion.h3
                    className="font-heading text-lg font-semibold text-foreground"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {name}
                </motion.h3>
                <motion.p
                    className="text-sm text-muted-foreground mt-0.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {role}
                </motion.p>
                {/* Status indicator */}
                <motion.div
                    className="flex items-center justify-center gap-1.5 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${
                            isSpeaking
                                ? "bg-primary"
                                : isThinking
                                  ? "bg-yellow-500"
                                  : "bg-muted-foreground/40"
                        }`}
                        animate={
                            isSpeaking || isThinking
                                ? { scale: [1, 1.4, 1] }
                                : { scale: 1 }
                        }
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                        {isSpeaking
                            ? "Speaking"
                            : isThinking
                              ? "Processing"
                              : isListening
                                ? "Listening to you"
                                : "Ready"}
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
