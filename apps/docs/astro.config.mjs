// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypedoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightLlmsTxt from 'starlight-llms-txt';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.vexcms.dev',
	integrations: [
		starlight({
			title: 'VexCMS',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' }],
			plugins: [
				starlightTypedoc({
					entryPoints: [
						'../../packages/core/src/index.ts',
						'../../packages/react/src/index.ts',
						'../../packages/next/src/index.ts',
						'../../packages/better-auth/src/index.ts',
						'../../packages/file-storage-convex/src/index.ts',
					],
					tsconfig: './tsconfig.typedoc.json',
					typeDoc: {
						// Keep the docs API reference warning-free: any broken {@link},
						// undocumented referenced type, or bad tag fails the build.
						treatWarningsAsErrors: true,
					},
				}),
				starlightLlmsTxt({
					description:
						'Type-safe headless CMS built on Convex — field system, generated schema/types, and a React/Next.js admin panel.',
					details: [
						'Important notes for interpreting these docs:',
						'',
						'- VexCMS ships as `0.1.0-alpha`; `/roadmap` is authoritative for what exists today versus what is planned.',
						'- Config is split in two: `vex.config.ts` is client-safe and imported by the browser, `vex.config.server.ts` layers on the auth adapter and storage adapters. Server-only values never appear on the client half.',
						'- The Convex schema and TypeScript types are GENERATED from the config by `vex dev` / `vex generate`; never hand-edit `convex/vex.schema.ts` or `src/vex.types.ts`.',
						'- `/api/**` pages are generated from source TSDoc by TypeDoc. They are the precise signatures; the guides and field pages carry the intent.',
					].join('\n'),
					optionalLinks: [
						{
							label: 'Source repository',
							url: 'https://github.com/ianyimi/vex',
							description: 'Monorepo: packages, example apps, and the scaffolder templates.',
						},
					],
					customSets: [
						{
							label: 'Guides',
							paths: ['guides/**'],
							description: 'Task-oriented guides: setup, auth, access control, caching, theming, adapters.',
						},
						{
							label: 'Fields',
							paths: ['fields/**'],
							description: 'Reference for every field type, its options, and its admin behavior.',
						},
					],
					// The TypeDoc API tree is ~1.2 MB of generated signatures. Excluding it is
					// what makes `llms-small.txt` small (it is otherwise within 2% of
					// `llms-full.txt`); `demote` keeps it in the full set but after the prose,
					// so a truncated read gets the guides rather than half an interface.
					exclude: ['api/**'],
					demote: ['api/**'],
					promote: ['index*', 'guides/quickstart*', 'roadmap*'],
				}),
			],
			sidebar: [
				{ label: 'Introduction', slug: 'index' },
				{ label: 'Roadmap', slug: 'roadmap' },
				{
					label: 'Next.js',
					items: [
						{ label: 'Quickstart', slug: 'guides/quickstart' },
						{ label: 'Caching, sitemaps & revalidation', slug: 'guides/caching-and-seo' },
					],
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Fields',
					autogenerate: { directory: 'fields' },
				},
				typeDocSidebarGroup,
			],
		}),
	],
});
