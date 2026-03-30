import { describe, it, expect } from "vitest";
import { cn, formatResponseTime } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatResponseTime", () => {
  it("formats sub-minute values as 1m minimum", () => {
    expect(formatResponseTime(30_000)).toBe("1m");
  });

  it("formats minutes", () => {
    expect(formatResponseTime(45 * 60_000)).toBe("45m");
  });

  it("formats hours", () => {
    expect(formatResponseTime(2.3 * 3_600_000)).toBe("2.3h");
  });

  it("formats days", () => {
    expect(formatResponseTime(1.5 * 86_400_000)).toBe("1.5d");
  });

  it("formats exactly 1 hour as hours", () => {
    expect(formatResponseTime(3_600_000)).toBe("1h");
  });

  it("formats exactly 1 day as days", () => {
    expect(formatResponseTime(86_400_000)).toBe("1d");
  });
});
