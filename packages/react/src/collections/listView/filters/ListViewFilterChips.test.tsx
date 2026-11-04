import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { adminCollectionCookieName, checkbox, defineAccess, defineCollection, defineConfig, getDataFields, parseAdminCollectionCookie, select, text, type AdminDataField } from "@vexcms/core";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { VexAuthProvider } from "../../../auth/VexAuthContext";
import { LIST_VIEW_FILTER_STATUS_FIELD_KEY } from "./listViewFilterOperators";
import { formatFilterChipValue, ListViewFilterChips, ListViewFilterVisibilityToggle } from "./ListViewFilterChips";

const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true, label: "Title" }) },
});

const labeledFieldsCollection = defineCollection({
  slug: "labeled_posts",
  fields: {
    status: select({
      label: "Source",
      options: [
        { label: "G2", value: "g2" },
        { label: "Site", value: "site" },
      ],
    }),
    active: checkbox({ label: "Active" }),
  },
});

describe("ListViewFilterChips", () => {
  it("renders nothing when where is undefined", () => {
    const { container } = render(
      <ListViewFilterChips
        collection={collection}
        where={undefined}
        onWhereChange={vi.fn()}
        visible={true}
        filterValueTitles={{}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when where is not in DNF form (a `not` node)", () => {
    const { container } = render(
      <ListViewFilterChips
        collection={collection}
        where={{ not: { field: "title", op: "eq", value: "x" } } as never}
        onWhereChange={vi.fn()}
        visible={true}
        filterValueTitles={{}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when visible is false, matching a cookie-hidden eye toggle", () => {
    const { container } = render(
      <ListViewFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={vi.fn()}
        visible={false}
        filterValueTitles={{}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows one chip per row in symbol+code notation, omitting the value segment for isEmpty/isNotEmpty", () => {
    render(
      <ListViewFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: undefined }}
        onWhereChange={vi.fn()}
        visible={true}
        filterValueTitles={{}}
      />
    );
    expect(screen.getByText("Title ∅ empty")).toBeInTheDocument();
  });

  it("a select field's chip resolves the stored value to its option label, not the raw value, matching the FilterInput exactly", () => {
    render(
      <ListViewFilterChips
        collection={labeledFieldsCollection}
        where={{ field: "status", op: "eq", value: "g2" }}
        onWhereChange={vi.fn()}
        visible={true}
        filterValueTitles={{}}
      />
    );
    expect(screen.getByText("Source = eq G2")).toBeInTheDocument();
  });

  it("clears one row via its chip's remove button", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterChips
        collection={collection}
        where={{ or: [{ field: "title", op: "eq", value: "a" }, { field: "title", op: "eq", value: "b" }] }}
        onWhereChange={onWhereChange}
        visible={true}
        filterValueTitles={{}}
      />
    );
    await user.click(screen.getByRole("button", { name: /Remove Title = eq a filter/ }));
    expect(onWhereChange).toHaveBeenCalledWith({ field: "title", op: "eq", value: "b" });
  });

  it("Clear all replaces the whole filter with null, the explicit clear sentinel", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={onWhereChange}
        visible={true}
        filterValueTitles={{}}
      />
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onWhereChange).toHaveBeenCalledWith(null);
  });

  it("removing the LAST remaining chip also passes null, not undefined (same explicit-clear intent as Clear all)", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={onWhereChange}
        visible={true}
        filterValueTitles={{}}
      />
    );
    await user.click(screen.getByRole("button", { name: /Remove Title = eq Hello filter/ }));
    expect(onWhereChange).toHaveBeenCalledWith(null);
  });

  it("hides a chip for a field the viewer can't read, keeping a sibling readable chip (access-system-fields.md decision 2b)", () => {
    const access = defineAccess({
      roles: ["viewer"] as const,
      resources: [labeledFieldsCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: { labeled_posts: { read: () => ({ active: true, status: false }) } },
      },
    });
    render(
      <VexConfigProvider config={defineConfig({ access })}>
        <VexAuthProvider value={{ user: { _id: "u1", roles: "viewer" } }}>
          <ListViewFilterChips
            collection={labeledFieldsCollection}
            where={{ or: [{ field: "status", op: "eq", value: "g2" }, { field: "active", op: "eq", value: true }] }}
            onWhereChange={vi.fn()}
            visible={true}
            filterValueTitles={{}}
          />
        </VexAuthProvider>
      </VexConfigProvider>,
    );
    expect(screen.queryByText(/Source/)).not.toBeInTheDocument();
    expect(screen.getByText("Active = eq True")).toBeInTheDocument();
  });

  it("hides a chip for the synthetic vex_status field when unreadable (access-system-fields.md decision 2b)", () => {
    const access = defineAccess({
      roles: ["viewer"] as const,
      resources: [collection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: {
          posts: { read: () => ({ title: true, [LIST_VIEW_FILTER_STATUS_FIELD_KEY]: false }) as never },
        },
      },
    });
    render(
      <VexConfigProvider config={defineConfig({ access })}>
        <VexAuthProvider value={{ user: { _id: "u1", roles: "viewer" } }}>
          <ListViewFilterChips
            collection={collection}
            where={{
              or: [
                { field: LIST_VIEW_FILTER_STATUS_FIELD_KEY, op: "eq", value: "published" },
                { field: "title", op: "eq", value: "Hello" },
              ],
            }}
            onWhereChange={vi.fn()}
            visible={true}
            filterValueTitles={{}}
          />
        </VexAuthProvider>
      </VexConfigProvider>,
    );
    expect(screen.queryByText(/Status/)).not.toBeInTheDocument();
    expect(screen.getByText("Title = eq Hello")).toBeInTheDocument();
  });
});

describe("formatFilterChipValue", () => {
  const dataFields = getDataFields({ fields: labeledFieldsCollection.fields }) as Record<string, AdminDataField>;

  it("resolves a select field's value to its option label", () => {
    expect(formatFilterChipValue({ field: "status", op: "eq", value: "g2" }, dataFields)).toBe("G2");
  });

  it("falls back to the raw value when it matches no declared option", () => {
    expect(formatFilterChipValue({ field: "status", op: "eq", value: "unknown-value" }, dataFields)).toBe(
      "unknown-value",
    );
  });

  it("resolves a checkbox field's boolean value to True/False", () => {
    expect(formatFilterChipValue({ field: "active", op: "eq", value: true }, dataFields)).toBe("True");
    expect(formatFilterChipValue({ field: "active", op: "eq", value: false }, dataFields)).toBe("False");
  });

  it("resolves the synthetic vex_status field via VERSION_STATUSES, not dataFields (which has no entry for it)", () => {
    expect(
      formatFilterChipValue({ field: LIST_VIEW_FILTER_STATUS_FIELD_KEY, op: "eq", value: "draft" }, dataFields),
    ).toBe("Draft");
    expect(
      formatFilterChipValue({ field: LIST_VIEW_FILTER_STATUS_FIELD_KEY, op: "eq", value: "published" }, dataFields),
    ).toBe("Published");
  });

  it("leaves a plain text value unresolved (String(value), no matching field type branch)", () => {
    const textFields = getDataFields({ fields: collection.fields }) as Record<string, AdminDataField>;
    expect(formatFilterChipValue({ field: "title", op: "eq", value: "Hello" }, textFields)).toBe("Hello");
  });
});

function readChipsVisible(collectionSlug: string): boolean | undefined {
  const name = adminCollectionCookieName({ collection: collectionSlug });
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return parseAdminCollectionCookie({ cookieValue: match?.[1] }).chipsVisible;
}

describe("ListViewFilterVisibilityToggle", () => {
  it("renders nothing when there is no active filter", () => {
    const { container } = render(
      <VexConfigProvider config={{ basePath: "/" } as Parameters<typeof VexConfigProvider>[0]["config"]}>
        <ListViewFilterVisibilityToggle
          collection={collection}
          where={undefined}
          chipsVisible={true}
          onChipsVisibleChange={vi.fn()}
        />
      </VexConfigProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Eye and flips chipsVisible, persisting the consolidated admin cookie, once a filter is active", async () => {
    const user = userEvent.setup();
    const onChipsVisibleChange = vi.fn();
    render(
      <VexConfigProvider config={{ basePath: "/" } as Parameters<typeof VexConfigProvider>[0]["config"]}>
        <ListViewFilterVisibilityToggle
          collection={collection}
          where={{ field: "title", op: "eq", value: "x" }}
          chipsVisible={true}
          onChipsVisibleChange={onChipsVisibleChange}
        />
      </VexConfigProvider>,
    );
    const eyeButton = screen.getByRole("button", { name: "Hide filter chips" });
    await user.click(eyeButton);
    expect(onChipsVisibleChange).toHaveBeenCalledWith(false);
    expect(readChipsVisible("posts")).toBe(false);
  });

  it("shows EyeOff (crossed eye) when an active filter's chips are hidden", () => {
    render(
      <VexConfigProvider config={{ basePath: "/" } as Parameters<typeof VexConfigProvider>[0]["config"]}>
        <ListViewFilterVisibilityToggle
          collection={collection}
          where={{ field: "title", op: "eq", value: "x" }}
          chipsVisible={false}
          onChipsVisibleChange={vi.fn()}
        />
      </VexConfigProvider>,
    );
    expect(screen.getByRole("button", { name: "Show filter chips" })).toBeInTheDocument();
  });
});
