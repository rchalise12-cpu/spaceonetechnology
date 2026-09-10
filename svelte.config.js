import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'blob:', 'https://spaceonetechnology.com'],
				'media-src': ['self', 'https://spaceonetechnology.com'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'object-src': ['none']
			}
		}
	}
};
