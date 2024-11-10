<script lang="ts">
	import { getCommentTree } from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';

	interface Props {
		post: TPost;
	}

	let { post }: Props = $props();

	const commentTree = getCommentTree();
</script>

<p class="text-lg dark:text-white cursor-text">
	ID: <span class=" dark:text-gray-400">{post.id}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Uploaded at: <span class=" dark:text-gray-400">{formatDate(post.createdAt)}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Last updated at: <span class=" dark:text-gray-400">{formatDate(post.updatedAt)}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Author Username: <span class=" dark:text-gray-400">
		{#if post.author}
			<a class="underline" href="/profile/{post.author.username}">{post.author.username}</a>
		{:else}
			{DELETED_ACCOUNT_HEADING}
		{/if}
	</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Author ID: <span class=" dark:text-gray-400">
		{#if post.author}
			<a class="underline" href="/profile/{post.author.username}">{post.author.id}</a>
		{:else}
			{DELETED_ACCOUNT_HEADING}
		{/if}
	</span>
</p>

<p class="text-lg dark:text-white whitespace-pre-wrap cursor-text">
	Description: <br /><span class=" dark:text-gray-400">{post.description}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Is Nsfw?: <span class=" dark:text-gray-400">{post.isNsfw ? 'Yes' : 'No'}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Comment count: <span class=" dark:text-gray-400"
		>{formatNumberWithCommas(Math.max(post.commentCount, $commentTree.getCount()))}</span
	>
</p>

<p class="text-lg dark:text-white cursor-text">
	Likes: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.likes)}</span>
</p>

<p class="text-lg dark:text-white cursor-text">
	Views: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.views)}</span>
</p>

<div class="space-y-1">
	<p class="text-lg dark:text-white cursor-text">Tags</p>
	<LabelContainer labelType="tag" labelColor="red" labels={post.tags} />
</div>

<div class="space-y-1">
	<p class="text-lg dark:text-white cursor-text">Artists</p>
	<LabelContainer labelType="artist" labelColor="green" labels={post.artists} />
</div>
