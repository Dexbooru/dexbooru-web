<script lang="ts">
	import CommentsContainer from '$lib/client/components/comments/CommentsContainer.svelte';
	import { getCommentTree } from '$lib/client/helpers/context';
	import CommentTree from '$lib/shared/helpers/comments';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const commentTree = getCommentTree();
	let totalCommentCount = $state(0);

	const commentTreeUnsubscribe = commentTree.subscribe((tree) => {
		totalCommentCount = tree.getCount();
	});

	onMount(() => {
		commentTree.set(new CommentTree());
		commentTree.update((tree) => {
			data.thread.forEach((comment) => tree.addComment(comment));
			return tree;
		});

		return () => {
			commentTreeUnsubscribe();
		};
	});
</script>

<svelte:head>
	<title>Comment Thread - {data.comment.id}</title>
</svelte:head>

<main class="m-5">
	<div class="mb-6">
		<a
			href="/posts/{data.comment.postId}"
			class="text-blue-600 hover:underline flex items-center gap-2 mb-2"
		>
			&larr; Back to post
		</a>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Comment Thread</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-1">
			On post: <span class="font-medium">{data.comment.post.description || 'Untitled'}</span>
		</p>
	</div>

	<CommentsContainer bind:postCommentCount={totalCommentCount} />
</main>
