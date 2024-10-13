<script lang="ts">
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import { POST_PICTURE_PREVIEW_HEIGHT, POST_PICTURE_PREVIEW_WIDTH } from '$lib/shared/constants/images';
	import { Carousel } from 'flowbite-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	export let postHref: string | null = null;
	export let imageUrls: string[];
	export let imagesAlt: string | null = null;
	export let slideDuration: number = 750;
	export let transitionFunction: TCarouselTransitionFunction | null = null;

	const imagesData: HTMLImgAttributes[] = imageUrls.map((_, index) => {
		return {
			width: POST_PICTURE_PREVIEW_WIDTH,
			height: POST_PICTURE_PREVIEW_HEIGHT,
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

{#if imageUrls.length > 0}
	<Carousel
		let:Controls
		let:Indicators
		images={imagesData}
		{slideDuration}
		transition={transitionFunction}
	>
		<a slot="slide" href={postHref} let:Slide let:index>
			<Slide class="object-cover post-carousel-image" image={downloadSlideImage(index)} />
		</a>

		{#if imagesData.length > 1}
			<Controls />
			<Indicators />
		{/if}
	</Carousel>
{/if}
