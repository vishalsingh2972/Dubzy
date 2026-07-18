import { translateText } from "../../../lib/providers/sarvam.js";
import type { TranscriptSegment } from "../types.js";

type TranslateTranscriptTaskInput = {
  segments: TranscriptSegment[];
  sourceLanguage: string;
  targetLanguage: string;
};

export const translateTranscript = async ({
  segments,
  sourceLanguage,
  targetLanguage,
}: TranslateTranscriptTaskInput): Promise<TranscriptSegment[]> => {
  const translatedSegments: TranscriptSegment[] = [];

  for (const segment of segments) {
    const translatedText = await translateText({
      text: segment.sourceText,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
    });

    translatedSegments.push({
      ...segment,
      translatedText,
    });
  }

  return translatedSegments;
};
