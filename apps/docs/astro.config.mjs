// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
// starlightTypedoc disabled during rebuild — core types not yet complete
// import starlightTypedoc from 'starlight-typedoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'VexCMS',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' }],
			plugins: [],
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
				{
					label: 'API Reference',
					items: [
						{ label: 'find', slug: 'api/find' },
						{ label: 'get', slug: 'api/get' },
						{ label: 'search', slug: 'api/search' },
						{ label: 'create', slug: 'api/create' },
						{ label: 'update', slug: 'api/update' },
						{ label: 'remove', slug: 'api/remove' },
						{ label: 'queryApi', slug: 'api/queryapi' },
						{ label: 'mutationApi', slug: 'api/mutationapi' },
						{ label: 'betterAuthAdapter', slug: 'api/betterauthadapter' },
					],
				},
				// Full API Reference injected by starlight-typedoc (re-enable when types are stable)
			],
		}),
	],
});
