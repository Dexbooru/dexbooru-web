<script lang="ts">
	import DefaultCollectionPicture from '$lib/client/assets/default_post_collection_picture.webp';
	import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import {
		COLLECTION_CAROUSEL_IMAGE_CLASS_NAME,
		COLLECTION_THUMBNAIL_HEIGHT,
		COLLECTION_THUMBNAIL_WIDTH,
		POST_CAROUSEL_IMAGE_CLASS_NAME,
		POST_PICTURE_PREVIEW_HEIGHT,
		POST_PICTURE_PREVIEW_WIDTH,
	} from '$lib/shared/constants/images';
	import Carousel from 'flowbite-svelte/Carousel.svelte';	
	import { type Component } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	type Props = {
		resourceType: 'collections' | 'posts';
		resourceHref?: string | null;
		imageUrls: string[];
		imagesAlt?: string | null;
		slideDuration?: number;
		transitionFunction?: TCarouselTransitionFunction | null;
	};

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

	let imagesData: HTMLImgAttributes[] = $derived(
		imageUrls.map((_, index) => {
			return {
				src: null,
				width: resourceType === 'posts' ? POST_PICTURE_PREVIEW_WIDTH : COLLECTION_THUMBNAIL_WIDTH,
				height:
					resourceType === 'posts' ? POST_PICTURE_PREVIEW_HEIGHT : COLLECTION_THUMBNAIL_HEIGHT,
				alt: imagesAlt
					? `${index + 1} - ${imagesAlt}`
					: `image content in carousel slide ${index + 1}`,
				loading: 'lazy',
				style: 'transition: opacity 0.5s; opacity: 0;',
				onload: (event) => {
					const image = event.target as HTMLImageElement;
					image.style.opacity = '1.0';
				},
				onerror: (event) => {
					const image = event.target as HTMLImageElement;
					image.src = resourceType === 'posts' ? DefaultPostPicture : DefaultCollectionPicture;
				},
			};
		}),
	);

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
						? COLLECTION_CAROUSEL_IMAGE_CLASS_NAME
						: POST_CAROUSEL_IMAGE_CLASS_NAME}"
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
