<script lang="ts">
	import PostPresentation from '$lib/client/components/posts/container/PostPresentation.svelte';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPost } from '$lib/shared/types/posts';
	import { Button, Modal } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let post: TPost;
	let uploadedSuccessfully: boolean;
	let totalPostCommentCount: string = '0';
	let uploadSuccessModalOpen = true;

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();

	let tagNames: string[] = [];
	let artistNames: string[] = [];

	$: {
		console.log('listened to update', data.post);
		post = data.post;
		uploadedSuccessfully = data.uploadedSuccessfully;

		tagNames = data.post.tags.map((tag) => tag.name);
		artistNames = data.post.artists.map((artist) => artist.name);
	}

	const commentTreeUnsubscribe = commentTree.subscribe((tree) => {
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

{#if uploadedSuccessfully && $user && $user.id === post.author.id}
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
	<PostPresentation {post} {totalPostCommentCount} />
</main>
