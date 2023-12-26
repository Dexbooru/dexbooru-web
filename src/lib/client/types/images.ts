import type { TransitionConfig } from 'svelte/transition';

export type TCarouselTransitionFunction =
	| ((node: HTMLElement, params: Record<string, string>) => TransitionConfig)
	| null;

export type TSliderControlsType = 'controls' | 'indicators';
