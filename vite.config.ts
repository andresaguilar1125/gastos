import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static adapter for GitHub Pages deployment.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			})
		}),
		SvelteKitPWA({
			manifest: {
				name: 'Finanzas CRC',
				short_name: 'Finanzas',
				description: 'Personal finance dashboard for Costa Rican Colones',
				theme_color: '#db4437',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}']
			}
		}),
	]
});
