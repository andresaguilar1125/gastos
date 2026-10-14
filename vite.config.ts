import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

/**
 * GitHub Pages serves project sites under a sub-path (`/<repo>/`). The deploy
 * workflow sets `BASE_PATH=/gastos`; local dev/build default to the site root.
 */
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			paths: { base },

			// Static adapter for GitHub Pages deployment.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				// GitHub Pages serves this for unknown paths, letting the SPA boot.
				fallback: '404.html',
				precompress: false,
				strict: true
			})
		}),
		SvelteKitPWA({
			manifest: {
				name: 'Gastos',
				short_name: 'Gastos',
				description: 'Panel de gastos personales en colones costarricenses',
				lang: 'es',
				theme_color: '#006ECF',
				background_color: '#F8F8F8',
				display: 'standalone',
				icons: [
					{ src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}']
			}
		})
	]
});
