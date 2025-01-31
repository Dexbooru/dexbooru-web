<script lang="ts">
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { MAXIMUM_COMMENTS_PER_POST } from '$lib/shared/constants/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import CommentTextbox from '../../comments/CommentTextbox.svelte';
	import CommentsContainer from '../../comments/CommentsContainer.svelte';
	import PostImageMetadata from './PostImageMetadata.svelte';
	import PostMetadata from './PostMetadata.svelte';

	type Props = {
		post: TPost;
		totalPostCommentCount?: string;
		hasLikedPost?: boolean;
	};

	let { post, totalPostCommentCount = '0', hasLikedPost = false }: Props = $props();

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();
</script>

<div class="space-y-5">
	<section class="space-y-2">
		<PostImageMetadata {hasLikedPost} {post} />
	</section>

	<section class="space-y-2">
		<PostMetadata {post} />
	</section>
</div>

<div class="space-y-2">
	{#if $user && $commentTree.getCount() < MAXIMUM_COMMENTS_PER_POST}
		<CommentTextbox postId={post.id} />
	{:else}
		<p class="text-gray-500 dark:text-gray-400 text-lg italic">
			The maximum of {MAXIMUM_COMMENTS_PER_POST} comments has been reached. Sorry :((
		</p>
	{/if}
	<p class="text-lg dark:text-white">Comments: {totalPostCommentCount}</p>
	<CommentsContainer postCommentCount={post.commentCount} />
</div>
