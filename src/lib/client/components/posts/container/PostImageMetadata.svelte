<script lang="ts">
	import { getUpdatedPost } from '$lib/client/helpers/context';
	import {
		NSFW_PREVIEW_IMAGE_SUFFIX,
		ORIGINAL_IMAGE_SUFFIX,
		PREVIEW_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Table from 'flowbite-svelte/Table.svelte';
	import TableBody from 'flowbite-svelte/TableBody.svelte';
	import TableBodyCell from 'flowbite-svelte/TableBodyCell.svelte';
	import TableBodyRow from 'flowbite-svelte/TableBodyRow.svelte';
	import TableHead from 'flowbite-svelte/TableHead.svelte';
	import TableHeadCell from 'flowbite-svelte/TableHeadCell.svelte';
	import ImageCollection from '../../images/ImageCollection.svelte';
	import PostActions from '../PostActions.svelte';

	type Props = {
		post: TPost;
		hasLikedPost?: boolean;
	};

	const getOriginalSizedImageUrls = (post: Partial<TPost>) => {
		return (post.imageUrls ?? []).filter((imageUrl) => {
			if (imageUrl.includes(ORIGINAL_IMAGE_SUFFIX)) return true;
			return (
				!imageUrl.includes(PREVIEW_IMAGE_SUFFIX) && !imageUrl.includes(NSFW_PREVIEW_IMAGE_SUFFIX)
			);
		});
	};

	const getOriginalImageDimensions = (
		imagesMetadata: {
			imageWidth: number;
			imageHeight: number;
			imageFileName: string;
			imageUrl: string;
		}[],
		originalUrls: string[],
	) => {
		return imagesMetadata.filter((metadata) => originalUrls.includes(metadata.imageUrl));
	};

	const getPostImageMetadata = (post: Partial<TPost>) => {
		return (post.imageUrls ?? []).map((imageUrl, index) => {
			const imageUrlParts = imageUrl.split('/');
			const imageFileName = `${imageUrlParts[imageUrlParts.length - 1]}.webp`;
			const imageWidth = (post.imageWidths ?? [])[index] ?? 0;
			const imageHeight = (post.imageHeights ?? [])[index] ?? 0;

			return {
				imageFileName,
				imageUrl,
				imageHeight,
				imageWidth,
			};
		});
	};

	let { post, hasLikedPost = false }: Props = $props();
	let originalSizedImageUrls = $derived(getOriginalSizedImageUrls(post));
	let imagesMetadata = $derived(getPostImageMetadata(post));
	let originalImageDimensions = $derived(
		getOriginalImageDimensions(imagesMetadata, originalSizedImageUrls),
	);

	const updatedPost = getUpdatedPost();
</script>

{#if post.moderationStatus === 'PENDING'}
	<Alert color="yellow" class="!border !border-yellow-100">
		<span class="font-medium">Note:</span>
		This post is currently pending approval by a moderator
	</Alert>
{/if}

{#if Object.keys($updatedPost).length > 0 && $updatedPost.imageUrls !== undefined}
	<ImageCollection
		imageUrls={getOriginalSizedImageUrls($updatedPost)}
		imageDimensions={getOriginalImageDimensions(
			getPostImageMetadata($updatedPost),
			getOriginalSizedImageUrls($updatedPost),
		)}
		imagesAlt={$updatedPost.description ?? post.description}
	/>
{:else}
	<ImageCollection
		imageUrls={originalSizedImageUrls}
		imageDimensions={originalImageDimensions}
		imagesAlt={post.description}
	/>
{/if}

<p class="text-lg dark:text-white">
	Total images in post: <span class=" dark:text-gray-400"
		>{Object.keys($updatedPost).length > 0 && $updatedPost.imageUrls !== undefined
			? getOriginalSizedImageUrls($updatedPost).length
			: originalSizedImageUrls.length}</span
	>
</p>

<PostActions
	likedPost={hasLikedPost}
	{post}
	postId={post.id}
	likes={post.likes}
	author={post.author}
/>

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
		<TableBody class="divide-y !w-1/2">
			{#each Object.keys($updatedPost).length > 0 && $updatedPost.imageUrls ? getPostImageMetadata($updatedPost) : imagesMetadata as { imageFileName, imageWidth, imageHeight, imageUrl }}
				{#if imageFileName.includes(ORIGINAL_IMAGE_SUFFIX) || (!imageFileName.includes(NSFW_PREVIEW_IMAGE_SUFFIX) && imageFileName.includes(PREVIEW_IMAGE_SUFFIX))}
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
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
