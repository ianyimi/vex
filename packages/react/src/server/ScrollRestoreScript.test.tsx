import { describe, expect, it } from "vitest";

import { buildScrollRestoreInitScript, ScrollRestoreScript } from "./ScrollRestoreScript";

function makeElement(key: string | null, initialScrollTop = 0) {
  return {
    nodeType: 1,
    getAttribute: (name: string) => (name === "data-vex-scroll-key" ? key : null),
    hasAttribute: (name: string) => name === "data-vex-scroll-key" && key !== null,
    scrollTop: initialScrollTop,
  };
}

function runScript(props: { existing?: ReturnType<typeof makeElement>[]; sessionValues?: Record<string, string> }) {
  const existing = props.existing ?? [];
  const sessionValues = props.sessionValues ?? {};
  let observerCallback: ((mutations: Array<{ addedNodes: unknown[] }>) => void) | null = null;
  let observedTarget: unknown = null;
  let disconnected = false;
  let loadHandler: (() => void) | null = null;

  const mockDocument = {
    querySelectorAll: (selector: string) => (selector === "[data-vex-scroll-key]" ? existing : []),
    documentElement: {},
  };
  const mockSessionStorage = {
    getItem: (key: string) => (key in sessionValues ? sessionValues[key] : null),
  };
  class MockMutationObserver {
    constructor(callback: (mutations: Array<{ addedNodes: unknown[] }>) => void) {
      observerCallback = callback;
    }
    observe(target: unknown) {
      observedTarget = target;
    }
    disconnect() {
      disconnected = true;
    }
  }
  const mockWindow = {
    addEventListener: (event: string, handler: () => void) => {
      if (event === "load") loadHandler = handler;
    },
  };

  const run = new Function("document", "sessionStorage", "MutationObserver", "window", buildScrollRestoreInitScript());
  run(mockDocument, mockSessionStorage, MockMutationObserver, mockWindow);

  return {
    fireMutation: (addedNodes: unknown[]) => observerCallback?.([{ addedNodes }]),
    observedTarget: () => observedTarget,
    disconnected: () => disconnected,
    fireLoad: () => loadHandler?.(),
  };
}

describe("buildScrollRestoreInitScript", () => {
  it("embeds the shared sessionStorage prefix and the data attribute it watches for", () => {
    const script = buildScrollRestoreInitScript();
    expect(script).toContain("'vex-admin:edit-scroll:'");
    expect(script).toContain("data-vex-scroll-key");
    expect(script).toContain("MutationObserver");
  });
});

describe("ScrollRestoreScript", () => {
  it("renders a script element wrapping buildScrollRestoreInitScript's output", () => {
    const element = ScrollRestoreScript();
    expect(element.type).toBe("script");
    expect(element.props.dangerouslySetInnerHTML).toEqual({ __html: buildScrollRestoreInitScript() });
    expect(element.props.suppressHydrationWarning).toBe(true);
  });
});

describe("buildScrollRestoreInitScript — execution", () => {
  it("restores an element already present when the script runs", () => {
    const el = makeElement("posts:doc1");
    runScript({ existing: [el], sessionValues: { "vex-admin:edit-scroll:posts:doc1": "742" } });
    expect(el.scrollTop).toBe(742);
  });

  it("restores an element that streams in later, via the MutationObserver", () => {
    const el = makeElement("posts:doc1");
    const { fireMutation } = runScript({ sessionValues: { "vex-admin:edit-scroll:posts:doc1": "99" } });
    fireMutation([el]);
    expect(el.scrollTop).toBe(99);
  });

  it("never re-applies the same key twice", () => {
    const first = makeElement("posts:doc1");
    const second = makeElement("posts:doc1", 0);
    const { fireMutation } = runScript({ existing: [first], sessionValues: { "vex-admin:edit-scroll:posts:doc1": "50" } });
    expect(first.scrollTop).toBe(50);
    first.scrollTop = 10;
    fireMutation([second]);
    expect(second.scrollTop).toBe(0);
  });

  it("leaves an element untouched when it has no data-vex-scroll-key", () => {
    const el = makeElement(null);
    runScript({ existing: [el], sessionValues: {} });
    expect(el.scrollTop).toBe(0);
  });

  it("observes the whole document and disconnects on window load", () => {
    const { observedTarget, disconnected, fireLoad } = runScript({});
    expect(observedTarget()).not.toBeNull();
    expect(disconnected()).toBe(false);
    fireLoad();
    expect(disconnected()).toBe(true);
  });
});
