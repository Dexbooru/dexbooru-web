<script lang="ts">
	import DefaultPostCollectionPicture from '$lib/client/assets/default_post_collection_picture.webp';
	import {
		POST_COLLECTION_IMAGE_FALLBACK_HEIGHT,
		POST_COLLECTION_IMAGE_FALLBACK_WIDTH,
	} from '$lib/client/constants/images';
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { getOriginalPostsPage } from '$lib/client/helpers/context';
	import {
		computeDownScaledImageRatios,
		transformImageDimensions,
	} from '$lib/client/helpers/images';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import { flip } from 'svelte/animate';
	import PostCard from '../posts/card/PostCard.svelte';
	import CollectionActions from './card/CollectionActions.svelte';

	type Props = {
		collection: TPostCollection;
	};

	let { collection }: Props = $props();

	const originalPostPage = getOriginalPostsPage();

	let originalThumbnail = $derived(
		collection.thumbnailImageUrls.find((imageUrl) => imageUrl.includes(ORIGINAL_IMAGE_SUFFIX)) ??
			'',
	);
	let showResizeAlert = $state(false);
	let resizeRatios: number[] = $state([]);
	let originalImageDims: { imageWidth: number; imageHeight: number } = $state({
		imageWidth: 0,
		imageHeight: 0,
	});
	let resizedImageDims: { imageWidth: number; imageHeight: number } = $state({
		imageWidth: 0,
		imageHeight: 0,
	});

	$effect(() => {
		originalPostPage.set(collection.posts);
	});

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultPostCollectionPicture;
		target.width = POST_COLLECTION_IMAGE_FALLBACK_WIDTH;
		target.height = POST_COLLECTION_IMAGE_FALLBACK_HEIGHT;
	};

	const onImageLoad = (event: Event) => {
		const target = event.target as HTMLImageElement;
		const { naturalWidth, naturalHeight } = target;

		originalImageDims = { imageWidth: naturalWidth, imageHeight: naturalHeight };
		const transformedDims = transformImageDimensions(
			naturalWidth,
			naturalHeight,
			window.innerWidth,
			window.innerHeight,
		);

		if (
			transformedDims.imageWidth !== naturalWidth ||
			transformedDims.imageHeight !== naturalHeight
		) {
			resizedImageDims = transformedDims;
			resizeRatios = computeDownScaledImageRatios([resizedImageDims], [originalImageDims]);
			showResizeAlert = true;
		} else {
			resizedImageDims = originalImageDims;
			showResizeAlert = false;
		}
	};

	const showOriginalImage = () => {
		resizedImageDims = originalImageDims;
		showResizeAlert = false;
	};
</script>

<svelte:head>
	<title>{collection.description} - {collection.id}</title>
	<meta name="description" content={collection.description} />
	<meta property="og:title" content={collection.description} />
	<meta property="og:description" content={collection.description} />
	<meta property="og:image" content={collection.thumbnailImageUrls[0] ?? ''} />
	<meta
		property="og:aricle:author"
		content={collection.author?.username ?? DELETED_ACCOUNT_HEADING}
	/>
</svelte:head>

{#if showResizeAlert && resizeRatios.length > 0}
	<Alert class="p-4 gap-3 text-sm mb-4" color="yellow">
		<span class="font-medium"
			>Image resized to {resizeRatios[0]}% of original size for better viewing.</span
		>
		<Button color="alternative" size="xs" onclick={showOriginalImage}>Show Original</Button>
	</Alert>
{/if}

<Img
	class="whole-collection-image max-w-full h-auto rounded-lg shadow-lg mb-6"
	onerror={onImageError}
	onload={onImageLoad}
	src={originalThumbnail}
	alt={collection.description}
	width={resizedImageDims.imageWidth > 0 ? resizedImageDims.imageWidth : undefined}
	height={resizedImageDims.imageHeight > 0 ? resizedImageDims.imageHeight : undefined}
/>
<div class="flex mb-6">
	<CollectionActions onCollectionViewPage {collection} />
</div>

<section
	class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 border dark:border-gray-700"
>
	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			ID
		</p>
		<p class="text-lg font-medium dark:text-white break-all">{collection.id}</p>
	</div>

	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Uploaded at
		</p>
		<p class="text-lg font-medium dark:text-white">{formatDate(collection.createdAt)}</p>
	</div>

	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Last updated at
		</p>
		<p class="text-lg font-medium dark:text-white">{formatDate(collection.updatedAt)}</p>
	</div>

	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Author
		</p>
		<p class="text-lg font-medium dark:text-white">
			{#if collection.author}
				<a
					class="hover:underline text-primary-600 dark:text-primary-500"
					href="/profile/{collection.author.username}">{collection.author.username}</a
				>
				<span class="text-sm text-gray-400 ml-2">({collection.author.id})</span>
			{:else}
				{DELETED_ACCOUNT_HEADING}
			{/if}
		</p>
	</div>

	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Total posts
		</p>
		<p class="text-lg font-medium dark:text-white">
			{formatNumberWithCommas($originalPostPage.length)}
		</p>
	</div>

	<div class="space-y-1">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Is NSFW?
		</p>
		<p class="text-lg font-medium dark:text-white">
			<span class={collection.isNsfw ? 'text-red-500' : 'text-green-500'}>
				{collection.isNsfw ? 'Yes' : 'No'}
			</span>
		</p>
	</div>

	<div class="space-y-1 md:col-span-2">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Title
		</p>
		<p id="collection-title" class="text-lg font-medium dark:text-white whitespace-pre-wrap">
			{collection.title}
		</p>
	</div>

	<div class="space-y-1 md:col-span-2">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
			Description
		</p>
		<p
			id="collection-description"
			class="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
		>
			{collection.description}
		</p>
	</div>
</section>

{#if collection.posts.length > 0}
	<h2 class="text-2xl font-bold dark:text-white mt-8 mb-6 flex items-center gap-3">
		Posts in this Collection
		<span
			class="text-sm font-normal text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
		>
			{collection.posts.length}
		</span>
	</h2>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each collection.posts as post (post.id)}
			<div
				animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}
				class="flex justify-center w-full"
			>
				<div class="w-full max-w-sm">
					<PostCard {post} />
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-10">
		<p class="text-xl text-gray-500 dark:text-gray-300">
			No posts are in this collection currently.
		</p>
	</div>
{/if}
