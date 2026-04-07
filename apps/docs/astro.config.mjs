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
				// API Reference injected by starlight-typedoc
			],
		}),
	],
});
