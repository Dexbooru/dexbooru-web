<script lang="ts">
	import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
	import {
		POST_IMAGE_FALLBACK_HEIGHT,
		POST_IMAGE_FALLBACK_WIDTH,
	} from '$lib/client/constants/images';
	import {
		computeDownScaledImageRatios,
		transformImageDimensions,
	} from '$lib/client/helpers/images';
	import { IMAGE_FILTER_EXCLUSION_BASE_URLS } from '$lib/shared/constants/images';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import { onMount } from 'svelte';

	type Props = {
		imageUrls: string[];
		imageDimensions: { imageWidth: number; imageHeight: number }[];
		imagesAlt: string;
	};

	let { imageUrls, imageDimensions, imagesAlt }: Props = $props();

	let screenWidth: number = 0;
	let screenHeight: number = 0;
	let imagesScaledDown = $state(false);
	let transformedImageDimensions: { imageWidth: number; imageHeight: number }[] =
		$state(imageDimensions);
	let resizeRatios: string[] = $state([]);
	let resizedImages: boolean = $state(false);
	let showResizeAlert: boolean = $state(false);
	let showOriginalImageSizes: boolean = $state(false);

	const recomputeImageDimensions = () => {
		transformedImageDimensions = imageDimensions;
		transformedImageDimensions = imageDimensions.map(({ imageWidth, imageHeight }) =>
			transformImageDimensions(imageWidth, imageHeight, screenWidth, screenHeight),
		);
		resizeRatios = computeDownScaledImageRatios(transformedImageDimensions, imageDimensions).map(
			(ratio) => `${Number(ratio)}%`,
		);

		showResizeAlert = resizeRatios.some((resizeRatio) => resizeRatio !== '100%');
		resizedImages = showResizeAlert;
	};

	const handleShowOriginalImageSizesClick = () => {
		showOriginalImageSizes = !showOriginalImageSizes;
		if (showOriginalImageSizes) {
			transformedImageDimensions = imageDimensions;
			showResizeAlert = false;
		} else {
			recomputeImageDimensions();
		}
	};

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultPostPicture;
		target.width = POST_IMAGE_FALLBACK_WIDTH;
		target.height = POST_IMAGE_FALLBACK_HEIGHT;
	};

	onMount(() => {
		screenWidth = window.innerWidth;
		screenHeight = window.innerHeight;

		recomputeImageDimensions();
		imagesScaledDown = true;
	});
</script>

{#if !IMAGE_FILTER_EXCLUSION_BASE_URLS.some( (exclusionUrl) => imageUrls.includes(exclusionUrl), ) && resizedImages}
	<Button size="sm" on:click={handleShowOriginalImageSizesClick}
		>{showOriginalImageSizes ? 'Revert back to resized sizes' : 'Show original sizes'}</Button
	>
{/if}
{#if showResizeAlert && resizeRatios.length > 0}
	<Alert defaultClass="p-0 gap-3 text-sm" color="yellow">
		<span class="font-medium"
			>Resize notice! Check the table below to view original uploaded files for this image</span
		>
		<br />
		The images were resized relative to the screen via these ratios respectively: {resizeRatios.join(
			', ',
		)}
	</Alert>
{/if}
<div class="flex flex-col gap-3">
	{#each Object.entries(imageUrls) as [index, imageUrl]}
		{#if IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionUrl) => imageUrl.includes(exclusionUrl))}
			<Img
				class="whole-post-image max-w-3/4 block"
				src={imageUrl}
				alt={imagesAlt}
				onerror={onImageError}
			/>
		{:else}
			<Img
				width={transformedImageDimensions[Number(index)].imageWidth}
				height={transformedImageDimensions[Number(index)].imageHeight}
				class="whole-post-image {imagesScaledDown ? 'visible' : 'invisible'} block"
				src={imageUrl}
				alt={imagesAlt}
				onerror={onImageError}
			/>
		{/if}
	{/each}
</div>
