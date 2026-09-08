import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { usePermission } from "../../hooks/usePermission";
import { renderWithVexProviders, testAccess, testCollection, testUsers } from "./accessFixtures";

/** Renders a fixed `posts`/`read` check so each scenario below asserts one boolean. */
function ReadProbe(props: { data?: { status: string } }) {
  const allowed = usePermission({
    resource: testCollection.slug,
    action: "read",
    data: props.data,
  } as never);
  return createElement("span", { "data-testid": "probe" }, String(allowed));
}

describe("accessFixtures", () => {
  it("none: no access config resolves the literal-check escape hatch (true)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.none,
    });
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("anonymous: access configured but no user fails closed (false)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.anonymous,
    });
    expect(getByTestId("probe").textContent).toBe("false");
  });

  it("denied: role has no grants on testCollection (false)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.denied,
      auth: { user: testUsers.denied },
    });
    expect(getByTestId("probe").textContent).toBe("false");
  });

  it('allowed: role has "*": true (true)', () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.allowed,
      auth: { user: testUsers.allowed },
    });
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("scoped: allows a document that satisfies the doc-scoped constraint", () => {
    const { getByTestId } = renderWithVexProviders(
      createElement(ReadProbe, { data: { status: "published" } }),
      { access: testAccess.scoped, auth: { user: testUsers.scoped } },
    );
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("scoped: denies a document that fails the doc-scoped constraint", () => {
    const { getByTestId } = renderWithVexProviders(
      createElement(ReadProbe, { data: { status: "draft" } }),
      { access: testAccess.scoped, auth: { user: testUsers.scoped } },
    );
    expect(getByTestId("probe").textContent).toBe("false");
  });
});
