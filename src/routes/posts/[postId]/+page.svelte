<script lang="ts">
	import CommentsContainer from '$lib/client/components/comments/CommentsContainer.svelte';
	import ImageCollection from '$lib/client/components/images/ImageCollection.svelte';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { PageData } from './$types';

	export let data: PageData;
	const { post } = data;
</script>

<svelte:head>
	<title>{post.description} - {post.id}</title>
</svelte:head>

<main class="m-5 space-y-5">
	<div class="space-y-2">
		<p class="text-lg dark:text-white">
			ID: <span class=" dark:text-gray-400">{post.id}</span>
		</p>

		<p class="text-lg dark:text-white">
			Uploaded at: <span class=" dark:text-gray-400">{formatDate(post.createdAt)}</span>
		</p>

		<p class="text-lg dark:text-white">
			Author Username: <span class=" dark:text-gray-400"
				><a class="underline" href="/profile/{post.author.id}">{post.author.username}</a></span
			>
		</p>

		<p class="text-lg dark:text-white">
			Author ID: <span class=" dark:text-gray-400"
				><a class="underline" href="/profile/{post.author.id}">{post.author.id}</a></span
			>
		</p>

		<p class="text-lg dark:text-white">
			Description: <span class=" dark:text-gray-400">{post.description}</span>
		</p>

		<p class="text-lg dark:text-white">
			Likes: <span class=" dark:text-gray-400">{normalizeCount(post.likes)}</span>
		</p>

		<p class="text-lg dark:text-white">
			Views: <span class=" dark:text-gray-400">{normalizeCount(post.views)}</span>
		</p>
	</div>

	<div class="space-y-2">
		<p class="text-lg dark:text-white">
			Total images in post: <span class=" dark:text-gray-400">{post.imageUrls.length}</span>
		</p>
		<ImageCollection imageUrls={post.imageUrls} imagesAlt={post.description} />
	</div>

	<div class="space-y-1">
		<p class="text-lg dark:text-white">Tags</p>
		<LabelContainer labelType="tag" labelColor="red" labels={post.tags} />
	</div>

	<div class="space-y-1">
		<p class="text-lg dark:text-white">Artists</p>
		<LabelContainer labelType="artist" labelColor="green" labels={post.artists} />
	</div>

	<div class="space-y-2">
		<p class="text-lg dark:text-white">Comments: {normalizeCount($commentTreeStore.getCount())}</p>
		<CommentsContainer postId={post.id} />
	</div>
</main>
