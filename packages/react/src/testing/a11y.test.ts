import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "./a11y";

describe("expectNoA11yViolations", () => {
  it("rejects markup with an accessibility violation", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<input type="text" />';

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/);
  });

  it("resolves for accessible markup", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<label for="name">Name</label><input id="name" type="text" />';

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
