<script lang="ts">
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import { Carousel } from 'flowbite-svelte';
	import { type Component } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	interface Props {
		postId: string;
		postHref?: string | null;
		imageUrls: string[];
		imagesAlt?: string | null;
		slideDuration?: number;
		transitionFunction?: TCarouselTransitionFunction | null;
	}

	type SlideProps = {
		Slide: Component;
		index: number;
	};

	type SlideControlProps = {
		Controls: Component;
		Indicators: Component;
	};

	let {
		postId,
		postHref = null,
		imageUrls,
		imagesAlt = null,
		slideDuration = 750,
		transitionFunction = null,
	}: Props = $props();

	const imagesData: HTMLImgAttributes[] = imageUrls.map((_, index) => {
		return {
			'data-post-id': postId,
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
	<Carousel images={imagesData} {slideDuration} transition={transitionFunction}>
		{#snippet slide({ Slide, index }: SlideProps)}
			<a href={postHref}>
				<Slide
					class=" object-cover object-top post-carousel-image"
					image={downloadSlideImage(index)}
				/>
			</a>
		{/snippet}

		{#snippet children({ Controls, Indicators }: SlideControlProps)}
			{#if imagesData.length > 1}
				<Controls />
				<Indicators />
			{/if}
		{/snippet}
	</Carousel>
{/if}
