<script lang="ts">
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import Searchbar from '$lib/client/components/reusable/Searchbar.svelte';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { TComment } from '$lib/shared/types/comments';
	import { onMount } from 'svelte';
	import Comment from './Comment.svelte';

	type Props = {
		postCommentCount: number;
	};

	let { postCommentCount = $bindable() }: Props = $props();

	const commentTree = getCommentTree();
	const user = getAuthenticatedUser();

	let searchQuery = $state('');
	let searchResults: TComment[] = $derived(
		searchQuery.length > 0 ? $commentTree.search(searchQuery) : [],
	);

	const handleSearchInput = (query: string) => {
		searchQuery = query;
	};

	const clearSearch = () => {
		searchQuery = '';
	};

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
	<div class="mb-4 ml-2">
		<Searchbar
			placeholder="Search comments..."
			queryInputHandler={handleSearchInput}
			queryInputClear={clearSearch}
			width="100%"
		/>
	</div>

	{#if searchQuery.length > 0}
		<section class="ml-2">
			{#if searchResults.length > 0}
				{#each searchResults as comment (comment.id)}
					<Comment {comment} showReplies={false} />
				{/each}
			{:else}
				<p class="text-gray-500 italic">No comments found matching "{searchQuery}"</p>
			{/if}
		</section>
	{:else}
		<section class="ml-2">
			{#each $commentTree.getReplies('root') ?? [] as comment (comment.id)}
				<Comment {comment} />
			{/each}
		</section>
	{/if}
{:else if postCommentCount === 0}
	<div class="justify-left flex p-2">
		<p class="text-lg text-gray-500 italic dark:text-gray-400">
			No comments found.
			{#if $user}
				Be the first to comment!
			{/if}
		</p>
	</div>
{/if}
