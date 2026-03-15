"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { useConvex, useMutation } from "convex/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@vexcms/ui";
import { History, RotateCcw, Globe, Trash2, Check } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface VersionHistoryDropdownProps {
  collectionSlug: string;
  documentId: string;
  /** The document's actual (latest) version number */
  currentVersion?: number;
  /** The version currently loaded in the form (when restoring an old version) */
  activeVersion?: number;
  /** Called with the snapshot from the selected version */
  onRestore?: (snapshot: Record<string, unknown>, versionNum: number) => void;
}

export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const versionsQuery = useQuery({
    ...convexQuery(anyApi.vex.versions.listVersions, {
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      limit: 20,
    }),
  });

  const convex = useConvex();
  const deleteVersionMutation = useMutation(anyApi.vex.versions.deleteVersion);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const versions = (versionsQuery.data ?? []) as {
    _id: string;
    version: number;
    status: string;
    createdAt: number;
    createdBy: string | null;
    restoredFrom: number | null;
  }[];

  const activeVersion = props.activeVersion ?? props.currentVersion;

  const handleRestore = async (versionNum: number) => {
    if (versionNum === activeVersion) return;
    setRestoringVersion(versionNum);
    try {
      const result = await (convex as any).query(
        anyApi.vex.versions.getVersionSnapshot,
        {
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
          version: versionNum,
        },
      );
      if (result?.snapshot) {
        props.onRestore?.(result.snapshot, result.version);
      }
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleDelete = async () => {
    if (versionToDelete === null) return;
    setIsDeleting(true);
    try {
      await deleteVersionMutation({
        collectionSlug: props.collectionSlug,
        documentId: props.documentId,
        version: versionToDelete,
      });
      setVersionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" />}
        >
          <History className="h-4 w-4 mr-1" />
          History
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
          {versions.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No versions yet
            </div>
          )}
          {versions.map((v) => {
            const isCurrent = v.version === props.currentVersion;
            const isActive = v.version === activeVersion;
            return (
              <DropdownMenuItem
                key={v._id}
                className={`flex items-center justify-between gap-2 cursor-pointer ${isActive ? "bg-accent" : ""}`}
                disabled={restoringVersion === v.version}
                onClick={() => handleRestore(v.version)}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">v{v.version}</span>
                    {v.status === "published" && (
                      <Globe className="h-3 w-3 text-green-600" />
                    )}
                    <StatusBadge status={v.status} />
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">(current)</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionToDelete(v.version);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={versionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setVersionToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete version</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete v{versionToDelete}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVersionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
