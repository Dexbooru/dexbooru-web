<script lang="ts">
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getBlacklistedPostPage,
		getHiddenPostsPage,
		getNsfwPostPage,
	} from '$lib/client/helpers/context';
	import { Alert } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
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
		const hiddenPostAlert = document.getElementById('hidden-posts-page-alert');
		if (hiddenPostAlert) {
			hiddenPostAlert.addEventListener('click', () => {
				activeModal.set({ isOpen: true, focusedModalName: HIDDEN_POSTS_MODAL_NAME });
			});
		}
	});

	onMount(() => {
		return () => {
			hiddenPostPageUnsubscribe();
		};
	});
</script>

{#if $user && ($blacklistedPostsPage.length > 0 || $nsfwPostsPage.length > 0)}
	<hr class="mt-2 mb-2" />
	<Alert
		id="hidden-posts-page-alert"
		defaultClass="p-2 space-x-2 hover:cursor-pointer bg-gray-50 hover:bg-gray-200 hover:dark:bg-gray-700 text-sm text-wrap"
		color="red"
	>
		{#snippet icon()}
			<InfoCircleSolid class="w-5 h-5" />
		{/snippet}
		{`Click to display ${titleParts.join(' and ')} post(s)`}
	</Alert>
{/if}
