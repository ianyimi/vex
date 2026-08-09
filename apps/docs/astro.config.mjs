// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypedoc, { typeDocSidebarGroup } from 'starlight-typedoc';

// https://astro.build/config
export default defineConfig({
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
			],
			sidebar: [
				{ label: 'Introduction', slug: 'index' },
				{ label: 'Roadmap', slug: 'roadmap' },
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
