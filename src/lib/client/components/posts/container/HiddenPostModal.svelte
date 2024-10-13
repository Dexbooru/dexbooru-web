<script lang="ts">
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import { modalStore } from '$lib/client/stores/layout';
	import { blacklistedPostPageStore, nsfwPostPageStore } from '$lib/client/stores/posts';
	import { authenticatedUserStore, userPreferenceStore } from '$lib/client/stores/users';
	import { Button, Modal, TabItem, Tabs } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import PostGrid from './PostGrid.svelte';

	let offendingTags: Set<string> = new Set<string>();
	let offendingArtists: Set<string> = new Set<string>();

	const hiddenPostPageUnsubscribe = blacklistedPostPageStore.subscribe((posts) => {
		const { blacklistedTags, blacklistedArtists } = get(userPreferenceStore);
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

	onDestroy(() => {
		hiddenPostPageUnsubscribe();
	});
</script>

{#if $authenticatedUserStore && ($blacklistedPostPageStore.length > 0 || $nsfwPostPageStore.length > 0)}
	<Modal
		title="Hidden posts on this page based on your preferences"
		open={$modalStore.isOpen && $modalStore.focusedModalName === HIDDEN_POSTS_MODAL_NAME}
		outsideclose
	>
		<Tabs style="underline">
			<TabItem
				open={$blacklistedPostPageStore.length > 0}
				disabled={$blacklistedPostPageStore.length === 0}
				title="Blacklisted ({$blacklistedPostPageStore.length})"
			>
				<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
					<span class="text-red-600">Offending tags: </span>{offendingTags.size > 0
						? Array.from(offendingTags).join(', ')
						: 'None found'}
					<br />
					<span class="text-red-600">Offending artists:</span>
					{offendingArtists.size > 0 ? Array.from(offendingArtists).join(', ') : 'None found'}
				</p>
				<PostGrid useHiddenPosts />
			</TabItem>
			<TabItem
				open={$nsfwPostPageStore.length > 0}
				disabled={$nsfwPostPageStore.length === 0}
				title="NSFW ({$nsfwPostPageStore.length})"
			>
				<PostGrid useNsfwPosts />
			</TabItem>
		</Tabs>

		<svelte:fragment slot="footer">
			<Button on:click={() => modalStore.set({ isOpen: false, focusedModalName: null })}
				>Close</Button
			>
		</svelte:fragment>
	</Modal>
{/if}
