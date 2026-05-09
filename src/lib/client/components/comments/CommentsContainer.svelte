<script lang="ts">
	import { getCommentChain } from '$lib/client/api/comments';
	import { COMMENT_PERMALINK_FLASH_CLASS } from '$lib/client/constants/comments';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import Searchbar from '$lib/client/components/reusable/Searchbar.svelte';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { TCommentChainApiResponse } from '$lib/client/types/comments';
	import type { TComment } from '$lib/shared/types/comments';
	import { onMount, tick } from 'svelte';
	import Comment from './Comment.svelte';

	type Props = {
		postCommentCount: number;
	};

	let { postCommentCount = $bindable() }: Props = $props();

	const commentTree = getCommentTree();
	const user = getAuthenticatedUser();
	const hydratedComments: Record<string, true> = {};
	const inFlightHydrations: Record<string, Promise<boolean> | undefined> = {};

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

	const getCommentIdFromHash = (hash: string): string | null => {
		if (!hash || !hash.startsWith('#comment-')) return null;
		const commentId = hash.replace('#comment-', '').trim();
		return commentId.length > 0 ? commentId : null;
	};

	const triggerCommentPermalinkFlash = (element: HTMLElement) => {
		element.classList.remove(COMMENT_PERMALINK_FLASH_CLASS);
		void element.offsetWidth;
		element.classList.add(COMMENT_PERMALINK_FLASH_CLASS);
		const onAnimationEnd = () => {
			element.classList.remove(COMMENT_PERMALINK_FLASH_CLASS);
			element.removeEventListener('animationend', onAnimationEnd);
		};
		element.addEventListener('animationend', onAnimationEnd);
	};

	const scheduleFlashAfterScroll = (element: HTMLElement) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				window.setTimeout(() => triggerCommentPermalinkFlash(element), 420);
			});
		});
	};

	const scrollToComment = async (commentId: string, withFlash: boolean): Promise<boolean> => {
		await tick();
		const targetElement = document.getElementById(`comment-${commentId}`);
		if (!targetElement) return false;

		targetElement.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
		targetElement.focus({ preventScroll: true });
		if (withFlash) {
			scheduleFlashAfterScroll(targetElement);
		}
		return true;
	};

	const hydrateCommentChain = async (commentId: string): Promise<boolean> => {
		if ($commentTree.hasComment(commentId)) return true;
		if (hydratedComments[commentId]) return false;

		const inFlightRequest = inFlightHydrations[commentId];
		if (inFlightRequest) return await inFlightRequest;

		const chainPromise = (async () => {
			try {
				const response = await getCommentChain(commentId);
				if (!response.ok) return false;

				const responseBody = (await response.json()) as TCommentChainApiResponse;
				const commentChain = responseBody?.data?.commentChain ?? [];
				if (commentChain.length === 0) return false;

				commentTree.update((tree) => {
					tree.addComments(commentChain);
					return tree;
				});
				hydratedComments[commentId] = true;
				return true;
			} catch {
				return false;
			} finally {
				delete inFlightHydrations[commentId];
			}
		})();

		inFlightHydrations[commentId] = chainPromise;
		return await chainPromise;
	};

	const navigateToCommentFromHash = async () => {
		const commentId = getCommentIdFromHash(window.location.hash);
		if (!commentId) return;

		if (await scrollToComment(commentId, true)) return;

		const hydrated = await hydrateCommentChain(commentId);
		if (!hydrated) return;

		await scrollToComment(commentId, true);
	};

	onMount(() => {
		void navigateToCommentFromHash();
		window.addEventListener('hashchange', navigateToCommentFromHash);

		return () => {
			window.removeEventListener('hashchange', navigateToCommentFromHash);
			Object.keys(hydratedComments).forEach((key) => delete hydratedComments[key]);
			Object.keys(inFlightHydrations).forEach((key) => delete inFlightHydrations[key]);
			commentTree.set(new CommentTree());
			commentTreeUnsubscribe();
		};
	});
</script>

{#if $commentTree.getCount() > 0}
	<div class="w-full min-w-0 overflow-x-auto">
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
	</div>
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
