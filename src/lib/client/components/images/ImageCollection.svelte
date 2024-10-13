<script lang="ts">
	import {
		computeDownScaledImageRatios,
		transformImageDimensions,
	} from '$lib/client/helpers/images';
	import { IMAGE_FILTER_EXCLUSION_BASE_URLS } from '$lib/shared/constants/images';
	import { Alert } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	export let imageUrls: string[];
	export let imageDimensions: { imageWidth: number; imageHeight: number }[];
	export let imagesAlt: string;

	let screenWidth: number = 0;
	let screenHeight: number = 0;
	let imagesScaledDown = false;
	let transformedImageDimensions: { imageWidth: number; imageHeight: number }[] = imageDimensions;

	onMount(() => {
		screenWidth = window.innerWidth;
		screenHeight = window.innerHeight;

		transformedImageDimensions = imageDimensions.map(({ imageWidth, imageHeight }) =>
			transformImageDimensions(imageWidth, imageHeight, screenWidth, screenHeight),
		);
		imagesScaledDown = true;
	});
</script>

<div class="flex flex-wrap gap-3">
	<Alert color="yellow">
		<span class="font-medium">Resize notice! Check the table below to view original uploaded files for this image</span>
		<br/> 
		The images were resized relative to the screen via these ratios respectively: {computeDownScaledImageRatios(
			transformedImageDimensions,
			imageDimensions,
		)
			.map((ratio) => `${Number(ratio)}%`)
			.join(',')}
	</Alert>

	{#each Object.entries(imageUrls) as [index, imageUrl]}
		{#if IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionUrl) => imageUrl.includes(exclusionUrl))}
			<img class="whole-post-image" src={imageUrl} alt={imagesAlt} />
		{:else}
			<img
				width={transformedImageDimensions[Number(index)].imageWidth}
				height={transformedImageDimensions[Number(index)].imageHeight}
				class="whole-post-image {imagesScaledDown ? 'visible' : 'invisible'}"
				src={imageUrl}
				alt={imagesAlt}
			/>
		{/if}
	{/each}
</div>
