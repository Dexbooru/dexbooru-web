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
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import { onMount, untrack } from 'svelte';

	type Props = {
		imageUrls: string[];
		imageDimensions: { imageWidth: number; imageHeight: number }[];
		imagesAlt: string;
	};

	let { imageUrls, imageDimensions, imagesAlt }: Props = $props();

	let screenWidth: number = $state(0);
	let screenHeight: number = $state(0);
	let imagesScaledDown = $state(false);
	let transformedImageDimensions: { imageWidth: number; imageHeight: number }[] =
		$state(imageDimensions);
	let resizeRatios: string[] = $state([]);
	let resizedImages: boolean = $state(false);
	let showResizeAlert: boolean = $state(false);
	let showOriginalImageSizes: boolean = $state(false);

	const recomputeImageDimensions = () => {
		if (screenWidth === 0 || screenHeight === 0) return;

		const newTransformedDimensions = imageDimensions.map(({ imageWidth, imageHeight }) =>
			transformImageDimensions(imageWidth, imageHeight, screenWidth, screenHeight),
		);
		transformedImageDimensions = newTransformedDimensions;

		resizeRatios = computeDownScaledImageRatios(newTransformedDimensions, imageDimensions).map(
			(ratio) => `${Number(ratio)}%`,
		);

		const hasResized = resizeRatios.some((resizeRatio) => resizeRatio !== '100%');
		resizedImages = hasResized;
		// Only show alert if we are not forcing original sizes
		if (!showOriginalImageSizes) {
			showResizeAlert = hasResized;
		}
	};

	const handleShowOriginalImageSizesClick = () => {
		showOriginalImageSizes = !showOriginalImageSizes;
		if (showOriginalImageSizes) {
			transformedImageDimensions = imageDimensions;
			showResizeAlert = false;
		} else {
			recomputeImageDimensions();
			showResizeAlert = resizedImages;
		}
	};

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultPostPicture;
		target.width = POST_IMAGE_FALLBACK_WIDTH;
		target.height = POST_IMAGE_FALLBACK_HEIGHT;
	};

	const onResize = () => {
		screenWidth = window.innerWidth;
		screenHeight = window.innerHeight;
	};

	$effect(() => {
		// Track dependencies
		void { imageDimensions, screenWidth, screenHeight };
		untrack(() => recomputeImageDimensions());
	});

	onMount(() => {
		screenWidth = window.innerWidth;
		screenHeight = window.innerHeight;
		window.addEventListener('resize', onResize);
		imagesScaledDown = true;

		return () => {
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<svelte:window onresize={onResize} />

{#if resizedImages}
	<Button size="sm" onclick={handleShowOriginalImageSizesClick}
		>{showOriginalImageSizes ? 'Revert back to resized sizes' : 'Show original sizes'}</Button
	>
{/if}
{#if showResizeAlert && resizeRatios.length > 0}
	<Alert class="gap-3 p-4 text-sm" color="yellow">
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
	{#each Object.entries(imageUrls) as [index, imageUrl] (imageUrl)}
		<Img
			width={transformedImageDimensions && imageUrls.length > 0
				? transformedImageDimensions[Number(index)]?.imageWidth || undefined
				: undefined}
			height={transformedImageDimensions && imageUrls.length > 0
				? transformedImageDimensions[Number(index)]?.imageHeight || undefined
				: undefined}
			class="whole-post-image {imagesScaledDown ? 'visible' : 'invisible'} block"
			src={imageUrl}
			alt={imagesAlt}
			onerror={onImageError}
		/>
	{/each}
</div>
