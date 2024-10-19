<script lang="ts">
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import type { TPost } from '$lib/shared/types/posts';
	import CommentTextbox from '../../comments/CommentTextbox.svelte';
	import CommentsContainer from '../../comments/CommentsContainer.svelte';
	import PostImageMetadata from './PostImageMetadata.svelte';
	import PostMetadata from './PostMetadata.svelte';

	export let post: TPost;
	export let totalPostCommentCount: string = '0';

	const user = getAuthenticatedUser();
</script>

<div class="space-y-5">
	<section class="space-y-2">
		<PostImageMetadata {post} />
	</section>

	<section class="space-y-2">
		<PostMetadata {post} />
	</section>
</div>

<div class="space-y-2">
	{#if $user}
		<CommentTextbox postId={post.id} />
	{/if}
	<p class="text-lg dark:text-white">Comments: {totalPostCommentCount}</p>
	<CommentsContainer postCommentCount={post.commentCount} postId={post.id} />
</div>
