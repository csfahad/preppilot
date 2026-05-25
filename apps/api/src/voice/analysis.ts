// voice analysis utilities
// post-processing on transcripts for filler words, pace, etc

const FILLER_WORDS = [
    "um",
    "uh",
    "uhh",
    "umm",
    "like", // when used as filler, not comparison
    "you know",
    "basically",
    "actually",
    "literally",
    "sort of",
    "kind of",
    "right",
    "so", // at start of sentences as filler
    "well", // at start as filler
    "I mean",
    "honestly",
];

export function detectFillerWords(transcript: string): {
    count: number;
    words: Array<{ word: string; count: number }>;
} {
    const lower = transcript.toLowerCase();
    const results: Array<{ word: string; count: number }> = [];

    for (const filler of FILLER_WORDS) {
        // use word boundary matching to avoid false positives
        const regex = new RegExp(`\\b${filler}\\b`, "gi");
        const matches = lower.match(regex);
        if (matches && matches.length > 0) {
            results.push({ word: filler, count: matches.length });
        }
    }

    return {
        count: results.reduce((sum, r) => sum + r.count, 0),
        words: results.sort((a, b) => b.count - a.count),
    };
}

export function calculatePaceWPM(
    transcript: string,
    durationSeconds: number,
): { wpm: number; assessment: "too_slow" | "good" | "too_fast" } {
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;
    const minutes = durationSeconds / 60;
    const wpm = Math.round(wordCount / minutes);

    let assessment: "too_slow" | "good" | "too_fast";
    if (wpm < 100) {
        assessment = "too_slow";
    } else if (wpm > 180) {
        assessment = "too_fast";
    } else {
        assessment = "good";
    }

    return { wpm, assessment };
}

export function analyzeResponseQuality(transcript: string): {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    isVerbose: boolean;
    isTooShort: boolean;
} {
    const words = transcript.split(/\s+/).filter(Boolean);
    const sentences = transcript
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence =
        sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

    return {
        wordCount,
        sentenceCount,
        avgWordsPerSentence,
        isVerbose: wordCount > 400,
        isTooShort: wordCount < 30,
    };
}
