"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Input } from "./input";
import { Button } from "./button";
import { Search, Plus, FileIcon } from "lucide-react";
import { cn } from "../../styles/utils";

interface MediaDocument {
  _id: string;
  filename: string;
  mimeType: string;
  url: string;
  alt?: string;
}

interface MediaPickerProps {
  /** Currently selected media document ID(s) */
  value: string | string[] | null;
  /** Called when selection changes */
  onSelect: (id: string) => void;
  /** Search results from useMediaPicker hook */
  results: MediaDocument[];
  /** Search term state */
  searchTerm: string;
  /** Search term setter */
  onSearchChange: (term: string) => void;
  /** Whether more results can be loaded */
  canLoadMore: boolean;
  /** Load more results */
  onLoadMore: () => void;
  /** Whether results are loading */
  isLoading: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Called when "Upload new" button is clicked */
  onUploadNew: () => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Display label for the selected media (filename) */
  selectedLabel?: string;
  /** Called when the popover open state changes */
  onOpenChange?: (open: boolean) => void;
}

function MediaPicker(props: MediaPickerProps) {
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || !props.canLoadMore || props.isLoading) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      props.onLoadMore();
    }
  }, [props.canLoadMore, props.isLoading, props.onLoadMore]);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); props.onOpenChange?.(v); }}>
      <PopoverTrigger
        disabled={props.disabled}
        className="inline-flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={props.selectedLabel ? "" : "text-muted-foreground"}>
          {props.selectedLabel || "Select media..."}
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={props.searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                props.onSearchChange(e.target.value)
              }
              placeholder={props.searchPlaceholder ?? "Search media..."}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-60 overflow-y-auto p-2"
        >
          {props.isLoading && props.results.length === 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : props.results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No media found
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {props.results.map((doc) => (
                <button
                  key={doc._id}
                  type="button"
                  onClick={() => {
                    props.onSelect(doc._id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-1 rounded cursor-pointer hover:bg-accent",
                    doc._id === props.value && "ring-2 ring-primary bg-accent",
                  )}
                >
                  {doc.mimeType.startsWith("image/") ? (
                    <img
                      src={doc.url}
                      alt={doc.alt || doc.filename}
                      className="w-full h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-16 flex items-center justify-center">
                      <FileIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs truncate w-full text-center">
                    {doc.filename}
                  </p>
                </button>
              ))}
            </div>
          )}
          {props.isLoading && props.results.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Loading...
            </p>
          )}
        </div>

        <div className="p-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              props.onUploadNew();
              setOpen(false);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Upload new
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { MediaPicker, type MediaPickerProps, type MediaDocument };
