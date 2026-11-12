import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  LIVE_PREVIEW_WINDOW_NAME,
} from "@vexcms/core";
import { useIsLivePreviewActive } from "./useIsLivePreviewActive";

function setPreviewCookie(value: "1" | "0") {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=${value}; path=/`;
}

function setSearch(search: string) {
  window.history.replaceState({}, "", search === "" ? "/" : `/?${search}`);
}

function readIsActive(): boolean {
  return renderHook(() => useIsLivePreviewActive()).result.current;
}

afterEach(() => {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=; path=/; max-age=0`;
  setSearch("");
  window.name = "";
});

describe("useIsLivePreviewActive", () => {
  it("is on with the query param and the verified cookie", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    expect(readIsActive()).toBe(true);
  });

  it("stays on after a navigation dropped the query param, through the preview window name", () => {
    window.name = LIVE_PREVIEW_WINDOW_NAME;
    setPreviewCookie("1");
    expect(readIsActive()).toBe(true);
  });

  it("is off with the query param alone — an unverified visitor", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    expect(readIsActive()).toBe(false);
  });

  it("is off with the preview window name alone — the session marker expired", () => {
    window.name = LIVE_PREVIEW_WINDOW_NAME;
    expect(readIsActive()).toBe(false);
  });

  it("is off with the verified cookie in a window that never asked to preview", () => {
    setPreviewCookie("1");
    expect(readIsActive()).toBe(false);
  });

  it("is off under any window name other than the preview name", () => {
    window.name = "editor-target";
    setPreviewCookie("1");
    expect(readIsActive()).toBe(false);
  });

  it("is off when the marker cookie holds anything other than the verified value", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("0");
    expect(readIsActive()).toBe(false);
  });
});
