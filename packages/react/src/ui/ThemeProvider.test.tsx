import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";

const STORAGE_KEY = "vex-theme";

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("applies .dark synchronously from a stored theme, overriding defaultTheme", () => {
    localStorage.setItem(STORAGE_KEY, "dark");

    render(
      <ThemeProvider defaultTheme="light">
        <div>child</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("removes .dark synchronously when the stored theme is light, overriding defaultTheme", () => {
    localStorage.setItem(STORAGE_KEY, "light");

    render(
      <ThemeProvider defaultTheme="dark">
        <div>child</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies defaultTheme synchronously when nothing is stored", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div>child</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads a non-default storageKey", () => {
    localStorage.setItem("custom-theme", "dark");

    render(
      <ThemeProvider defaultTheme="light" storageKey="custom-theme">
        <div>child</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
