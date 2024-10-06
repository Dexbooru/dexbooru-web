<script lang="ts">
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import PostCardBody from '$lib/client/components/posts/card/PostCardBody.svelte';
	import type { TPost } from '$lib/shared/types/posts';
	import { Card, Toast } from 'flowbite-svelte';
	import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
	import PostCardActions from './PostCardActions.svelte';
	import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let post: TPost;

	const { id: postId, description, author, tags, artists, imageUrls, createdAt, isNsfw } = post;
	let likes = post.likes;
</script>

<Card>
	{#if isNsfw}
		<Toast
			dismissable={false}
			divClass="w-full max-w-xs p-4 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3 mt-2 mb-2"
			contentClass="flex space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-700"
		>
			<ExclamationCircleSolid class="w-5 h-5 text-primary-600 dark:text-primary-500" />
			<div class="ps-4 text-sm font-normal">This post is marked as NSFW!</div>
		</Toast>
	{/if}

	<ImageCarousel
		postHref="/posts/{postId}"
		{imageUrls}
		imagesAlt={description}
		slideDuration={350}
		blurImages={isNsfw}
		transitionFunction={(x) => scale(x, { duration: 500, easing: quintOut })}
	/>
	<PostCardBody {post} {author} {createdAt} {tags} {artists} />
	<PostCardActions {post} {author} {likes} {postId} />
</Card>
