<script lang="ts">
	import {
		blacklistedPostPageStore,
		displayHiddenPostModalStore,
		hiddenPostsPageStore,
		nsfwPostPageStore,
	} from '$lib/client/stores/posts';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { Alert } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';

	let titleParts: string[] = [];

	const hiddenPostPageUnsubscribe = hiddenPostsPageStore.subscribe((data) => {
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
				displayHiddenPostModalStore.set(true);
			});
		}
	});

	onDestroy(() => {
		hiddenPostPageUnsubscribe();
	});
</script>

{#if $authenticatedUserStore && ($blacklistedPostPageStore.length > 0 || $nsfwPostPageStore.length > 0)}
	<hr class="mt-2 mb-2" />
	<Alert
		id="hidden-posts-page-alert"
		defaultClass="p-2 space-x-2 hover:cursor-pointer bg-gray-50 hover:bg-gray-200 hover:dark:bg-gray-700 text-sm text-wrap"
		color="red"
	>
		<InfoCircleSolid slot="icon" class="w-5 h-5" />
		{`Click to display ${titleParts.join(' and ')} post(s)`}
	</Alert>
{/if}
