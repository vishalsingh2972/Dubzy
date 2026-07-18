const FRIENDLY_FAILURES: Array<[RegExp, string]> = [
  [
    /single-speaker dubbing is enforced|detected \d+ speakers/i,
    "This video appears to contain multiple speakers. This version supports one-speaker videos only.",
  ],
  [
    /source and target languages must be different/i,
    "The detected source language matches the target language. Choose a different target language.",
  ],
  [
    /could not detect a supported source language/i,
    "We could not detect a supported source language for this video.",
  ],
  [
    /not supported for dubbing|is not supported/i,
    "This language is not supported by the current dubbing model.",
  ],
  [
    /smallest speech synthesis|invalid wav audio|empty audio response/i,
    "Speech synthesis failed while generating the dubbed audio.",
  ],
];

export const getUserSafeDubbingErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Worker failed to process dubbing job";

  const friendlyFailure = FRIENDLY_FAILURES.find(([pattern]) =>
    pattern.test(message),
  );

  return friendlyFailure?.[1] ?? message;
};
