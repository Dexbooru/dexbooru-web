declare module 'markdown-it-emoji' {
	import type MarkdownIt from 'markdown-it';

	export const full: (md: MarkdownIt) => void;
	export const light: (md: MarkdownIt) => void;
	export const bare: (md: MarkdownIt) => void;
}
