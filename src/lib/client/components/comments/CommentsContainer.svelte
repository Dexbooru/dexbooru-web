<script lang="ts">
	import { getComments } from '$lib/client/api/comments';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import CommentTree from '$lib/shared/helpers/comments';
	import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
	import type { IComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import Comment from './Comment.svelte';

	export let postId: string;
	export let parentCommentId: string | null = null;

	let replies: IComment[] = [];
	let commentsLoading = false;
	let loadMoreButtonText = 'Load comments';

	const createLoadRepliesClickHandler = (
		postId: string,
		parentCommentId: string | null
	): (() => Promise<void>) => {
		let pageNumber = 0;

		return async () => {
			commentsLoading = true;
			const response = await getComments(postId, parentCommentId, pageNumber);
			commentsLoading = false;

			if (response.ok) {
				const comments: IComment[] = convertDataStructureToIncludeDatetimes<IComment>(
					(await response.json()) as IComment[],
					['createdAt']
				);

				commentTreeStore.update((currentCommentTree) => {
					comments.forEach((comment) => {
						currentCommentTree.addComment(comment);
					});

					return currentCommentTree;
				});

				pageNumber++;
				loadMoreButtonText = pageNumber > 0 ? 'Load more comments' : 'Load comments';
			} else {
				toast.push(
					'There was an error that occured while loading the comments',
					FAILURE_TOAST_OPTIONS
				);
			}
		};
	};

	const commentTreeUnsubscribe = commentTreeStore.subscribe((currentCommentTree) => {
		replies = currentCommentTree.getReplies(parentCommentId === null ? 'root' : parentCommentId);
	});

	onDestroy(() => {
		commentTreeStore.set(new CommentTree());
		commentTreeUnsubscribe();
	});
</script>

<section class="ml-2">
	{#each replies as reply}
		<Comment onLoadRepliesClick={createLoadRepliesClickHandler(postId, reply.id)} comment={reply} />
		<svelte:self {postId} parentCommentId={reply.id} />
	{/each}

	<Button
		on:click={createLoadRepliesClickHandler(postId, parentCommentId)}
		color="blue"
		class="mt-2"
		>{loadMoreButtonText}
	</Button>
</section>
