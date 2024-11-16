<script lang="ts">
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import {
		COLLECTION_THUMBNAIL_HEIGHT,
		COLLECTION_THUMBNAIL_WIDTH,
		POST_PICTURE_PREVIEW_HEIGHT,
		POST_PICTURE_PREVIEW_WIDTH,
	} from '$lib/shared/constants/images';
	import { Carousel } from 'flowbite-svelte';
	import { type Component } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	interface Props {
		resourceType: 'collections' | 'posts';
		resourceHref?: string | null;
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
		resourceType,
		resourceHref = null,
		imageUrls,
		imagesAlt = null,
		slideDuration = 750,
		transitionFunction = null,
	}: Props = $props();

	const imagesData: HTMLImgAttributes[] = imageUrls.map((_, index) => {
		return {
			src: null,
			width: resourceType === 'posts' ? POST_PICTURE_PREVIEW_WIDTH : COLLECTION_THUMBNAIL_WIDTH,
			height: resourceType === 'posts' ? POST_PICTURE_PREVIEW_HEIGHT : COLLECTION_THUMBNAIL_HEIGHT,
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
			<a href={resourceHref}>
				<Slide
					class="object-contain {resourceType === 'collections'
						? 'collection-carousel-image'
						: 'post-carousel-image'}"
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
