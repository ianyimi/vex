import { describe, expect, test } from "vitest";
import type { TDocument } from "@vexcms/core";
import { collapseVersionedPairs } from "./utils";

function doc(overrides: Partial<TDocument> & { _id: string }): TDocument {
  return { _creationTime: 0, ...overrides } as TDocument;
}

describe("collapseVersionedPairs", () => {
  test("prefers the draft's fields and flags an unpublished-changes pair", () => {
    const published = doc({
      _id: "pub1",
      vex_status: "published",
      title: "Old title",
    });
    const draft = doc({
      _id: "draft1",
      vex_status: "draft",
      vex_publishedId: "pub1",
      title: "New title",
    });

    expect(collapseVersionedPairs({ documents: [published, draft] })).toEqual([
      { ...draft, hasUnpublishedChanges: true },
    ]);
  });

  test("keeps a standalone published row unflagged", () => {
    const published = doc({
      _id: "pub1",
      vex_status: "published",
      title: "Only version",
    });

    expect(collapseVersionedPairs({ documents: [published] })).toEqual([
      { ...published, hasUnpublishedChanges: false },
    ]);
  });

  test("keeps a never-published draft-only row unflagged — stands alone, never suppressed", () => {
    const draft = doc({
      _id: "draft1",
      vex_status: "draft",
      title: "Unpublished new page",
    });

    expect(collapseVersionedPairs({ documents: [draft] })).toEqual([
      { ...draft, hasUnpublishedChanges: false },
    ]);
  });

  test("treats a row with no vex_status (a non-versioned row sharing the table) as published", () => {
    const legacy = doc({ _id: "legacy1", title: "Predates versioning" });

    expect(collapseVersionedPairs({ documents: [legacy] })).toEqual([
      { ...legacy, hasUnpublishedChanges: false },
    ]);
  });

  test("collapses multiple independent documents — paired, standalone, and draft-only — without cross-contamination", () => {
    const pubA = doc({
      _id: "a-pub",
      vex_status: "published",
      title: "A published",
    });
    const draftA = doc({
      _id: "a-draft",
      vex_status: "draft",
      vex_publishedId: "a-pub",
      title: "A edited",
    });
    const pubB = doc({
      _id: "b-pub",
      vex_status: "published",
      title: "B published",
    });
    const soloDraft = doc({
      _id: "c-draft",
      vex_status: "draft",
      title: "C never published",
    });

    const result = collapseVersionedPairs({
      documents: [pubA, draftA, pubB, soloDraft],
    });

    expect(result).toEqual([
      { ...draftA, hasUnpublishedChanges: true },
      { ...pubB, hasUnpublishedChanges: false },
      { ...soloDraft, hasUnpublishedChanges: false },
    ]);
  });
});
