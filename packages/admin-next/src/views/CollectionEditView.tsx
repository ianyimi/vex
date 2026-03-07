import { VexCollection, VexConfig } from "@vexcms/core";

export default function CollectionEditView({
  config,
  collection,
  documentID,
}: {
  config: VexConfig;
  collection: VexCollection;
  documentID: string;
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {collection.config.labels?.plural ?? collection.slug}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Editing document: {documentID}
      </p>
    </div>
  );
}
