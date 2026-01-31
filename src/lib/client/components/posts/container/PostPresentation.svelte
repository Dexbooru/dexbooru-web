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
		similarPosts: TPost[];
		similarities: Record<string, number>;
		totalPostCommentCount?: string;
		hasLikedPost?: boolean;
	};

	let {
		post,
		totalPostCommentCount = '0',
		hasLikedPost = false,
		similarPosts = [],
		similarities = {},
	}: Props = $props();

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();
</script>

<div class="space-y-5">
	<section class="space-y-2">
		<PostImageMetadata {hasLikedPost} {post} />
	</section>

	<section class="space-y-2">
		<PostMetadata {post} {similarPosts} {similarities} />
	</section>

	{#if post.sources.some((s) => s.sourceType === 'ANIME')}
		<section class="space-y-2">
			<p class="text-lg dark:text-white">Anime Info:</p>
			<div class="flex flex-wrap gap-2">
				{#each post.sources.filter((s) => s.sourceType === 'ANIME') as source}
					<a
						href="/anime/{source.sourceTitle.toLowerCase().replaceAll(' ', '_')}"
						class="text-blue-500 hover:underline"
					>
						Search "{source.sourceTitle}" on Jikan
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<div class="space-y-2">
	{#if $user && $commentTree.getCount() < MAXIMUM_COMMENTS_PER_POST}
		<CommentTextbox postId={post.id} />
	{:else if $user}
		<p class="text-gray-500 dark:text-gray-400 text-lg italic">
			The maximum of {MAXIMUM_COMMENTS_PER_POST} comments has been reached. Sorry :((
		</p>
	{/if}
	<p class="text-lg dark:text-white">Comments: {totalPostCommentCount}</p>
	<CommentsContainer postCommentCount={post.commentCount} />
</div>
