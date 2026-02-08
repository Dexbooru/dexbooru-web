<script lang="ts">
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getAuthenticatedUserPreferences,
		getBlacklistedPostPage,
		getNsfwPostPage,
	} from '$lib/client/helpers/context';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { onMount } from 'svelte';
	import PostGrid from './PostGrid.svelte';

	let offendingTags: Set<string> = $state(new Set<string>());
	let offendingArtists: Set<string> = $state(new Set<string>());

	const user = getAuthenticatedUser();
	const userPreferences = getAuthenticatedUserPreferences();
	const blacklistedPostPage = getBlacklistedPostPage();
	const nsfwPostPage = getNsfwPostPage();
	const activeModal = getActiveModal();

	const hiddenPostPageUnsubscribe = blacklistedPostPage.subscribe((posts) => {
		const { blacklistedTags, blacklistedArtists } = $userPreferences;
		posts.forEach((post) => {
			post.tags.forEach((tag) => {
				if (blacklistedTags.includes(tag.name)) {
					offendingTags.add(tag.name);
				}
			});
			post.artists.forEach((artist) => {
				if (blacklistedArtists.includes(artist.name)) {
					offendingArtists.add(artist.name);
				}
			});
		});

		offendingTags = offendingTags;
		offendingArtists = offendingArtists;
	});

	onMount(() => {
		return () => {
			hiddenPostPageUnsubscribe();
		};
	});
</script>

{#if $user && ($blacklistedPostPage.length > 0 || $nsfwPostPage.length > 0)}
	<Modal
		title="Hidden posts on this page based on your preferences"
		open={$activeModal.isOpen && $activeModal.focusedModalName === HIDDEN_POSTS_MODAL_NAME}
		outsideclose
		onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	>
		<Tabs style="underline">
			<TabItem
				open={$blacklistedPostPage.length > 0}
				disabled={$blacklistedPostPage.length === 0}
				title="Blacklisted ({$blacklistedPostPage.length})"
			>
				<p class="mb-2 text-base leading-relaxed text-gray-500 dark:text-gray-400">
					<span class="text-red-600">Offending tags:</span>{offendingTags.size > 0
						? ' ' + Array.from(offendingTags).join(', ')
						: 'None found'}
					<br />
					<span class="text-red-600">Offending artists:</span>
					{offendingArtists.size > 0 ? ' ' + Array.from(offendingArtists).join(', ') : 'None found'}
				</p>
				<PostGrid useHiddenPosts />
			</TabItem>
			<TabItem
				open={$nsfwPostPage.length > 0}
				disabled={$nsfwPostPage.length === 0}
				title="NSFW ({$nsfwPostPage.length})"
			>
				<PostGrid useNsfwPosts />
			</TabItem>
		</Tabs>

		{#snippet footer()}
			<Button onclick={() => activeModal.set({ isOpen: false, focusedModalName: null })}
				>Close</Button
			>
		{/snippet}
	</Modal>
{/if}
