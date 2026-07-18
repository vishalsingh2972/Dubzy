import { describe, expect, it } from "vitest";
import { toSmallestLanguageCode } from "./smallest-languages.js";

describe("Smallest language mapping", () => {
  it.each([
    ["bn-IN", "bn"],
    ["en-IN", "en"],
    ["gu-IN", "gu"],
    ["hi-IN", "hi"],
    ["kn-IN", "kn"],
    ["ml-IN", "ml"],
    ["mr-IN", "mr"],
    ["od-IN", "or"],
    ["pa-IN", "pa"],
    ["ta-IN", "ta"],
    ["te-IN", "te"],
  ])("maps %s to %s", (input, expected) => {
    expect(toSmallestLanguageCode(input)).toBe(expected);
  });
});
