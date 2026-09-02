import { describe, it, expect } from "vitest";
import {
  defineCollection,
  defineConfig,
  defineMediaCollection,
  text,
} from "../index";
import {
  generateCollectionQueries,
  generateCollectionPair,
  buildModelGetDocument,
  buildModelListDocuments,
  buildModelCreateDocument,
  buildModelUpdateDocument,
  buildModelDeleteDocument,
  buildModelSearchDocuments,
  buildApiGetDocument,
  buildApiListDocuments,
  buildApiCreateDocument,
  buildApiUpdateDocument,
  buildApiDeleteDocument,
  buildApiSearchDocuments,
  generateIndexFile,
  GENERATED_HEADER,
} from "./generateCollectionQueries";

const stubAuth = {
  name: "stub",
  collections: [] as any[],
  plugin: {} as any,
  tables: {},
  options: {} as any,
};

const TEST_IMPORTS = {
  vexConfigFromApi: "../../../vex.config",
  generatedDirFromApi: "../../_generated",
  authFromApi: "../auth",
  generatedDirFromModel: "../../../_generated",
};

const articles = defineCollection({
  slug: "articles",
  fields: {
    title: text({ required: true }),
    body: text(),
  },
  searchIndexes: [{ name: "search_title", searchField: "title" }],
});

const categories = defineCollection({
  slug: "categories",
  fields: { name: text({ required: true }) },
});

const customTable = defineCollection({
  slug: "posts",
  tableName: "blog_posts",
  fields: { title: text({ required: true }) },
});

const config = defineConfig({
  auth: stubAuth,
  collections: [articles, categories, customTable],
});

// ─── generateCollectionQueries ────────────────────────────────────────────────

describe("generateCollectionQueries", () => {
  it("returns api + model files for each collection plus api/index.ts", () => {
    const result = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(Object.keys(result)).toContain("api/articles.ts");
    expect(Object.keys(result)).toContain("model/api/articles.ts");
    expect(Object.keys(result)).toContain("api/categories.ts");
    expect(Object.keys(result)).toContain("model/api/categories.ts");
    expect(Object.keys(result)).toContain("api/posts.ts");
    expect(Object.keys(result)).toContain("model/api/posts.ts");
    expect(Object.keys(result)).toContain("api/index.ts");
  });

  it("includes media collections when present", () => {
    const media = defineMediaCollection({ slug: "media" });
    const configWithMedia = defineConfig({
      auth: stubAuth,
      collections: [],
      media: { collections: [media], storageAdapter: {} as any },
    });
    const result = generateCollectionQueries({
      config: configWithMedia,
      imports: TEST_IMPORTS,
    });
    expect(Object.keys(result)).toContain("api/media.ts");
    expect(Object.keys(result)).toContain("model/api/media.ts");
    expect(Object.keys(result)).toContain("api/index.ts");
  });

  it("returns just api/index.ts when no collections", () => {
    const emptyConfig = defineConfig({ auth: stubAuth, collections: [] });
    const result = generateCollectionQueries({
      config: emptyConfig,
      imports: TEST_IMPORTS,
    });
    expect(Object.keys(result)).toEqual(["api/index.ts"]);
  });
});

// ─── generateCollectionPair ──────────────────────────────────────────────────

describe("generateCollectionPair — regular collection", () => {
  const { apiFile, modelFile } = generateCollectionPair({
    collection: articles,
    isMedia: false,
    imports: TEST_IMPORTS,
  });

  it("both files start with generated header", () => {
    expect(apiFile.startsWith(GENERATED_HEADER)).toBe(true);
    expect(modelFile.startsWith(GENERATED_HEADER)).toBe(true);
  });

  it("model file exports getDocument, listDocuments, createDocument, updateDocument, deleteDocument", () => {
    expect(modelFile).toContain("export async function getDocument");
    expect(modelFile).toContain("export async function listDocuments");
    expect(modelFile).toContain("export async function createDocument");
    expect(modelFile).toContain("export async function updateDocument");
    expect(modelFile).toContain("export async function deleteDocument");
  });

  it("model file exports searchDocuments when searchIndex is defined", () => {
    expect(modelFile).toContain("export async function searchDocuments");
  });

  it("api file exports get, list, create, update, remove, search", () => {
    expect(apiFile).toContain("export const get");
    expect(apiFile).toContain("export const list");
    expect(apiFile).toContain("export const create");
    expect(apiFile).toContain("export const update");
    expect(apiFile).toContain("export const remove");
    expect(apiFile).toContain("export const search");
  });

  it("api file imports from the model file", () => {
    expect(apiFile).toContain('from "../model/api/articles"');
  });

  it("api file imports from correct relative paths", () => {
    expect(apiFile).toContain(TEST_IMPORTS.vexConfigFromApi);
    expect(apiFile).toContain(TEST_IMPORTS.generatedDirFromApi);
    expect(apiFile).toContain(TEST_IMPORTS.authFromApi);
  });

  it("model file imports from correct _generated path", () => {
    expect(modelFile).toContain(TEST_IMPORTS.generatedDirFromModel);
  });
});

describe("generateCollectionPair — no search index", () => {
  const { apiFile, modelFile } = generateCollectionPair({
    collection: categories,
    isMedia: false,
    imports: TEST_IMPORTS,
  });

  it("model file does not export searchDocuments", () => {
    expect(modelFile).not.toContain("searchDocuments");
  });

  it("api file does not export search", () => {
    expect(apiFile).not.toContain("export const search");
  });
});

describe("generateCollectionPair — media collection", () => {
  const media = defineMediaCollection({ slug: "media" });
  const configWithMedia = defineConfig({
    auth: stubAuth,
    collections: [],
    media: { collections: [media], storageAdapter: {} as any },
  });
  const resolvedMedia = configWithMedia.media!.collections[0]!;

  const { apiFile, modelFile } = generateCollectionPair({
    collection: resolvedMedia,
    isMedia: true,
    imports: TEST_IMPORTS,
  });

  it("model file does not export createDocument or updateDocument", () => {
    expect(modelFile).not.toContain("export async function createDocument");
    expect(modelFile).not.toContain("export async function updateDocument");
  });

  it("api file does not export create or update", () => {
    expect(apiFile).not.toContain("export const create");
    expect(apiFile).not.toContain("export const update");
  });

  it("both files export get, list, delete/remove", () => {
    expect(modelFile).toContain("export async function getDocument");
    expect(modelFile).toContain("export async function listDocuments");
    expect(modelFile).toContain("export async function deleteDocument");
    expect(apiFile).toContain("export const get");
    expect(apiFile).toContain("export const list");
    expect(apiFile).toContain("export const remove");
  });
});

describe("generateCollectionPair — custom tableName", () => {
  const { apiFile, modelFile } = generateCollectionPair({
    collection: customTable,
    isMedia: false,
    imports: TEST_IMPORTS,
  });

  it("model file uses tableName for DB operations", () => {
    expect(modelFile).toContain('db.query("blog_posts")');
    expect(modelFile).toContain('Id<"blog_posts">');
    expect(modelFile).toContain('Doc<"blog_posts">');
  });

  it("api file uses tableName for v.id()", () => {
    expect(apiFile).toContain('v.id("blog_posts")');
    expect(apiFile).not.toContain('v.id("posts")');
  });

  it("api file uses slug for SLUG constant", () => {
    expect(apiFile).toContain('const SLUG = "posts"');
  });

  it("api file imports from model using slug", () => {
    expect(apiFile).toContain('from "../model/api/posts"');
  });
});

// ─── Model builder functions ─────────────────────────────────────────────────

describe("buildModelGetDocument", () => {
  const result = buildModelGetDocument({ tableName: "articles" });

  it("returns typed Doc<tableName> | null", () => {
    expect(result).toContain('Doc<"articles"> | null');
  });

  it("takes typed Id<tableName>", () => {
    expect(result).toContain('Id<"articles">');
  });

  it("supports preview snapshots", () => {
    expect(result).toContain("getPreviewSnapshot");
    expect(result).toContain("preview");
  });
});

describe("buildModelListDocuments", () => {
  const result = buildModelListDocuments({ tableName: "articles" });

  it("queries the correct table", () => {
    expect(result).toContain('db.query("articles")');
  });

  it("returns paginated result directly", () => {
    expect(result).toContain("paginate(props.paginationOpts)");
  });

  it("supports pagination and ordering", () => {
    expect(result).toContain("paginationOpts");
    expect(result).toContain("order");
  });
});

describe("buildModelCreateDocument", () => {
  const result = buildModelCreateDocument({ tableName: "articles" });

  it("returns typed Id", () => {
    expect(result).toContain('Id<"articles">');
  });

  it("validates with generateFormSchema", () => {
    expect(result).toContain("generateFormSchema");
    expect(result).toContain("safeParse");
  });

  it("defaults vex_status to published", () => {
    expect(result).toContain('vex_status ??= "published"');
  });
});

describe("buildModelUpdateDocument", () => {
  const result = buildModelUpdateDocument({ tableName: "articles" });

  it("takes typed Id", () => {
    expect(result).toContain('Id<"articles">');
  });

  it("validates with partial schema", () => {
    expect(result).toContain("generateFormSchema");
    expect(result).toContain(".partial()");
  });
});

describe("buildModelDeleteDocument", () => {
  const result = buildModelDeleteDocument({ tableName: "articles" });

  it("takes typed Id", () => {
    expect(result).toContain('Id<"articles">');
  });

  it("handles global collection check", () => {
    expect(result).toContain("global");
  });
});

describe("buildModelSearchDocuments", () => {
  const result = buildModelSearchDocuments({
    tableName: "articles",
    searchIndexName: "search_title",
    searchField: "title",
  });

  it("returns typed Doc array", () => {
    expect(result).toContain('Doc<"articles">[]');
  });

  it("uses the correct search index and field", () => {
    expect(result).toContain('"search_title"');
    expect(result).toContain('"title"');
  });
});

// ─── API builder functions ───────────────────────────────────────────────────

describe("buildApiGetDocument", () => {
  const result = buildApiGetDocument({ tableName: "articles" });

  it("uses query with _vexDrafts arg for draft support", () => {
    expect(result).toContain("query(");
    expect(result).toContain("_vexDrafts");
  });

  it("accepts typed id arg", () => {
    expect(result).toContain('v.id("articles")');
  });

  it("resolves preview from _vexDrafts", () => {
    expect(result).toContain('"snapshot"');
    expect(result).toContain("preview");
  });

  it("calls model getDocument", () => {
    expect(result).toContain("getDocument(");
  });

  it("checks read permission", () => {
    expect(result).toContain('action: "read"');
  });
});

describe("buildApiListDocuments", () => {
  const result = buildApiListDocuments({ tableName: "articles" });

  it("uses query (not vexQuery)", () => {
    expect(result).toContain("query(");
    expect(result).not.toContain("vexQuery(");
  });

  it("accepts paginationOpts", () => {
    expect(result).toContain("paginationOptsValidator");
  });

  it("filters by read permission", () => {
    expect(result).toContain('action: "read"');
    expect(result).toContain("filteredPage");
  });
});

describe("buildApiCreateDocument", () => {
  const result = buildApiCreateDocument({ slug: "articles", tableName: "articles" });

  it("requires auth", () => {
    expect(result).toContain("requireAuth");
  });

  it("checks create permission with throwOnDenied", () => {
    expect(result).toContain('action: "create"');
    expect(result).toContain("throwOnDenied: true");
  });

  it("calls model createDocument", () => {
    expect(result).toContain("createDocument(");
  });
});

describe("buildApiUpdateDocument", () => {
  const result = buildApiUpdateDocument({ slug: "articles", tableName: "articles" });

  it("accepts typed id and fields", () => {
    expect(result).toContain('v.id("articles")');
    expect(result).toContain("v.any()");
  });

  it("checks update permission", () => {
    expect(result).toContain('action: "update"');
  });
});

describe("buildApiDeleteDocument", () => {
  const result = buildApiDeleteDocument({ tableName: "articles" });

  it("accepts typed id", () => {
    expect(result).toContain('v.id("articles")');
  });

  it("checks delete permission", () => {
    expect(result).toContain('action: "delete"');
  });
});

describe("buildApiSearchDocuments", () => {
  const result = buildApiSearchDocuments();

  it("uses query (not vexQuery)", () => {
    expect(result).toContain("query(");
    expect(result).not.toContain("vexQuery(");
  });

  it("accepts a query string arg", () => {
    expect(result).toContain("v.string()");
  });

  it("filters by read permission", () => {
    expect(result).toContain('action: "read"');
  });
});

// ─── generateIndexFile ────────────────────────────────────────────────────────

describe("generateIndexFile", () => {
  it("namespace-re-exports each slug", () => {
    const result = generateIndexFile({ slugs: ["articles", "categories"] });
    expect(result).toContain('export * as articles from "./articles"');
    expect(result).toContain('export * as categories from "./categories"');
  });

  it("starts with generated header", () => {
    const result = generateIndexFile({ slugs: ["articles"] });
    expect(result.startsWith(GENERATED_HEADER)).toBe(true);
  });

  it("returns just the header when slugs is empty", () => {
    const result = generateIndexFile({ slugs: [] });
    expect(result.trim()).toBe(GENERATED_HEADER);
  });

  it("sorts slugs alphabetically for stable output", () => {
    const result = generateIndexFile({
      slugs: ["posts", "articles", "categories"],
    });
    const articleIdx = result.indexOf("articles");
    const categoriesIdx = result.indexOf("categories");
    const postsIdx = result.indexOf("posts");
    expect(articleIdx).toBeLessThan(categoriesIdx);
    expect(categoriesIdx).toBeLessThan(postsIdx);
  });
});
