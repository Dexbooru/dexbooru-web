<script lang="ts">
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';

	export let post: TPost;
</script>

<p class="text-lg dark:text-white">
	ID: <span class=" dark:text-gray-400">{post.id}</span>
</p>

<p class="text-lg dark:text-white">
	Uploaded at: <span class=" dark:text-gray-400">{formatDate(post.createdAt)}</span>
</p>

<p class="text-lg dark:text-white">
	Last updated at: <span class=" dark:text-gray-400">{formatDate(post.updatedAt)}</span>
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

<p class="text-lg dark:text-white">
	Author ID: <span class=" dark:text-gray-400">
		{#if post.author}
			<a class="underline" href="/profile/{post.author.username}">{post.author.id}</a>
		{:else}
			{DELETED_ACCOUNT_HEADING}
		{/if}
	</span>
</p>

<p class="text-lg dark:text-white whitespace-pre-wrap">
	Description: <br /><span class=" dark:text-gray-400">{post.description}</span>
</p>

<p class="text-lg dark:text-white">
	Is Nsfw?: <span class=" dark:text-gray-400">{post.isNsfw ? 'Yes' : 'No'}</span>
</p>

<p class="text-lg dark:text-white">
	Comment count: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.commentCount)}</span
	>
</p>

<p class="text-lg dark:text-white">
	Likes: <span class=" dark:text-gray-400">{formatNumberWithCommas(post.likes)}</span>
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
