<script lang="ts">
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import { Carousel } from 'flowbite-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	export let postHref: string | null = null;
	export let imageUrls: string[];
	export let imagesAlt: string | null = null;
	export let slideDuration: number = 750;
	export let blurImages: boolean = false;
	export let transitionFunction: TCarouselTransitionFunction | null = null;

	const imagesData: HTMLImgAttributes[] = imageUrls.map((_, index) => {
		return {
			src: null,
			alt: imagesAlt
				? `${index + 1} - ${imagesAlt}`
				: `image content id of ${crypto.randomUUID()} in carousel slide ${index + 1}`,
			loading: 'lazy',
		};
	});

	const downloadSlideImage = (slideIndex: number) => {
		const image = imagesData[slideIndex];
		if (image.src !== null) return image;

		image.src = imageUrls[slideIndex];
		return image;
	};
</script>

<Carousel
	let:Controls
	let:Indicators
	images={imagesData}
	{slideDuration}
	transition={transitionFunction}
>
	<a slot="slide" href={postHref} let:Slide let:index>
		<Slide
			class={`${blurImages && '!blur-md'} object-contain post-carousel-image`}
			image={downloadSlideImage(index)}
		/>
	</a>

	{#if imagesData.length > 1}
		<Controls />
		<Indicators />
	{/if}
</Carousel>
