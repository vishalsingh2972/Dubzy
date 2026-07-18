import { describe, expect, it } from "vitest";
import { calculateTtsSpeed } from "./synthesis-timing.js";

describe("calculateTtsSpeed", () => {
  it("keeps natural speed when duration is already close", () => {
    expect(
      calculateTtsSpeed({
        rawDurationSeconds: 2.1,
        targetDurationSeconds: 2,
      }),
    ).toBe(1);
  });

  it("speeds up long synthesized audio within bounds", () => {
    expect(
      calculateTtsSpeed({
        rawDurationSeconds: 4,
        targetDurationSeconds: 2,
      }),
    ).toBe(1.25);
  });

  it("slows down short synthesized audio within bounds", () => {
    expect(
      calculateTtsSpeed({
        rawDurationSeconds: 1,
        targetDurationSeconds: 2,
      }),
    ).toBe(0.85);
  });
});
