"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

interface DocumentForDeletion {
  _id: string;
  title?: string;
}

interface DeleteDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documents: DocumentForDeletion[];
  collectionSlug: string;
  singularLabel: string;
  pluralLabel: string;
  onDeleted: () => void;
}

export function DeleteDocumentDialog(props: DeleteDocumentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteOne = useMutation(anyApi.vex.collections.deleteDocument);
  const bulkDelete = useMutation(anyApi.vex.collections.bulkDeleteDocuments);

  if (props.documents.length === 0) return null;

  const isSingle = props.documents.length === 1;
  const title = isSingle
    ? `Delete ${props.singularLabel}?`
    : `Delete ${props.documents.length} ${props.pluralLabel}?`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isSingle) {
        await deleteOne({
          collectionSlug: props.collectionSlug,
          documentId: props.documents[0]._id,
        });
      } else {
        await bulkDelete({
          collectionSlug: props.collectionSlug,
          documentIds: props.documents.map((d) => d._id),
        });
      }
      props.onDeleted();
      props.onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !isDeleting) props.onClose();
      }}
    >
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="max-h-48 overflow-y-auto space-y-2">
            {props.documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-baseline gap-2 text-sm"
              >
                {doc.title && (
                  <span className="font-medium truncate">{doc.title}</span>
                )}
                <span className="text-muted-foreground font-mono text-xs truncate">
                  {doc._id}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={props.onClose}
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
  );
}

export type { DocumentForDeletion, DeleteDocumentDialogProps };
