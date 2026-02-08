<script lang="ts">
	import PostPresentation from '$lib/client/components/posts/container/PostPresentation.svelte';
	import {
		getAuthenticatedUser,
		getCommentTree,
		getUpdatedPost,
	} from '$lib/client/helpers/context';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { NSFW_PREVIEW_IMAGE_SUFFIX, PREVIEW_IMAGE_SUFFIX } from '$lib/shared/constants/images';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPost } from '$lib/shared/types/posts';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let post: TPost = $derived(data.post);
	let similarPosts: TPost[] = $derived(data.similarPosts);
	let similarities: Record<string, number> = $derived(data.similarities);
	let uploadedSuccessfully = $derived(data.uploadedSuccessfully);
	let hasLikedPost = $derived(data.hasLikedPost);
	let totalPostCommentCount: string = $state('0');
	let uploadSuccessModalOpen = $state(true);
	let tagNames = $derived(data.post.tags.map((tag) => tag.name));
	let artistNames = $derived(data.post.artists.map((artist) => artist.name));

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();
	const updatedPost = getUpdatedPost();

	const commentTreeUnsubscribe = commentTree.subscribe((tree) => {
		totalPostCommentCount = normalizeCount(tree.getCount());
	});

	const uploadSuccessModalClose = () => {
		uploadSuccessModalOpen = false;

		const currentUrl = new URL(window.location.href);
		history.replaceState({}, document.title, currentUrl.pathname);
	};

	onMount(() => {
		commentTree.update((commentTree) => {
			post.comments.forEach((comment) => commentTree.addComment(comment));
			return commentTree;
		});

		return () => {
			updatedPost.set({});
			commentTreeUnsubscribe();
		};
	});
</script>

<svelte:head>
	<title>{post.description}</title>
	<meta property="og:title" content={post.description} />
	<meta
		property="og:description"
		content="Tags: {tagNames.join(', ')}, Artists: {artistNames.join(', ')}, Author: {post.author
			? post.author.username
			: DELETED_ACCOUNT_HEADING}, Views: {normalizeCount(post.views)}, Likes: {normalizeCount(
			post.likes,
		)}"
	/>
	{#if post.imageUrls.length > 0}
		<meta
			property="og:image"
			content={post.imageUrls.find((imageUrl) =>
				post.isNsfw
					? imageUrl.includes(NSFW_PREVIEW_IMAGE_SUFFIX)
					: imageUrl.includes(PREVIEW_IMAGE_SUFFIX),
			)}
		/>
	{/if}
	<meta
		property="og:author"
		content={post.author ? post.author.username : DELETED_ACCOUNT_HEADING}
	/>
	<meta property="article:published_time" content={formatDate(post.createdAt)} />
</svelte:head>

{#if uploadedSuccessfully && $user && $user.id === post.author.id}
	<Modal
		title="Your post was uploaded succesfully! 🚀🚀"
		open={uploadSuccessModalOpen}
		outsideclose
		onclose={uploadSuccessModalClose}
	>
		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			We got your post into Dexbooru succesfully! It should show up in your uploaded posts that can
			be found <a
				class="text-primary-600 inline-flex items-center hover:underline"
				href="/profile/posts/uploaded">here</a
			>.
		</p>

		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			You can delete the post if you want, via the card preview on the uploaded posts page.
		</p>

		{#snippet footer()}
			<Button onclick={uploadSuccessModalClose}>Return to post</Button>
		{/snippet}
	</Modal>
{/if}

<main class="m-5 space-y-5">
	<PostPresentation {hasLikedPost} {post} {totalPostCommentCount} {similarPosts} {similarities} />
</main>
