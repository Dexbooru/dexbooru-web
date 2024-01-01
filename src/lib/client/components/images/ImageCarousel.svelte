<script lang="ts">
	import type { TCarouselTransitionFunction, TSliderControlsType } from '$lib/client/types/images';
	import { Carousel } from 'flowbite-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	export let postHref: string | null = null;
	export let imageUrls: string[];
	export let imagesAlt: string | null = null;
	export let slideDuration: number = 750;
	export let transitionFunction: TCarouselTransitionFunction | null = null;
	export let sliderControlsType: TSliderControlsType = 'controls';

	let index: number = 0;
	const imagesData: HTMLImgAttributes[] = imageUrls.map((imageUrl, index) => {
		return {
			src: imageUrl,
			alt: imagesAlt
				? imagesAlt
				: `image content id of ${crypto.randomUUID()} in carousel slide ${index + 1}`
		};
	});
</script>

<Carousel
	let:Controls
	let:Indicators
	bind:index
	images={imagesData}
	{slideDuration}
	transition={transitionFunction}
>	
	<a slot="slide" data-sveltekit-reload href={postHref} let:Slide>
		<Slide class="h-full object-contain" image={imagesData[index]} />
	</a>
	{#if imagesData.length > 1}
		{#if sliderControlsType === 'controls'}
			<Controls />
		{:else if sliderControlsType === 'indicators'}
			<Indicators />
		{/if}
	{/if}
</Carousel>

{#if imagesData.length > 1}
	<span class="text-center mt-1">{index + 1} / {imagesData.length}</span>
{/if}
