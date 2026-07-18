import type { TranscriptSegment } from "../types.js";

type Segmenter = {
  segment(input: string): Iterable<{ segment: string }>;
};

type IntlWithSegmenter = typeof Intl & {
  Segmenter?: new (
    locales?: string | string[],
    options?: { granularity?: "sentence" },
  ) => Segmenter;
};

const sentenceBoundaryPattern =
  /[^.!?\u0964\u3002\uff01\uff1f]+(?:[.!?\u0964\u3002\uff01\uff1f]+|$)/gu;

const splitWithFallback = (text: string) => {
  const matches = Array.from(text.matchAll(sentenceBoundaryPattern), (match) =>
    match[0].trim(),
  ).filter((sentence) => sentence.length > 0);

  return matches.length > 0 ? matches : [text.trim()].filter(Boolean);
};

const splitSentences = (text: string, languageCode: string) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return [];
  }

  const SegmenterConstructor = (Intl as IntlWithSegmenter).Segmenter;

  if (!SegmenterConstructor) {
    return splitWithFallback(trimmedText);
  }

  try {
    const segmenter = new SegmenterConstructor(languageCode, {
      granularity: "sentence",
    });
    const sentences = Array.from(segmenter.segment(trimmedText), (entry) =>
      entry.segment.trim(),
    ).filter((sentence) => sentence.length > 0);

    return sentences.length > 0 ? sentences : splitWithFallback(trimmedText);
  } catch {
    return splitWithFallback(trimmedText);
  }
};

const getSentenceWeights = (sentences: string[]) => {
  const weights = sentences.map((sentence) =>
    Math.max(1, Array.from(sentence).filter((char) => !/\s/u.test(char)).length),
  );
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);

  return { weights, totalWeight };
};

type SegmentTranscriptSentencesInput = {
  segments: TranscriptSegment[];
  languageCode: string;
  fallbackDurationSeconds?: number;
};

export const segmentTranscriptSentences = ({
  segments,
  languageCode,
  fallbackDurationSeconds,
}: SegmentTranscriptSentencesInput): TranscriptSegment[] => {
  const sentenceSegments: TranscriptSegment[] = [];
  const fallbackEndTimeSeconds =
    typeof fallbackDurationSeconds === "number" &&
    Number.isFinite(fallbackDurationSeconds) &&
    fallbackDurationSeconds > 0
      ? fallbackDurationSeconds
      : null;

  for (const segment of segments) {
    const sentences = splitSentences(segment.sourceText, languageCode);

    if (sentences.length === 0) {
      continue;
    }

    const segmentStart = Math.max(0, segment.startTimeSeconds);
    const rawSegmentEnd = Math.max(segmentStart, segment.endTimeSeconds);
    const segmentEnd =
      rawSegmentEnd > segmentStart
        ? rawSegmentEnd
        : segments.length === 1 && fallbackEndTimeSeconds !== null
          ? fallbackEndTimeSeconds
          : segmentStart;
    const segmentDuration = segmentEnd - segmentStart;
    const { weights, totalWeight } = getSentenceWeights(sentences);
    let cursorSeconds = segmentStart;

    for (const [sentenceIndex, sentence] of sentences.entries()) {
      const isLastSentence = sentenceIndex === sentences.length - 1;
      const weight = weights[sentenceIndex] ?? 1;
      const sentenceDuration =
        totalWeight > 0 ? segmentDuration * (weight / totalWeight) : 0;
      const endTimeSeconds = isLastSentence
        ? segmentEnd
        : Math.min(segmentEnd, cursorSeconds + sentenceDuration);

      sentenceSegments.push({
        ...segment,
        index: sentenceSegments.length,
        sourceText: sentence,
        translatedText: undefined,
        startTimeSeconds: cursorSeconds,
        endTimeSeconds,
        metadata: {
          ...segment.metadata,
          parentSegmentIndex: segment.index,
          sentenceIndex,
        },
      });

      cursorSeconds = endTimeSeconds;
    }
  }

  return sentenceSegments;
};
