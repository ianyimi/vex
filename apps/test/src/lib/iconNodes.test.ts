import { collectIconNames } from "./iconNodes"

describe("collectIconNames", () => {
  it("finds nested icon strings in arrays and objects, ignores non-string icon values, and dedupes", () => {
    const documents = [
      {
        blocks: [
          { icon: "LayoutGrid", title: "Features" },
          { items: [{ icon: "Grid2x2" }, { icon: "LayoutGrid" }] },
        ],
      },
      { footer: { links: [{ icon: 42 }, { nested: { icon: "FileText" } }] } },
    ]

    expect(collectIconNames({ documents })).toEqual(new Set(["FileText", "Grid2x2", "LayoutGrid"]))
  })
})
