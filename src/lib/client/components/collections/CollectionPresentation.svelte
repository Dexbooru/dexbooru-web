<script lang="ts">
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { getOriginalPostsPage } from '$lib/client/helpers/context';
	import { applyLazyLoadingOnImageClass } from '$lib/client/helpers/dom';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { onMount } from 'svelte';
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

	onMount(() => {
		applyLazyLoadingOnImageClass('whole-collection-image');
	});
</script>

<svelte:head>
	<title>{collection.description} - {collection.id}</title>
</svelte:head>

<img class="whole-collection-image" src={originalThumbnail} alt={collection.description} />
<div class="flex">
	<CollectionCardActions onCollectionViewPage {collection} />
</div>

<section class="space-y-2">
	<p class="text-lg dark:text-white cursor-text">
		ID: <span class=" dark:text-gray-400">{collection.id}</span>
	</p>

	<p class="text-lg dark:text-white cursor-text">
		Uploaded at: <span class=" dark:text-gray-400">{formatDate(collection.createdAt)}</span>
	</p>

	<p class="text-lg dark:text-white cursor-text">
		Last updated at: <span class=" dark:text-gray-400">{formatDate(collection.updatedAt)}</span>
	</p>

	<p class="text-lg dark:text-white cursor-text">
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

	<p class="text-lg dark:text-white cursor-text">
		Author ID: <span class=" dark:text-gray-400">
			{#if collection.author}
				<a class="underline" href="/profile/{collection.author.username}">{collection.author.id}</a>
			{:else}
				{DELETED_ACCOUNT_HEADING}
			{/if}
		</span>
	</p>

	<p class="text-lg dark:text-white cursor-text">
		Total posts: <span class=" dark:text-gray-400"
			>{formatNumberWithCommas($originalPostPage.length)}</span
		>
	</p>

	<p class="text-lg dark:text-white whitespace-pre-wrap cursor-text">
		Title: <br /><span id="collection-title" class=" dark:text-gray-400">{collection.title}</span>
	</p>

	<p class="text-lg dark:text-white whitespace-pre-wrap cursor-text">
		Description: <br /><span id="collection-description" class=" dark:text-gray-400"
			>{collection.description}</span
		>
	</p>

	<p class="text-lg dark:text-white cursor-text">
		Is Nsfw?: <span class=" dark:text-gray-400">{collection.isNsfw ? 'Yes' : 'No'}</span>
	</p>
</section>

{#if $originalPostPage.length > 0}
	<h2 class="text-2xl font-semibold dark:text-white mt-6 mb-4">Posts in this Collection:</h2>
	<div class="flex flex-wrap gap-5">
		{#each $originalPostPage as post (post.id)}
			<div animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
				<PostCard onCollectionViewPage {post} />
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-10">
		<p class="text-xl text-gray-500 dark:text-gray-300 cursor-text">
			No posts are in this collection currently.
		</p>
	</div>
{/if}
