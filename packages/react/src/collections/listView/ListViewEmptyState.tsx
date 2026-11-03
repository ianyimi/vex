"use client";

import type { ReactNode } from "react";
import { Button } from "../../ui/button";
import { VexLink } from "../../ui/VexLink";

/** Which empty-state copy to show (DESIGN-NOTES.md §5). */
export type ListViewEmptyStateVariant = "empty" | "noSearchResults" | "noFilterResults";

/** Props for {@link ListViewEmptyState}. */
export interface ListViewEmptyStateProps {
  variant: ListViewEmptyStateVariant;
  /** Lowercase plural label, e.g. `"testimonials"`. */
  collectionLabelPlural: string;
  /** Lowercase singular label, e.g. `"testimonial"`. Used only by `"empty"`. */
  collectionLabelSingular: string;
  /** `"empty"` only — gates the "Create {singular}" button. */
  canCreate?: boolean;
  onCreate?: () => void;
  /** `"empty"` only — the guide link ("Read the docs"); omitted renders no button (wired by Step 17 once the real guide path exists). */
  docsHref?: string;
  /** `"noSearchResults"` only — the active query text, shown verbatim in the heading. */
  searchQuery?: string;
  /** `"noSearchResults"` only — the field currently searched. */
  searchFieldLabel?: string;
  /** `"noSearchResults"` only — another declared, readable search field to offer, when one exists. */
  otherSearchFieldLabel?: string;
  onSearchOtherField?: () => void;
  onClearSearch?: () => void;
  /** `"noFilterResults"` only. */
  onEditFilters?: () => void;
  onClearFilters?: () => void;
}

/**
 * The collection list's three empty-state variants (DESIGN-NOTES.md §5),
 * rendered by `DataTable` in place of the table body when there are zero
 * rows and the query is done loading (`isDone`).
 *
 * @param props - Component props. See {@link ListViewEmptyStateProps}.
 * @returns A centered heading/description/button-row block.
 */
export function ListViewEmptyState(props: ListViewEmptyStateProps): ReactNode {
  if (props.variant === "empty") {
    const singularCapitalized =
      props.collectionLabelPlural.charAt(0).toUpperCase() + props.collectionLabelPlural.slice(1);
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <h3 className="font-medium">No {props.collectionLabelPlural} yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {singularCapitalized} you create here, or send in through the API, will show up in this
          list.
        </p>
        <div className="flex gap-2">
          {props.docsHref && (
            <Button variant="outline" render={<VexLink href={props.docsHref} />}>
              Read the docs
            </Button>
          )}
          {props.canCreate && (
            <Button onClick={props.onCreate}>Create {props.collectionLabelSingular}</Button>
          )}
        </div>
      </div>
    );
  }

  if (props.variant === "noSearchResults") {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <h3 className="font-medium">
          No {props.collectionLabelPlural} with &quot;{props.searchQuery}&quot; in{" "}
          {props.searchFieldLabel}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Search looks in one field at a time. The name might be in a different field.
        </p>
        <div className="flex gap-2">
          {props.otherSearchFieldLabel && (
            <Button variant="outline" onClick={props.onSearchOtherField}>
              Search in {props.otherSearchFieldLabel} instead
            </Button>
          )}
          <Button onClick={props.onClearSearch}>Clear search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <h3 className="font-medium">No {props.collectionLabelPlural} match all of these filters</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Every condition in a group has to match. Try removing one, or add an &quot;or&quot; group
        for alternatives.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={props.onEditFilters}>
          Edit filters
        </Button>
        <Button onClick={props.onClearFilters}>Clear filters</Button>
      </div>
    </div>
  );
}
