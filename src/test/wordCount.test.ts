import { describe, it, expect } from "vitest";

const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
};

describe("getWordCount", () => {
    it("should return 0 for empty string", () => {
        expect(getWordCount("")).toBe(0);
    });

    it("should return 0 for string with only whitespace", () => {
        expect(getWordCount("   \n\t  ")).toBe(0);
    });

    it("should count single word", () => {
        expect(getWordCount("Hello")).toBe(1);
    });

    it("should count multiple words", () => {
        expect(getWordCount("Hello world from Vitest")).toBe(4);
    });

    it("should handle multiple spaces and newlines", () => {
        expect(getWordCount("  Hello   world  \n  test  ")).toBe(3);
    });

    it("should handle long text", () => {
        const text = "word ".repeat(300);
        expect(getWordCount(text)).toBe(300);
    });
});
