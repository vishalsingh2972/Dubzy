import { normalizeSarvamLanguageCode } from "../../lib/providers/sarvam-languages.js";

export const AUTO_SOURCE_LANGUAGE_CODE = "auto";

export const resolveSourceLanguage = (input: {
  requestedSourceLanguage: string;
  detectedSourceLanguage: string | null;
}) => {
  const detectedLanguage = input.detectedSourceLanguage
    ? normalizeSarvamLanguageCode(input.detectedSourceLanguage)
    : null;

  if (input.requestedSourceLanguage === AUTO_SOURCE_LANGUAGE_CODE) {
    if (!detectedLanguage) {
      throw new Error(
        "Could not detect a supported source language for this video",
      );
    }

    return detectedLanguage;
  }

  const requestedLanguage = normalizeSarvamLanguageCode(
    input.requestedSourceLanguage,
  );

  if (!requestedLanguage) {
    throw new Error(
      `Source language "${input.requestedSourceLanguage}" is not supported for dubbing`,
    );
  }

  return requestedLanguage;
};

export const assertDifferentDubbingLanguages = (input: {
  sourceLanguage: string;
  targetLanguage: string;
}) => {
  const sourceLanguage = normalizeSarvamLanguageCode(input.sourceLanguage);
  const targetLanguage = normalizeSarvamLanguageCode(input.targetLanguage);

  if (!sourceLanguage || !targetLanguage) {
    return;
  }

  if (sourceLanguage === targetLanguage) {
    throw new Error("Source and target languages must be different");
  }
};
