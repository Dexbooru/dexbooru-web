<script lang="ts">
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import CommentTree from '$lib/shared/helpers/comments';
	import { onMount } from 'svelte';
	import Comment from './Comment.svelte';

	type Props = {
		postCommentCount: number;
	};

	let { postCommentCount = $bindable() }: Props = $props();

	const commentTree = getCommentTree();
	const user = getAuthenticatedUser();

	const commentTreeUnsubscribe = commentTree.subscribe((currentCommentTree) => {
		if (currentCommentTree.getCount() > 0) {
			postCommentCount = currentCommentTree.getCount();
		}
	});

	onMount(() => {
		return () => {
			commentTree.set(new CommentTree());
			commentTreeUnsubscribe();
		};
	});
</script>

{#if $commentTree.getCount() > 0}
	<section class="ml-2">
		{#each $commentTree.getReplies('root') ?? [] as comment (comment.id)}
			<Comment {comment} />
		{/each}
	</section>
{:else if postCommentCount === 0}
	<div class="flex justify-left p-2">
		<p class="text-gray-500 dark:text-gray-400 text-lg italic">
			No comments found.
			{#if $user}
				Be the first to comment!
			{/if}
		</p>
	</div>
{/if}
