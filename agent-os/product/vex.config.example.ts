/**
 * Vex CMS Configuration Example
 *
 * This file represents the complete Phase 1 configuration.
 * Comments indicate which features are implemented at each step.
 *
 * Build Order:
 * 1. Step 1.0: Config structure & defineConfig
 * 2. Step 1.1: Basic field types (text, number, checkbox, select, date)
 * 3. Step 1.2: Complex fields (relationship, array, group, blocks)
 * 4. Step 1.3: Convex schema generation & admin handlers
 * 5. Step 1.4: Hooks system
 * 6. Step 1.5: Access control & RBAC
 * 7. Step 1.6: Versioning & drafts
 * 8. Step 1.7: File uploads
 * 9. Step 1.8: Custom admin components & UI fields
 * 10. Step 1.9: Live preview
 * 11. Step 1.10: Admin panel (Next.js)
 */

import {
  defineConfig,
  defineCollection,
  defineGlobal,
  defineBlock,
  definePermissions,
  // Basic field types (Step 1.1)
  text,
  textarea,
  number,
  checkbox,
  select,
  date,
  email,
  // Complex field types (Step 1.2)
  relationship,
  array,
  group,
  blocks,
  // Upload field (Step 1.7)
  upload,
  // UI field (Step 1.8)
  ui,
} from '@vex/core';

// =============================================================================
// BLOCKS (Step 1.2)
// =============================================================================

/**
 * Hero block for page headers
 */
const heroBlock = defineBlock('hero', {
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: {
    heading: text({ label: 'Heading', required: true }),
    subheading: text({ label: 'Subheading' }),
    // [Step 1.7] Upload field for background image
    backgroundImage: upload({
      label: 'Background Image',
      relationTo: 'media',
      accept: ['image/*'],
    }),
    ctaText: text({ label: 'CTA Button Text' }),
    ctaLink: text({ label: 'CTA Button Link' }),
    alignment: select({
      label: 'Text Alignment',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      defaultValue: 'center',
    }),
  },
});

/**
 * Rich content block (text with formatting)
 */
const contentBlock = defineBlock('content', {
  labels: { singular: 'Content', plural: 'Content Blocks' },
  fields: {
    // Note: richText field is Phase 2, using textarea for now
    content: textarea({ label: 'Content', required: true }),
  },
});

/**
 * Image block
 */
const imageBlock = defineBlock('image', {
  labels: { singular: 'Image', plural: 'Images' },
  fields: {
    // [Step 1.7] Upload field
    image: upload({
      label: 'Image',
      relationTo: 'media',
      required: true,
      accept: ['image/*'],
    }),
    caption: text({ label: 'Caption' }),
    altText: text({ label: 'Alt Text', required: true }),
  },
});

/**
 * Call to action block
 */
const ctaBlock = defineBlock('cta', {
  labels: { singular: 'Call to Action', plural: 'CTAs' },
  fields: {
    heading: text({ label: 'Heading', required: true }),
    description: textarea({ label: 'Description' }),
    buttonText: text({ label: 'Button Text', required: true }),
    buttonLink: text({ label: 'Button Link', required: true }),
    style: select({
      label: 'Style',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'outline', label: 'Outline' },
      ],
      defaultValue: 'primary',
    }),
  },
});

// All page blocks for reuse
const pageBlocks = [heroBlock, contentBlock, imageBlock, ctaBlock] as const;

// =============================================================================
// COLLECTIONS
// =============================================================================

/**
 * Users collection - for admin authentication
 * [Step 1.1] Basic fields
 * [Step 1.5] Access control
 * [Step 1.7] Avatar upload
 */
const users = defineCollection('users', {
  labels: { singular: 'User', plural: 'Users' },

  fields: {
    // [Step 1.1] Basic fields
    name: text({ label: 'Name', required: true }),
    email: email({ label: 'Email', required: true }),
    role: select({
      label: 'Role',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'author', label: 'Author' },
      ],
      defaultValue: 'author',
    }),

    // [Step 1.7] Upload field for avatar
    avatar: upload({
      label: 'Avatar',
      relationTo: 'media',
      accept: ['image/*'],
      admin: {
        description: 'Profile picture (square recommended)',
      },
    }),

    // [Step 1.1] Metadata
    bio: textarea({ label: 'Bio' }),
    isActive: checkbox({ label: 'Active', defaultValue: true }),
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'isActive'],
    group: 'Admin',
  },

  // [Step 1.5] Access control - only admins can manage users
  access: {
    create: ({ user }) => user?.role === 'admin',
    read: ({ user }) => !!user, // Any authenticated user
    update: ({ user, doc }) => user?.role === 'admin' || user?._id === doc?._id,
    delete: ({ user }) => user?.role === 'admin',
  },
});

/**
 * Media collection - upload-enabled for file storage
 * [Step 1.1] Basic fields
 * [Step 1.7] Upload configuration
 */
const media = defineCollection('media', {
  labels: { singular: 'Media', plural: 'Media' },

  // [Step 1.7] Upload configuration
  upload: {
    enabled: true,
    accept: ['image/*', 'video/*', 'application/pdf'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },

  fields: {
    // [Step 1.1] User-defined metadata fields
    alt: text({ label: 'Alt Text', required: true }),
    caption: text({ label: 'Caption' }),
    credit: text({ label: 'Credit/Attribution' }),

    // [Step 1.2] Relationship to uploader
    uploadedBy: relationship({
      label: 'Uploaded By',
      to: 'users',
      admin: { readOnly: true },
    }),
  },

  admin: {
    useAsTitle: 'alt',
    group: 'Media',
  },

  // [Step 1.4] Hooks - auto-set uploadedBy
  hooks: {
    beforeCreate: async ({ data, user }) => {
      return { ...data, uploadedBy: user?._id };
    },
  },

  // [Step 1.5] Access control
  access: {
    create: ({ user }) => !!user,
    read: () => true, // Public read for media
    update: ({ user, doc }) =>
      user?.role === 'admin' || doc?.uploadedBy === user?._id,
    delete: ({ user }) => user?.role === 'admin',
  },
});

/**
 * Categories collection
 * [Step 1.1] Basic fields
 * [Step 1.2] Self-referential relationship
 */
const categories = defineCollection('categories', {
  labels: { singular: 'Category', plural: 'Categories' },

  fields: {
    name: text({ label: 'Name', required: true }),
    slug: text({ label: 'Slug', required: true }),
    description: textarea({ label: 'Description' }),

    // [Step 1.2] Self-referential relationship for hierarchy
    parent: relationship({
      label: 'Parent Category',
      to: 'categories',
      admin: {
        description: 'Optional parent for nested categories',
      },
    }),

    // [Step 1.7] Category image
    image: upload({
      label: 'Image',
      relationTo: 'media',
      accept: ['image/*'],
    }),
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent'],
    group: 'Content',
  },

  // [Step 1.3] Indexes for efficient queries
  indexes: [
    { name: 'by_slug', fields: ['slug'] },
    { name: 'by_parent', fields: ['parent'] },
  ],
});

/**
 * Posts collection - main blog content
 * [Step 1.1] Basic fields
 * [Step 1.2] Complex fields (relationship, array, blocks)
 * [Step 1.4] Hooks
 * [Step 1.5] Access control
 * [Step 1.6] Versioning & drafts
 * [Step 1.8] Custom components & UI fields
 * [Step 1.9] Live preview
 */
const posts = defineCollection('posts', {
  labels: { singular: 'Post', plural: 'Posts' },

  fields: {
    // [Step 1.1] Basic fields
    title: text({ label: 'Title', required: true }),
    slug: text({
      label: 'Slug',
      required: true,
      admin: {
        description: 'URL-friendly identifier',
      },
    }),
    excerpt: textarea({
      label: 'Excerpt',
      admin: {
        description: 'Short summary for listings and SEO',
      },
    }),

    // [Step 1.8] UI field - computed word count (non-persisted)
    wordCount: ui({
      label: 'Statistics',
      admin: {
        components: {
          Field: '~/components/admin/WordCount',
        },
        position: 'sidebar',
      },
    }),

    // [Step 1.2] Relationship fields
    author: relationship({
      label: 'Author',
      to: 'users',
      required: true,
    }),
    categories: relationship({
      label: 'Categories',
      to: 'categories',
      hasMany: true,
    }),

    // [Step 1.7] Featured image
    featuredImage: upload({
      label: 'Featured Image',
      relationTo: 'media',
      accept: ['image/*'],
    }),

    // [Step 1.2] Blocks field for flexible content
    content: blocks({
      label: 'Content',
      blocks: pageBlocks,
      required: true,
    }),

    // [Step 1.1] Publishing metadata
    publishedAt: date({
      label: 'Publish Date',
      admin: {
        position: 'sidebar',
        description: 'Leave empty to use creation date',
      },
    }),

    // [Step 1.2] Group for SEO fields
    seo: group({
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: {
        metaTitle: text({
          label: 'Meta Title',
          admin: {
            description: 'Defaults to post title if empty',
          },
        }),
        metaDescription: textarea({
          label: 'Meta Description',
          admin: {
            description: 'Recommended: 150-160 characters',
          },
        }),
        ogImage: upload({
          label: 'Social Image',
          relationTo: 'media',
          accept: ['image/*'],
          admin: {
            description: 'Image for social media shares',
          },
        }),
      },
    }),

    // [Step 1.8] UI field - SEO preview
    seoPreview: ui({
      label: 'Search Preview',
      admin: {
        components: {
          Field: '~/components/admin/SEOPreview',
        },
        position: 'sidebar',
      },
    }),

    // [Step 1.2] Array field for related links
    relatedLinks: array({
      label: 'Related Links',
      fields: {
        label: text({ label: 'Label', required: true }),
        url: text({ label: 'URL', required: true }),
      },
      admin: {
        initCollapsed: true,
      },
    }),
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', '_status'],
    group: 'Content',
  },

  // [Step 1.3] Indexes
  indexes: [
    { name: 'by_slug', fields: ['slug'] },
    { name: 'by_author', fields: ['author'] },
    { name: 'by_published', fields: ['publishedAt'] },
    { name: 'by_status', fields: ['_status'] },
  ],
  searchIndexes: [
    { name: 'search_posts', searchField: 'title', filterFields: ['_status'] },
  ],

  // [Step 1.6] Versioning & drafts
  versions: {
    drafts: true,
    autosave: { interval: 2000 },
    maxPerDoc: 50,
  },

  // [Step 1.9] Live preview
  livePreview: {
    url: (doc) => `/preview/posts/${doc.slug || doc._id}`,
    breakpoints: [
      { label: 'Mobile', width: 375, height: 812, icon: 'smartphone' },
      { label: 'Tablet', width: 768, height: 1024, icon: 'tablet' },
      { label: 'Desktop', width: 1280, height: 800, icon: 'laptop' },
    ],
    reloadOnFields: ['slug'],
  },

  // [Step 1.4] Hooks
  hooks: {
    beforeCreate: async ({ data, user }) => {
      return {
        ...data,
        author: data.author ?? user?._id,
        publishedAt: data.publishedAt ?? Date.now(),
      };
    },
    beforeUpdate: async ({ data, originalDoc }) => {
      // Generate slug from title if not set
      if (data.title && !data.slug) {
        return {
          ...data,
          slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        };
      }
      return data;
    },
  },

  // [Step 1.5] Access control
  access: {
    create: ({ user }) => !!user,
    read: ({ user, doc }) => {
      // Published posts are public
      if (doc?._status === 'published') return true;
      // Drafts require auth
      return !!user;
    },
    update: ({ user, doc }) => {
      if (user?.role === 'admin') return true;
      return doc?.author === user?._id;
    },
    delete: ({ user }) => user?.role === 'admin',
  },
});

/**
 * Pages collection - static pages with flexible layouts
 * [Step 1.1] Basic fields
 * [Step 1.2] Blocks for layout
 * [Step 1.6] Versioning
 * [Step 1.9] Live preview
 */
const pages = defineCollection('pages', {
  labels: { singular: 'Page', plural: 'Pages' },

  fields: {
    title: text({ label: 'Title', required: true }),
    slug: text({ label: 'Slug', required: true }),

    // [Step 1.8] Custom color picker field
    primaryColor: text({
      label: 'Primary Color',
      defaultValue: '#3b82f6',
      admin: {
        components: {
          Field: '~/components/admin/ColorField',
        },
      },
    }),

    // [Step 1.2] Blocks for page layout
    layout: blocks({
      label: 'Layout',
      blocks: pageBlocks,
      required: true,
    }),

    // [Step 1.2] SEO group (reused pattern)
    seo: group({
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: {
        metaTitle: text({ label: 'Meta Title' }),
        metaDescription: textarea({ label: 'Meta Description' }),
      },
    }),

    // Page settings
    showInNav: checkbox({
      label: 'Show in Navigation',
      defaultValue: false,
      admin: { position: 'sidebar' },
    }),
    navOrder: number({
      label: 'Navigation Order',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.showInNav === true,
      },
    }),
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'showInNav', '_status'],
    group: 'Content',
  },

  indexes: [{ name: 'by_slug', fields: ['slug'] }],

  // [Step 1.6] Versioning
  versions: {
    drafts: true,
    autosave: { interval: 3000 },
    maxPerDoc: 25,
  },

  // [Step 1.9] Live preview
  livePreview: {
    url: (doc) => `/preview/${doc.slug || doc._id}`,
  },
});

// =============================================================================
// GLOBALS
// =============================================================================

/**
 * Site settings global
 * [Step 1.1] Basic fields
 * [Step 1.7] Upload fields
 */
const siteSettings = defineGlobal('site-settings', {
  label: 'Site Settings',

  fields: {
    siteName: text({ label: 'Site Name', required: true }),
    tagline: text({ label: 'Tagline' }),

    // [Step 1.7] Logo uploads
    logo: upload({
      label: 'Logo',
      relationTo: 'media',
      accept: ['image/*'],
    }),
    favicon: upload({
      label: 'Favicon',
      relationTo: 'media',
      accept: ['image/x-icon', 'image/png', 'image/svg+xml'],
    }),

    // Social links as array
    socialLinks: array({
      label: 'Social Links',
      fields: {
        platform: select({
          label: 'Platform',
          required: true,
          options: [
            { value: 'twitter', label: 'Twitter/X' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'youtube', label: 'YouTube' },
            { value: 'github', label: 'GitHub' },
          ],
        }),
        url: text({ label: 'URL', required: true }),
      },
    }),
  },

  admin: {
    group: 'Settings',
  },
});

/**
 * Header/navigation global
 * [Step 1.2] Array of nav items
 */
const header = defineGlobal('header', {
  label: 'Header',

  fields: {
    navItems: array({
      label: 'Navigation Items',
      fields: {
        label: text({ label: 'Label', required: true }),
        type: select({
          label: 'Link Type',
          required: true,
          options: [
            { value: 'internal', label: 'Internal Page' },
            { value: 'external', label: 'External URL' },
          ],
          defaultValue: 'internal',
        }),
        // Conditional fields based on type
        page: relationship({
          label: 'Page',
          to: 'pages',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'internal',
          },
        }),
        url: text({
          label: 'External URL',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'external',
          },
        }),
        openInNewTab: checkbox({
          label: 'Open in New Tab',
          defaultValue: false,
        }),
      },
    }),

    ctaButton: group({
      label: 'CTA Button',
      fields: {
        enabled: checkbox({ label: 'Show CTA Button', defaultValue: false }),
        text: text({ label: 'Button Text' }),
        link: text({ label: 'Button Link' }),
      },
    }),
  },

  admin: {
    group: 'Settings',
  },

  // [Step 1.6] Versioning for globals
  versions: {
    drafts: true,
  },
});

/**
 * Footer global
 */
const footer = defineGlobal('footer', {
  label: 'Footer',

  fields: {
    copyright: text({
      label: 'Copyright Text',
      defaultValue: `© ${new Date().getFullYear()} Your Company`,
    }),

    columns: array({
      label: 'Footer Columns',
      maxRows: 4,
      fields: {
        heading: text({ label: 'Column Heading', required: true }),
        links: array({
          label: 'Links',
          fields: {
            label: text({ label: 'Label', required: true }),
            url: text({ label: 'URL', required: true }),
          },
        }),
      },
    }),

    bottomLinks: array({
      label: 'Bottom Links',
      fields: {
        label: text({ label: 'Label', required: true }),
        url: text({ label: 'URL', required: true }),
      },
    }),
  },

  admin: {
    group: 'Settings',
  },
});

// =============================================================================
// ACCESS CONTROL / RBAC (Step 1.5)
// =============================================================================

/**
 * Role definitions
 */
export const USER_ROLES = ['admin', 'editor', 'author'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Typed permissions matrix
 * This provides full LSP support for collection names and permission functions
 */
export const permissions = definePermissions<UserRole, typeof collections>()({
  admin: {
    // Admins have full access to everything
    users: { create: true, read: true, update: true, delete: true },
    media: { create: true, read: true, update: true, delete: true },
    categories: { create: true, read: true, update: true, delete: true },
    posts: { create: true, read: true, update: true, delete: true },
    pages: { create: true, read: true, update: true, delete: true },
  },

  editor: {
    // Editors can manage content but not users
    users: { read: true },
    media: { create: true, read: true, update: true, delete: false },
    categories: { create: true, read: true, update: true, delete: false },
    posts: { create: true, read: true, update: true, delete: true },
    pages: { create: true, read: true, update: true, delete: true },
  },

  author: {
    // Authors can only manage their own posts
    users: { read: true },
    media: { create: true, read: true },
    categories: { read: true },
    posts: {
      create: true,
      read: true,
      update: ({ data, user }) => data?.author === user?._id,
      delete: ({ data, user }) => data?.author === user?._id,
    },
    pages: { read: true },
  },
});

// =============================================================================
// COLLECTIONS ARRAY
// =============================================================================

const collections = [users, media, categories, posts, pages] as const;
const globals = [siteSettings, header, footer] as const;

// =============================================================================
// MAIN CONFIG
// =============================================================================

export default defineConfig({
  collections,
  globals,

  admin: {
    // User collection for authentication
    user: 'users',

    // [Step 1.7] Default media collection for upload fields without explicit relationTo
    defaultMediaCollection: 'media',

    // [Step 1.9] Allowed origins for admin panel and live preview
    allowedOrigins: [
      'http://localhost:3000', // Dev frontend
      'http://localhost:3001', // Dev admin
      'https://admin.example.com',
      'https://www.example.com',
    ],

    // [Step 1.9] Default live preview breakpoints (can be overridden per collection)
    livePreview: {
      breakpoints: [
        { label: 'Mobile', width: 375, height: 667, icon: 'smartphone' },
        { label: 'Tablet', width: 768, height: 1024, icon: 'tablet' },
        { label: 'Laptop', width: 1280, height: 800, icon: 'laptop' },
        { label: 'Desktop', width: 1920, height: 1080, icon: 'monitor' },
      ],
    },

    // Admin panel metadata
    meta: {
      titleSuffix: ' | Vex CMS',
      favicon: '/favicon.ico',
    },
  },

  // [Step 1.5] Access control configuration
  accessControl: {
    roles: USER_ROLES,
    getUserRole: (user) => user?.role as UserRole,
    permissions,
    defaultPermission: 'deny', // Deny if not explicitly granted
  },

  // [Step 1.7] Global upload/storage configuration
  upload: {
    storage: 'convex', // Default storage adapter
  },

  // Convex integration settings
  convex: {
    // When true (default): `vex sync` automatically updates schema.ts
    // When false: outputs manual instructions instead
    autoUpdateSchema: true,
  },
});

// =============================================================================
// TYPE EXPORTS (for user's own code)
// =============================================================================

/**
 * Export collection types for use in frontend queries
 */
export type VexCollections = typeof collections;

// Document types inferred from collections
export type User = (typeof users)['_docType'];
export type Media = (typeof media)['_docType'];
export type Category = (typeof categories)['_docType'];
export type Post = (typeof posts)['_docType'];
export type Page = (typeof pages)['_docType'];

// Global types
export type SiteSettings = (typeof siteSettings)['_docType'];
export type Header = (typeof header)['_docType'];
export type Footer = (typeof footer)['_docType'];
