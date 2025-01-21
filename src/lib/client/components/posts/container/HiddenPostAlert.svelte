<script lang="ts">
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getBlacklistedPostPage,
		getHiddenPostsPage,
		getNsfwPostPage,
	} from '$lib/client/helpers/context';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount } from 'svelte';

	let titleParts: string[] = $state([]);

	const user = getAuthenticatedUser();
	const hiddenPostsPage = getHiddenPostsPage();
	const blacklistedPostsPage = getBlacklistedPostPage();
	const nsfwPostsPage = getNsfwPostPage();
	const activeModal = getActiveModal();

	const hiddenPostPageUnsubscribe = hiddenPostsPage.subscribe((data) => {
		titleParts = [];
		const updatedTitleParts: string[] = [];
		const { nsfwPosts, blacklistedPosts } = data;

		if (nsfwPosts.length > 0) {
			updatedTitleParts.push(`${nsfwPosts.length} NSFW`);
		}

		if (blacklistedPosts.length > 0) {
			updatedTitleParts.push(`${blacklistedPosts.length} blacklisted`);
		}

		titleParts = updatedTitleParts;
	});

	onMount(() => {
		return () => {
			hiddenPostPageUnsubscribe();
		};
	});
</script>

{#if $user && ($blacklistedPostsPage.length > 0 || $nsfwPostsPage.length > 0)}
	<hr class="mt-2 mb-2" />
	<Button
		on:click={() => activeModal.set({ isOpen: true, focusedModalName: HIDDEN_POSTS_MODAL_NAME })}
		color="red"
	>
		{`Click to display ${titleParts.join(' and ')} post(s)`}
	</Button>
{/if}
