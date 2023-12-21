<script lang="ts">
	import type { IPost } from '$lib/shared/types/posts';
	import { Card, Button } from 'flowbite-svelte';
	import PostCardBody from '$lib/client/components/posts/PostCardBody.svelte';
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import { page } from '$app/stores';
	import { postsPageStore } from '$lib/client/stores/posts';
	import { deletePost } from '$lib/client/api/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';

	export let post: IPost;
	const { id: postId, description, author, tags, artists, imageUrls, createdAt } = post;
	const isPostAuthor = $page.data.user && $page.data.user.id === author.id;

	let postDeletionLoading = false;

	const handleDeletePost = async () => {
		postDeletionLoading = true;
		const response = await deletePost({ postId, authorId: author.id });
		postDeletionLoading = false;

		if (response.ok) {
			postsPageStore.update((previousPosts) => previousPosts.filter((post) => post.id !== postId));
			toast.push('The post was deleted successfully!', SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push('There was an error while deleting the post!', FAILURE_TOAST_OPTIONS);
		}
	};
</script>

<Card>
	<ImageCarousel
		postHref="/posts/{postId}"
		{imageUrls}
		imagesAlt={description}
		slideDuration={750}
	/>
	<PostCardBody {author} {createdAt} {tags} {artists} />

	<div class="flex flex-col space-y-3">
		<Button href="/posts/{postId}" class="w-full" color="blue">View full post</Button>
		{#if isPostAuthor}
			<Button disabled={postDeletionLoading} on:click={handleDeletePost} class="w-full" color="red"
				>Delete this post</Button
			>
		{/if}
	</div>
</Card>
