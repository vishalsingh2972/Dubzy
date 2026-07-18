import type { TranscriptSegment } from "../types.js";

const MIN_SAMPLE_SECONDS = 5;
const MAX_SAMPLE_SECONDS = 15;
const DEFAULT_SAMPLE_SECONDS = 12;

const getSegmentDuration = (segment: TranscriptSegment) =>
  Math.max(0, segment.endTimeSeconds - segment.startTimeSeconds);

export const selectVoiceSampleWindow = (segments: TranscriptSegment[]) => {
  const candidates = segments
    .map((segment) => ({
      startTimeSeconds: Math.max(0, segment.startTimeSeconds),
      durationSeconds: getSegmentDuration(segment),
      textWeight: segment.sourceText.trim().length,
    }))
    .filter(
      (segment) =>
        segment.durationSeconds > 0 &&
        segment.textWeight > 0 &&
        segment.durationSeconds <= MAX_SAMPLE_SECONDS,
    )
    .sort((a, b) => {
      const aScore = Math.min(a.durationSeconds, MAX_SAMPLE_SECONDS) + a.textWeight / 100;
      const bScore = Math.min(b.durationSeconds, MAX_SAMPLE_SECONDS) + b.textWeight / 100;
      return bScore - aScore;
    });

  const bestCandidate = candidates[0];

  if (!bestCandidate) {
    return {
      startTimeSeconds: 0,
      durationSeconds: DEFAULT_SAMPLE_SECONDS,
    };
  }

  return {
    startTimeSeconds: bestCandidate.startTimeSeconds,
    durationSeconds: Math.min(
      MAX_SAMPLE_SECONDS,
      Math.max(MIN_SAMPLE_SECONDS, bestCandidate.durationSeconds),
    ),
  };
};
