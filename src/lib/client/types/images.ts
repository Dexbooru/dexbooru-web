import type { TransitionConfig } from 'svelte/transition';

export type TCarouselTransitionFunction =
	| ((node: HTMLElement, params: unknown) => TransitionConfig)
	| null;

export type TSliderControlsType = 'controls' | 'indicators';
