import { describe, it, expect } from "vitest";
import { toTitleCase } from "./utils";

describe("toTitleCase", () => {
  it("capitalizes a single word", () => {
    expect(toTitleCase("title")).toBe("Title");
  });

  it("splits camelCase into separate words", () => {
    expect(toTitleCase("firstName")).toBe("First Name");
  });

  it("splits snake_case into separate words", () => {
    expect(toTitleCase("first_name")).toBe("First Name");
  });

  it("splits kebab-case into separate words", () => {
    expect(toTitleCase("first-name")).toBe("First Name");
  });

  it("lowercases minor words in non-first position", () => {
    expect(toTitleCase("lord of the rings")).toBe("Lord of the Rings");
  });

  it("always capitalizes the first word even if minor", () => {
    expect(toTitleCase("the great gatsby")).toBe("The Great Gatsby");
  });

  it("handles multiple minor words", () => {
    expect(toTitleCase("war and peace")).toBe("War and Peace");
  });

  it("handles all-caps input", () => {
    expect(toTitleCase("HELLO WORLD")).toBe("Hello World");
  });

  it("handles single character", () => {
    expect(toTitleCase("a")).toBe("A");
  });

  it("handles empty string", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("handles camelCase with minor words", () => {
    expect(toTitleCase("dateOfBirth")).toBe("Date of Birth");
  });
});
