import { describe, expect, it } from "vitest";
import {
  assertDifferentDubbingLanguages,
  resolveSourceLanguage,
} from "./languages.js";

describe("dubbing job language helpers", () => {
  it("uses detected language when source is auto", () => {
    expect(
      resolveSourceLanguage({
        requestedSourceLanguage: "auto",
        detectedSourceLanguage: "hi-IN",
      }),
    ).toBe("hi-IN");
  });

  it("uses manual source language when provided", () => {
    expect(
      resolveSourceLanguage({
        requestedSourceLanguage: "en-IN",
        detectedSourceLanguage: "hi-IN",
      }),
    ).toBe("en-IN");
  });

  it("rejects unsupported auto-detected source languages", () => {
    expect(() =>
      resolveSourceLanguage({
        requestedSourceLanguage: "auto",
        detectedSourceLanguage: "ur-IN",
      }),
    ).toThrow("Could not detect a supported source language");
  });

  it("rejects matching source and target languages", () => {
    expect(() =>
      assertDifferentDubbingLanguages({
        sourceLanguage: "od-IN",
        targetLanguage: "or",
      }),
    ).toThrow("Source and target languages must be different");
  });
});
