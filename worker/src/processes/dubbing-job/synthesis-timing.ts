const MIN_TTS_SPEED = 0.85;
const MAX_TTS_SPEED = 1.25;
const RESYNTHESIS_TOLERANCE_SECONDS = 0.15;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const calculateTtsSpeed = (input: {
  rawDurationSeconds: number;
  targetDurationSeconds: number;
}) => {
  if (
    !Number.isFinite(input.rawDurationSeconds) ||
    input.rawDurationSeconds <= 0 ||
    !Number.isFinite(input.targetDurationSeconds) ||
    input.targetDurationSeconds <= 0
  ) {
    return 1;
  }

  const durationDelta = Math.abs(
    input.rawDurationSeconds - input.targetDurationSeconds,
  );

  if (durationDelta <= RESYNTHESIS_TOLERANCE_SECONDS) {
    return 1;
  }

  return clamp(
    input.rawDurationSeconds / input.targetDurationSeconds,
    MIN_TTS_SPEED,
    MAX_TTS_SPEED,
  );
};
