<script lang="ts">
	import {
		IMAGE_FILTER_EXCLUSION_BASE_URLS,
		ORIGINAL_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
	} from 'flowbite-svelte';
	import ImageCollection from '../../images/ImageCollection.svelte';

	export let post: TPost;

	const originalSizedImageUrls = post.imageUrls.filter((imageUrl) => {
		if (IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionUrl) => imageUrl.includes(exclusionUrl))) {
			return true;
		}
		return imageUrl.includes(ORIGINAL_IMAGE_SUFFIX);
	});

	const imagesMetadata = post.imageUrls
		.map((imageUrl, index) => {
			if (
				IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionUrl) => imageUrl.includes(exclusionUrl))
			) {
				return null;
			}

			const imageUrlParts = imageUrl.split('/');
			const imageFileName = `${imageUrlParts[imageUrlParts.length - 1]}.webp`;
			const imageWidth = post.imageWidths[index];
			const imageHeight = post.imageHeights[index];

			return {
				imageFileName,
				imageUrl,
				imageHeight,
				imageWidth,
			};
		})
		.filter((metadata) => metadata !== null);

	const originalImageDimensions = imagesMetadata
		.filter((metadata) => metadata.imageFileName.includes(ORIGINAL_IMAGE_SUFFIX))
		.map((metadata) => ({ imageWidth: metadata.imageWidth, imageHeight: metadata.imageHeight }));
</script>

<ImageCollection
	imageUrls={originalSizedImageUrls}
	imageDimensions={originalImageDimensions}
	imagesAlt={post.description}
/>
<p class="text-lg dark:text-white">
	Total images in post: <span class=" dark:text-gray-400">{originalSizedImageUrls.length}</span>
</p>

{#if imagesMetadata.length > 0}
	<p class="text-lg dark:text-white">Post images metadata:</p>
	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell>Filename</TableHeadCell>
			<TableHeadCell>Width (px)</TableHeadCell>
			<TableHeadCell>Height (px)</TableHeadCell>
			<TableHeadCell>
				<span class="sr-only">Download image</span>
			</TableHeadCell>
		</TableHead>
		<TableBody tableBodyClass="divide-y !w-1/2">
			{#each imagesMetadata as { imageFileName, imageWidth, imageHeight, imageUrl }}
				<TableBodyRow>
					<TableBodyCell>{imageFileName}</TableBodyCell>
					<TableBodyCell>{imageWidth}</TableBodyCell>
					<TableBodyCell>{imageHeight}</TableBodyCell>
					<TableBodyCell>
						<a
							target="_blank"
							href={imageUrl}
							class="font-medium text-primary-600 hover:underline dark:text-primary-500"
							>Download image</a
						>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}
