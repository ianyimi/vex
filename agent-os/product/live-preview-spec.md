# Live Preview Implementation Spec

This document defines the implementation plan for Vex CMS live preview functionality. It covers the admin panel iframe integration, postMessage protocol, and server-side refresh on save/autosave.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.9

**Depends on**:
- [versioning-drafts-spec.md](./versioning-drafts-spec.md) - Draft workflow and autosave (live preview requires drafts enabled)
- [custom-admin-components-spec.md](./custom-admin-components-spec.md) - Form state management (for save event integration)

---

## Design Goals

1. **Server-side refresh on save** - Preview refreshes when draft is saved (manual or autosave), not on every keystroke
2. **Toggleable side-by-side view** - Form and preview side-by-side with button to show/hide preview
3. **Depth 0 data** - Preview page fetches its own data via Convex; admin only signals "refresh"
4. **Configurable per collection** - Preview URL (string or function), breakpoints, reload fields
5. **Global admin security** - CORS/allowed origins configured once, applies to all admin routes

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                                  │
│  ┌─────────────────────┐                    ┌────────────────────┐  │
│  │   Document Editor   │                    │   Preview iframe   │  │
│  │                     │                    │                    │  │
│  │   User edits...     │                    │   /preview/page/1  │  │
│  │   Autosave fires    │ ──── "refresh" ──► │                    │  │
│  │                     │                    │   router.refresh() │  │
│  │                     │ ◄─── "ready" ───── │   Re-fetches data  │  │
│  └─────────────────────┘                    └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Flow:
1. Admin loads document edit page with preview panel open
2. Iframe loads frontend preview URL
3. Frontend sends "ready" message to admin
4. User edits document, autosave triggers
5. Draft saved to database
6. Admin sends "refresh" message to iframe
7. Frontend calls router.refresh() or refetches data
8. Preview shows updated content from database
```

---

## Type Definitions

### Global Admin Config

```typescript
interface AdminConfig {
  /** Collection slug used for admin users */
  user: string;

  /**
   * Allowed origins for admin panel and preview communication
   * Applied to CORS headers and postMessage origin validation
   */
  allowedOrigins: string[];

  /** Default breakpoints for all collections (can be overridden per collection) */
  livePreview?: {
    breakpoints?: LivePreviewBreakpoint[];
  };

  /** Admin panel metadata */
  meta?: {
    titleSuffix?: string;
    favicon?: string;
  };
}

interface VexConfig {
  collections: VexCollection<any>[];
  globals?: VexGlobal<any>[];

  /** Global admin configuration */
  admin: AdminConfig;

  // ... other config
}
```

### Collection Live Preview Config

```typescript
interface LivePreviewConfig {
  /**
   * URL for the preview iframe
   * String: static URL (e.g., "/preview/pages")
   * Function: receives document data, returns URL
   */
  url: string | ((doc: { _id: string; [key: string]: any }) => string);

  /**
   * Breakpoints for responsive preview
   * Overrides global admin.livePreview.breakpoints if set
   */
  breakpoints?: LivePreviewBreakpoint[];

  /**
   * Fields that trigger URL recomputation when changed
   * If not set, URL recomputes on every save
   * If set, URL only recomputes when these fields change
   */
  reloadOnFields?: string[];
}

interface LivePreviewBreakpoint {
  /** Display label */
  label: string;

  /** Viewport width in pixels */
  width: number;

  /** Viewport height in pixels */
  height: number;

  /** Lucide icon name (optional) */
  icon?: "smartphone" | "tablet" | "laptop" | "monitor";
}

interface CollectionConfig<TFields> {
  fields: TFields;

  /** Live preview configuration */
  livePreview?: LivePreviewConfig;

  /** Versioning must be enabled with drafts for live preview to work */
  versions?: {
    drafts?: boolean;
    autosave?: boolean | { interval: number };
  };

  // ... other existing config
}
```

### PostMessage Protocol Types

```typescript
/**
 * Messages sent from admin panel to preview iframe
 */
type AdminToPreviewMessage =
  | {
      type: "vex-live-preview:refresh";
      payload: {
        /** Document ID that was saved */
        documentId: string;
        /** Collection slug */
        collection: string;
        /** Type of save that triggered refresh */
        saveType: "autosave" | "draft" | "publish";
        /** Timestamp of save */
        savedAt: number;
      };
    }
  | {
      type: "vex-live-preview:init";
      payload: {
        /** Document ID being previewed */
        documentId: string;
        /** Collection slug */
        collection: string;
        /** Admin panel origin (for validation) */
        adminOrigin: string;
      };
    };

/**
 * Messages sent from preview iframe to admin panel
 */
type PreviewToAdminMessage =
  | {
      type: "vex-live-preview:ready";
      payload: {
        /** Frontend is ready to receive refresh signals */
      };
    }
  | {
      type: "vex-live-preview:error";
      payload: {
        /** Error message */
        message: string;
      };
    };
```

### Frontend Hook Types

```typescript
/**
 * Options for useRefreshOnSave hook
 */
interface UseRefreshOnSaveOptions {
  /**
   * Admin panel origin(s) for message validation
   * If not provided, accepts messages from any origin (dev mode)
   */
  allowedOrigins?: string[];

  /**
   * Callback before refresh (can prevent refresh by returning false)
   */
  onBeforeRefresh?: (payload: RefreshPayload) => boolean | void;

  /**
   * Callback after refresh completes
   */
  onRefresh?: (payload: RefreshPayload) => void;
}

interface RefreshPayload {
  documentId: string;
  collection: string;
  saveType: "autosave" | "draft" | "publish";
  savedAt: number;
}

/**
 * Return type for useRefreshOnSave hook
 */
interface UseRefreshOnSaveResult {
  /** Whether running in preview iframe context */
  isPreview: boolean;

  /** Whether handshake with admin is complete */
  isConnected: boolean;

  /** Last refresh payload (null if no refresh yet) */
  lastRefresh: RefreshPayload | null;
}
```

### vexQuery Draft Support

```typescript
/**
 * Extended options for vexQuery wrapper to support draft queries
 */
interface VexQueryOptions<TArgs> {
  args: TArgs;

  /**
   * If true, returns draft content (_draftSnapshot) if available
   * Default: false (returns published content only)
   */
  includeDraft?: boolean;
}
```

---

## Admin Panel Implementation

### Live Preview Panel Component

```typescript
// @vex/admin/components/LivePreviewPanel.tsx

interface LivePreviewPanelProps {
  /** Collection configuration */
  collection: VexCollection<any>;

  /** Current document data */
  documentData: Record<string, any>;

  /** Document ID */
  documentId: string;

  /** Whether preview panel is visible */
  isVisible: boolean;

  /** Toggle visibility callback */
  onToggle: () => void;
}
```

#### `LivePreviewPanel`

Renders the toggleable preview iframe panel.

**Must accomplish:**
- Only render if collection has `livePreview` configured
- Only render if collection has `versions.drafts` enabled
- Resolve preview URL from config (string or function)
- Render iframe with computed URL
- Apply current breakpoint dimensions
- Listen for "ready" message from iframe
- Send "init" message with document context
- Track iframe ready state

**Edge cases:**
- Preview URL function throws: show error state, don't crash admin
- Collection has livePreview but no drafts: show warning that drafts required
- Iframe fails to load (timeout): show error with retry button

---

#### `PreviewToggleButton`

Button in document toolbar to show/hide preview.

**Must accomplish:**
- Only show if collection has livePreview configured
- Toggle preview panel visibility
- Show indicator when preview is open
- Keyboard shortcut (e.g., Cmd+Shift+P)

---

### Preview URL Resolution

#### `resolvePreviewURL(config, doc, previousURL?): string`

Resolves the preview URL from collection config.

**Must accomplish:**
- If `config.livePreview.url` is string: return as-is
- If function: call with document data, return result
- Catch errors from function, return previousURL or throw

**Edge cases:**
- Document has no `_id` yet (new unsaved doc): use temporary ID or disable preview
- Function returns relative URL: resolve against admin origin
- Function returns empty string: throw error

---

#### `shouldReloadURL(config, changedFields): boolean`

Determines if iframe URL should be recomputed.

**Must accomplish:**
- If `config.livePreview.reloadOnFields` is not set: return true (always reload)
- If set: return true only if any changed field is in the list
- Handle nested field paths (e.g., "meta.slug")

**Edge cases:**
- Empty reloadOnFields array: never reload URL (only refresh content)
- Field deleted: treat as changed

---

### Save-Triggered Refresh

#### `useSaveRefresh(iframeRef, config)`

Hook that sends refresh message after save operations.

**Must accomplish:**
- Listen for save events (autosave, manual save, publish)
- After successful save, send "refresh" message to iframe
- Include save type and timestamp in payload
- Check if URL needs recomputation based on changed fields
- If URL changed, update iframe src (causes full reload)
- If URL unchanged, just send refresh message

**Edge cases:**
- Save fails: don't send refresh
- Iframe not ready yet: queue refresh until ready
- Rapid saves: debounce refresh messages (~200ms)

---

### Breakpoint Selector

#### `BreakpointSelector`

Toolbar component for selecting preview viewport size.

**Must accomplish:**
- Get breakpoints from collection config or global admin config
- Render toggle buttons for each breakpoint
- Include "responsive" option (iframe fills available space)
- Persist selected breakpoint in local storage per collection
- Update iframe container dimensions on selection

**Edge cases:**
- No breakpoints configured: show responsive only
- Current breakpoint larger than panel: scale down with CSS transform

---

### Message Communication

#### `sendRefreshMessage(iframe, payload): void`

Sends refresh message to preview iframe.

**Must accomplish:**
- Validate iframe contentWindow exists
- Get target origin from global admin config
- Send postMessage with "vex-live-preview:refresh" type

**Edge cases:**
- Iframe navigated away: catch postMessage error
- Cross-origin iframe: use correct targetOrigin

---

#### `usePreviewMessages(onReady, onError): void`

Hook that listens for messages from preview iframe.

**Must accomplish:**
- Add message event listener on mount
- Validate message origin against admin.allowedOrigins
- Validate message type prefix "vex-live-preview:"
- Dispatch to appropriate callback
- Clean up on unmount

**Edge cases:**
- Messages from other sources: ignore
- Malformed message data: log warning, ignore

---

## Frontend Implementation

### `useRefreshOnSave(options): UseRefreshOnSaveResult`

React hook for preview pages that refreshes on admin save.

**Must accomplish:**
- Detect if running in iframe context
- Send "ready" message to parent on mount
- Listen for "refresh" messages
- Call `router.refresh()` (Next.js App Router) or equivalent
- Return preview state

**Implementation:**

```typescript
// @vex/live-preview-react/src/useRefreshOnSave.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export function useRefreshOnSave(
  options: UseRefreshOnSaveOptions = {}
): UseRefreshOnSaveResult {
  const { allowedOrigins, onBeforeRefresh, onRefresh } = options;
  const router = useRouter();

  const [isPreview, setIsPreview] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<RefreshPayload | null>(null);

  useEffect(() => {
    // Check if in iframe
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    setIsPreview(inIframe);

    if (!inIframe) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (allowedOrigins && !allowedOrigins.includes(event.origin)) {
        return;
      }

      // Validate message type
      const { data } = event;
      if (!data?.type?.startsWith("vex-live-preview:")) return;

      switch (data.type) {
        case "vex-live-preview:init": {
          setIsConnected(true);
          break;
        }

        case "vex-live-preview:refresh": {
          const payload = data.payload as RefreshPayload;

          // Allow preventing refresh
          if (onBeforeRefresh?.(payload) === false) return;

          setLastRefresh(payload);

          // Trigger route refresh
          router.refresh();

          onRefresh?.(payload);
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Send ready message
    window.parent.postMessage(
      { type: "vex-live-preview:ready", payload: {} },
      "*"
    );

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router, allowedOrigins, onBeforeRefresh, onRefresh]);

  return { isPreview, isConnected, lastRefresh };
}
```

---

### `RefreshOnSave` Component

Simple component version for when you don't need the hook return values.

**Implementation:**

```typescript
// @vex/live-preview-react/src/RefreshOnSave.tsx
"use client";

import { useRefreshOnSave, UseRefreshOnSaveOptions } from "./useRefreshOnSave";

export function RefreshOnSave(props: UseRefreshOnSaveOptions) {
  useRefreshOnSave(props);
  return null;
}
```

---

### Low-Level Utilities

#### `subscribe(callback, options?): () => void`

Framework-agnostic subscription to refresh messages.

**Must accomplish:**
- Add message listener
- Filter to vex-live-preview messages
- Validate origin if provided
- Call callback with parsed payload
- Return unsubscribe function

**Use case:** Building hooks for Vue, Svelte, vanilla JS.

---

#### `sendReady(): void`

Sends ready message to admin panel.

**Must accomplish:**
- Post "vex-live-preview:ready" to parent window

---

#### `isVexPreviewMessage(event): boolean`

Type guard for preview messages.

**Must accomplish:**
- Check event.data.type starts with "vex-live-preview:"
- Return boolean

---

## vexQuery Draft Support

To allow preview pages to fetch draft content, the optional `vexQuery` wrapper supports an `includeDraft` option.

#### `vexQuery` with Draft Support

**Must accomplish:**
- If `includeDraft: true`, check for `_draftSnapshot` on document
- If draft exists, merge/return draft content
- If no draft, return published content as normal
- Access control still applies

**Implementation:**

```typescript
// @vex/convex/helpers/vexQuery.ts

export function vexQuery<TArgs, TReturn>(
  collection: VexCollection<any>,
  options: {
    args: TArgs;
    includeDraft?: boolean;
    handler: (ctx: VexQueryContext, args: TArgs) => Promise<TReturn>;
  }
) {
  return query({
    args: {
      ...options.args,
      _vexIncludeDraft: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
      const vexCtx = createVexContext(ctx, collection, {
        includeDraft: args._vexIncludeDraft ?? options.includeDraft ?? false,
      });

      return options.handler(vexCtx, args);
    },
  });
}
```

**Preview page usage:**

```typescript
// app/preview/pages/[id]/page.tsx
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex";

export default async function PagePreview({ params }) {
  // Fetch with draft content included
  const page = await convex.query(api.pages.getById, {
    id: params.id,
    _vexIncludeDraft: true, // Returns _draftSnapshot content if available
  });

  return <PageContent page={page} />;
}
```

---

## Default Breakpoints

```typescript
const DEFAULT_BREAKPOINTS: LivePreviewBreakpoint[] = [
  { label: "Mobile", width: 375, height: 667, icon: "smartphone" },
  { label: "Tablet", width: 768, height: 1024, icon: "tablet" },
  { label: "Laptop", width: 1280, height: 800, icon: "laptop" },
  { label: "Desktop", width: 1920, height: 1080, icon: "monitor" },
];
```

---

## Configuration Examples

### Global Admin Config

```typescript
// vex.config.ts
export default defineConfig({
  collections: [posts, pages],

  admin: {
    user: "users",

    // Applied to all admin routes and preview communication
    allowedOrigins: [
      "http://localhost:3000",
      "https://admin.mysite.com",
      "https://www.mysite.com",
    ],

    // Default breakpoints for all collections
    livePreview: {
      breakpoints: [
        { label: "Mobile", width: 375, height: 667 },
        { label: "Desktop", width: 1440, height: 900 },
      ],
    },
  },
});
```

### Collection Config - Static URL

```typescript
// collections/pages.ts
export const pages = defineCollection("pages", {
  fields: {
    title: text({ label: "Title" }),
    slug: text({ label: "Slug" }),
    content: blocks({ blocks: pageBlocks }),
  },

  versions: {
    drafts: true,
    autosave: { interval: 2000 },
  },

  livePreview: {
    url: "/preview/pages",
  },
});
```

### Collection Config - Dynamic URL with Field-Based Reload

```typescript
// collections/posts.ts
export const posts = defineCollection("posts", {
  fields: {
    title: text({ label: "Title" }),
    slug: text({ label: "Slug" }),
    category: relationship({ to: "categories" }),
  },

  versions: {
    drafts: true,
    autosave: { interval: 2000 },
  },

  livePreview: {
    url: (doc) => `/preview/posts/${doc.slug || doc._id}`,

    // Only reload iframe URL when slug changes
    // Other saves just send refresh message
    reloadOnFields: ["slug"],

    // Override global breakpoints
    breakpoints: [
      { label: "Mobile", width: 375, height: 812 },
      { label: "Tablet", width: 820, height: 1180 },
      { label: "Desktop", width: 1280, height: 720 },
    ],
  },
});
```

---

## Frontend Usage Examples

### Basic Setup (Next.js App Router)

```typescript
// app/preview/pages/[id]/page.tsx
import { RefreshOnSave } from "@vex/live-preview-react";
import { getPage } from "@/lib/api";
import { PageContent } from "@/components/PageContent";

export default async function PagePreview({ params }) {
  // Fetch page with draft content
  const page = await getPage(params.id, { includeDraft: true });

  return (
    <>
      <RefreshOnSave
        allowedOrigins={["http://localhost:3001"]} // Admin panel origin
      />
      <div className="preview-indicator">Preview Mode</div>
      <PageContent page={page} />
    </>
  );
}
```

### With Hook for Custom Behavior

```typescript
// app/preview/posts/[slug]/page.tsx
"use client";

import { useRefreshOnSave } from "@vex/live-preview-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PostPreview({ params }) {
  const { isPreview, lastRefresh } = useRefreshOnSave({
    onRefresh: (payload) => {
      console.log(`Refreshed after ${payload.saveType}`);
    },
  });

  // Convex query automatically refetches on refresh
  const post = useQuery(api.posts.getBySlug, {
    slug: params.slug,
    _vexIncludeDraft: true,
  });

  if (!post) return <Loading />;

  return (
    <article>
      {isPreview && <PreviewBanner lastSave={lastRefresh?.savedAt} />}
      <h1>{post.title}</h1>
      <PostContent content={post.content} />
    </article>
  );
}
```

### With Convex Real-Time (Alternative Pattern)

Since Convex queries are reactive, the preview can also work without postMessage refresh:

```typescript
// app/preview/pages/[id]/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PagePreview({ params }) {
  // Convex subscription automatically updates when draft changes
  const page = useQuery(api.pages.getById, {
    id: params.id,
    _vexIncludeDraft: true,
  });

  if (!page) return <Loading />;

  return <PageContent page={page} />;
}
```

This pattern leverages Convex's real-time subscriptions - when the draft is saved, the query automatically receives the updated data. The postMessage approach is still useful for:
- Server components (can't use useQuery)
- Triggering side effects on save
- Knowing when saves happen (for UI feedback)

---

## Security

### Origin Validation

**Admin panel side:**
- Uses `admin.allowedOrigins` from global config
- All admin API routes check `Origin` header against this list
- postMessage uses specific targetOrigin (not `"*"` in production)

**Frontend side:**
- `useRefreshOnSave` accepts `allowedOrigins` option
- Messages from non-allowed origins are ignored
- In development (no allowedOrigins), accepts all origins with console warning

### Content Security Policy

Users may need to configure CSP to allow iframe embedding:

```
// On frontend, allow being embedded by admin
frame-ancestors 'self' https://admin.example.com;
```

```
// On admin, allow embedding frontend
frame-src 'self' https://www.example.com;
```

Document this requirement in setup guide.

---

## File Structure

```
@vex/admin/
├── components/
│   ├── LivePreviewPanel.tsx      # Toggleable side panel with iframe
│   ├── BreakpointSelector.tsx    # Responsive viewport controls
│   ├── PreviewToggleButton.tsx   # Toolbar button to show/hide
│   └── PreviewError.tsx          # Error states
├── hooks/
│   ├── usePreviewMessages.ts     # Message listener
│   ├── useSaveRefresh.ts         # Send refresh on save
│   └── usePreviewURL.ts          # URL resolution and reload logic
└── utils/
    └── previewConfig.ts          # Config resolution helpers

@vex/live-preview-react/
├── src/
│   ├── index.ts                  # Package exports
│   ├── useRefreshOnSave.ts       # Main hook
│   ├── RefreshOnSave.tsx         # Component wrapper
│   └── types.ts                  # TypeScript types
├── package.json
└── README.md

@vex/live-preview/
├── src/
│   ├── index.ts                  # Framework-agnostic exports
│   ├── subscribe.ts              # Low-level subscription
│   ├── messages.ts               # Message utilities
│   └── types.ts                  # Shared types
├── package.json
└── README.md
```

---

## Package Exports

### `@vex/live-preview` (Framework Agnostic)

```typescript
export {
  // Subscription
  subscribe,

  // Utilities
  sendReady,
  isVexPreviewMessage,

  // Types
  type AdminToPreviewMessage,
  type PreviewToAdminMessage,
  type RefreshPayload,
} from "@vex/live-preview";
```

### `@vex/live-preview-react`

```typescript
export {
  // Hooks
  useRefreshOnSave,

  // Components
  RefreshOnSave,

  // Re-exports
  subscribe,
  sendReady,

  // Types
  type UseRefreshOnSaveOptions,
  type UseRefreshOnSaveResult,
  type RefreshPayload,
} from "@vex/live-preview-react";
```

---

## Testing Requirements

- Unit tests for URL resolution (string and function)
- Unit tests for `shouldReloadURL` logic
- Unit tests for origin validation
- Integration tests for postMessage communication
- Integration tests for `useRefreshOnSave` hook
- E2E tests for full flow: edit → autosave → preview refresh
- E2E tests for breakpoint switching
- E2E tests for preview toggle visibility
