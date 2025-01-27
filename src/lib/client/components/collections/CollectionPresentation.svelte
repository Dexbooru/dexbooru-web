<script lang="ts">
	import DefaultPostCollectionPicture from '$lib/client/assets/default_post_collection_picture.webp';
	import {
		POST_COLLECTION_IMAGE_FALLBACK_HEIGHT,
		POST_COLLECTION_IMAGE_FALLBACK_WIDTH,
	} from '$lib/client/constants/images';
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { getOriginalPostsPage } from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import Img from 'flowbite-svelte/Img.svelte';
	import { flip } from 'svelte/animate';
	import PostCard from '../posts/card/PostCard.svelte';
	import CollectionCardActions from './card/CollectionCardActions.svelte';

	type Props = {
		collection: TPostCollection;
	};

	let { collection }: Props = $props();

	const originalPostPage = getOriginalPostsPage();

	let originalThumbnail = $state('');

	$effect(() => {
		originalPostPage.set(collection.posts);
		originalThumbnail =
			collection.thumbnailImageUrls.find((imageUrl) => imageUrl.includes(ORIGINAL_IMAGE_SUFFIX)) ??
			'';
	});

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultPostCollectionPicture;
		target.width = POST_COLLECTION_IMAGE_FALLBACK_WIDTH;
		target.height = POST_COLLECTION_IMAGE_FALLBACK_HEIGHT;
	};
</script>

<svelte:head>
	<title>{collection.description} - {collection.id}</title>
	<meta name="description" content={collection.description} />
	<meta property="og:title" content={collection.description} />
	<meta property="og:description" content={collection.description} />
	<meta property="og:image" content={originalThumbnail} />
	<meta
		property="og:aricle:author"
		content={collection.author?.username ?? DELETED_ACCOUNT_HEADING}
	/>
</svelte:head>

<Img
	class="whole-collection-image"
	onerror={onImageError}
	src={originalThumbnail}
	alt={collection.description}
/>
<div class="flex">
	<CollectionCardActions onCollectionViewPage {collection} />
</div>

<section class="space-y-2">
	<p class="text-lg dark:text-white">
		ID: <span class=" dark:text-gray-400">{collection.id}</span>
	</p>

	<p class="text-lg dark:text-white">
		Uploaded at: <span class=" dark:text-gray-400">{formatDate(collection.createdAt)}</span>
	</p>

	<p class="text-lg dark:text-white">
		Last updated at: <span class=" dark:text-gray-400">{formatDate(collection.updatedAt)}</span>
	</p>

	<p class="text-lg dark:text-white">
		Author Username: <span class=" dark:text-gray-400">
			{#if collection.author}
				<a class="underline" href="/profile/{collection.author.username}"
					>{collection.author.username}</a
				>
			{:else}
				{DELETED_ACCOUNT_HEADING}
			{/if}
		</span>
	</p>

	<p class="text-lg dark:text-white">
		Author ID: <span class=" dark:text-gray-400">
			{#if collection.author}
				<a class="underline" href="/profile/{collection.author.username}">{collection.author.id}</a>
			{:else}
				{DELETED_ACCOUNT_HEADING}
			{/if}
		</span>
	</p>

	<p class="text-lg dark:text-white">
		Total posts: <span class=" dark:text-gray-400"
			>{formatNumberWithCommas($originalPostPage.length)}</span
		>
	</p>

	<p class="text-lg dark:text-white whitespace-pre-wrap">
		Title: <br /><span id="collection-title" class=" dark:text-gray-400">{collection.title}</span>
	</p>

	<p class="text-lg dark:text-white whitespace-pre-wrap">
		Description: <br /><span id="collection-description" class=" dark:text-gray-400"
			>{collection.description}</span
		>
	</p>

	<p class="text-lg dark:text-white">
		Is Nsfw?: <span class=" dark:text-gray-400">{collection.isNsfw ? 'Yes' : 'No'}</span>
	</p>
</section>

{#if collection.posts.length > 0}
	<h2 class="text-2xl font-semibold dark:text-white mt-6 mb-4">Posts in this Collection:</h2>
	<div class="grid grid-cols-3 gap-4">
		{#each collection.posts as post (post.id)}
			<div animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
				<PostCard onCollectionViewPage {post} />
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
