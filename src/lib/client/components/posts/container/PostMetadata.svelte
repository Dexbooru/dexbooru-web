<script lang="ts">
	import { getCommentTree, getUpdatedPost } from '$lib/client/helpers/context';
	import { formatNumberWithCommas, roundNumber } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';

	type Props = {
		post: TPost;
		similarPosts: TPost[];
		similarities: Record<string, number>;
	};

	let { post, similarPosts, similarities }: Props = $props();

	const updatedPost = getUpdatedPost();
	const commentTree = getCommentTree();
</script>

<p class="text-lg dark:text-white">
	ID: <span class=" dark:text-gray-400">{post.id}</span>
</p>

<p class="text-lg dark:text-white">
	Moderation status: <span class=" dark:text-gray-400">{capitalize(post.moderationStatus)}</span>
</p>

<p class="text-lg dark:text-white">
	Uploaded at: <span class=" dark:text-gray-400">{formatDate(post.createdAt)}</span>
</p>

<p class="text-lg dark:text-white">
	Last updated at: <span class=" dark:text-gray-400"
		>{formatDate($updatedPost.updatedAt ?? post.updatedAt)}</span
	>
</p>

<p class="text-lg dark:text-white">
	Author Username: <span class=" dark:text-gray-400">
		{#if post.author}
			<a class="underline" href="/profile/{post.author.username}">{post.author.username}</a>
		{:else}
			{DELETED_ACCOUNT_HEADING}
		{/if}
	</span>
</p>

{#if post.author}
	<p class="text-lg dark:text-white">
		Author ID: <span class=" dark:text-gray-400">
			{post.author.id}
		</span>
	</p>
{/if}

<p class="text-lg dark:text-white whitespace-pre-wrap">
	Source link: <a
		target="_blank"
		referrerpolicy="no-referrer"
		class="underline"
		href={$updatedPost.sourceLink ?? post.sourceLink}
		>{$updatedPost.sourceLink ?? post.sourceLink}</a
	>
</p>

{#if post.sources.length > 0}
	<p class="text-lg dark:text-white whitespace-pre-wrap">
		Source titles: <span class="dark:text-gray-400"
			>{post.sources.map((source) => source.sourceTitle).join(', ')}</span
		>
	</p>

	<p class="text-lg dark:text-white whitespace-pre-wrap">
		Source types: <span class="dark:text-gray-400"
			>{post.sources.map((source) => source.sourceType).join(', ')}</span
		>
	</p>
{/if}

<p class="text-lg dark:text-white whitespace-pre-wrap">
	Description: <br /><span class="dark:text-gray-400"
		>{$updatedPost.description ?? post.description}</span
	>
</p>

<p class="text-lg dark:text-white">
	Is Nsfw?: <span class="dark:text-gray-400">{post.isNsfw ? 'Yes' : 'No'}</span>
</p>

<p class="text-lg dark:text-white">
	Comment count: <span class=" dark:text-gray-400"
		>{formatNumberWithCommas(Math.max(post.commentCount, $commentTree.getCount()))}</span
	>
</p>

<p class="text-lg dark:text-white">
	Likes: <span class=" dark:text-gray-400"
		>{formatNumberWithCommas($updatedPost.likes ?? post.likes)}</span
	>
</p>

<p class="text-lg dark:text-white">
	Views: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.views)}</span>
</p>

<div class="space-y-1">
	<p class="text-lg dark:text-white">Tags</p>
	<LabelContainer labelType="tag" labelColor="red" labels={post.tags} />
</div>

<div class="space-y-1">
	<p class="text-lg dark:text-white">Artists</p>
	<LabelContainer labelType="artist" labelColor="green" labels={post.artists} />
</div>

{#if similarPosts.length > 0}
	<p class="text-lg dark:text-white">Similar posts (found {similarPosts.length})</p>
	<section class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
		{#each similarPosts as post (post.id)}
			<div class="flex flex-col items-center">
				<a href="/posts/{post.id}" class="block">
					<img
						width="200"
						height="200"
						alt={post.tagString + post.artistString}
						src={post.imageUrls[0]}
						class="w-[200px] h-[200px] object-contain rounded-lg transition-transform duration-200 hover:scale-105"
					/>
				</a>
				<span class="text-sm dark:text-gray-300 text-center mt-2">
					Similarity: {roundNumber(similarities[post.id], 2)}%
				</span>
			</div>
		{/each}
	</section>
{/if}
