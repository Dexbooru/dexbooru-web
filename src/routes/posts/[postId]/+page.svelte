<script lang="ts">
	import CommentTextbox from '$lib/client/components/comments/CommentTextbox.svelte';
	import CommentsContainer from '$lib/client/components/comments/CommentsContainer.svelte';
	import ImageCollection from '$lib/client/components/images/ImageCollection.svelte';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { formatNumberWithCommas, normalizeCount } from '$lib/client/helpers/posts';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { Button, Modal } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let { post, uploadedSuccessfully } = data;
	let totalPostCommentCount: string = '0';
	let uploadSuccessModalOpen = true;

	const tagNames = post.tags.map((tag) => tag.name);
	const artistNames = post.artists.map((artist) => artist.name);

	$: {
		post = data.post;
		uploadedSuccessfully = data.uploadedSuccessfully;
	}

	const commentTreeUnsubscribe = commentTreeStore.subscribe((tree) => {
		totalPostCommentCount = normalizeCount(tree.getCount());
	});

	const uploadSuccessModalClose = () => {
		uploadSuccessModalOpen = false;

		const currentUrl = new URL(window.location.href);
		history.replaceState({}, document.title, currentUrl.pathname);
	};

	onDestroy(() => {
		commentTreeUnsubscribe();
	});
</script>

<svelte:head>
	<title>{post.description} - {post.id}</title>
	<meta property="og:title" content={post.description} />
	<meta
		property="og:description"
		content="Tags: {tagNames.join(', ')} | Artists: {artistNames.join(', ')} | Author: {post.author
			? post.author.username
			: DELETED_ACCOUNT_HEADING} | Views: {normalizeCount(post.views)} | Likes: {normalizeCount(
			post.likes,
		)}"
	/>
	<meta property="og:image" content={post.imageUrls[0]} />
	<meta
		property="og:author"
		content={post.author ? post.author.username : DELETED_ACCOUNT_HEADING}
	/>
	<meta property="article:published_time" content={formatDate(post.createdAt)} />
</svelte:head>

{#if uploadedSuccessfully && $authenticatedUserStore && $authenticatedUserStore.id === post.author.id}
	<Modal
		title="Your post was uploaded succesfully! 🚀🚀"
		open={uploadSuccessModalOpen}
		outsideclose
		on:close={uploadSuccessModalClose}
	>
		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			We got your post into Dexbooru succesfully! It should show up in your uploaded posts that can
			be found <a
				class="inline-flex items-center text-primary-600 hover:underline"
				href="/profile/posts/uploaded">here</a
			>.
		</p>

		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			You can delete the post if you want, via the card preview on the uploaded posts page.
		</p>

		<svelte:fragment slot="footer">
			<Button on:click={uploadSuccessModalClose}>Return to post</Button>
		</svelte:fragment>
	</Modal>
{/if}

<main class="m-5 space-y-5">
	<div class="space-y-2">
		<p class="text-lg dark:text-white">
			ID: <span class=" dark:text-gray-400">{post.id}</span>
		</p>

		<p class="text-lg dark:text-white">
			Uploaded at: <span class=" dark:text-gray-400">{formatDate(post.createdAt)}</span>
		</p>

		<p class="text-lg dark:text-white">
			Last updated at: <span class=" dark:text-gray-400">{formatDate(post.updatedAt)}</span>
		</p>

		<p class="text-lg dark:text-white">
			Author Username: <span class=" dark:text-gray-400">
				{#if post.author}
					<a class="underline" href="/profile/{post.author.username}">{post.author.username}</a>
				{:else}
					{DELETED_ACCOUNT_HEADING}
				{/if}
			</span>
		</p>

		<p class="text-lg dark:text-white">
			Author ID: <span class=" dark:text-gray-400">
				{#if post.author}
					<a class="underline" href="/profile/{post.author.username}">{post.author.id}</a>
				{:else}
					{DELETED_ACCOUNT_HEADING}
				{/if}
			</span>
		</p>

		<p class="text-lg dark:text-white">
			Description: <span class=" dark:text-gray-400">{post.description}</span>
		</p>

		<p class="text-lg dark:text-white">
			Likes: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.likes)}</span>
		</p>

		<p class="text-lg dark:text-white">
			Views: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.views)}</span>
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
		{#if $authenticatedUserStore}
			<CommentTextbox postId={post.id} />
		{/if}
		<p class="text-lg dark:text-white">Comments: {totalPostCommentCount}</p>
		<CommentsContainer postCommentCount={post.commentCount} postId={post.id} />
	</div>
</main>
