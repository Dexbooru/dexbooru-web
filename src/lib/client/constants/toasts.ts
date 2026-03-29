import type { SvelteToastOptions } from '@zerodevx/svelte-toast';

export const TOAST_DURATION_MS = 1500;
export const TOAST_DEFAULT_OPTIONS: SvelteToastOptions = {
	duration: TOAST_DURATION_MS,
};

export const SUCCESS_TOAST_OPTIONS: SvelteToastOptions = {
	theme: {
		'--toastColor': 'mintcream',
		'--toastBackground': 'rgba(72,187,120)',
		'--toastBarBackground': '#2F855A',
	},
};

export const FAILURE_TOAST_OPTIONS: SvelteToastOptions = {
	theme: {
		'--toastColor': 'mintcream',
		'--toastBackground': 'red',
		'--toastBarBackground': '#cc0000',
	},
};

/** Like action hit server rate limit (429) — smug copy, slightly longer read time */
export const LIKE_RATE_LIMIT_TOAST_OPTIONS: SvelteToastOptions = {
	duration: 4500,
	theme: {
		'--toastColor': 'mintcream',
		'--toastBackground': '#9a3412',
		'--toastBarBackground': '#7c2d12',
	},
};
