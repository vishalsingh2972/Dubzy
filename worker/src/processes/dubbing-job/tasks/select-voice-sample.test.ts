import { describe, expect, it } from "vitest";
import { selectVoiceSampleWindow } from "./select-voice-sample.js";
import type { TranscriptSegment } from "../types.js";

const createSegment = (
  index: number,
  sourceText: string,
  startTimeSeconds: number,
  endTimeSeconds: number,
): TranscriptSegment => ({
  index,
  sourceText,
  startTimeSeconds,
  endTimeSeconds,
  speakerId: null,
  emotion: null,
});

describe("selectVoiceSampleWindow", () => {
  it("selects a speech-dense segment and keeps it within sample bounds", () => {
    const sample = selectVoiceSampleWindow([
      createSegment(0, "Hi", 0, 2),
      createSegment(
        1,
        "This is a cleaner and longer sample for cloning the speaker voice.",
        10,
        18,
      ),
    ]);

    expect(sample).toEqual({
      startTimeSeconds: 10,
      durationSeconds: 8,
    });
  });

  it("falls back to the beginning when no timed speech exists", () => {
    expect(selectVoiceSampleWindow([])).toEqual({
      startTimeSeconds: 0,
      durationSeconds: 12,
    });
  });
});
