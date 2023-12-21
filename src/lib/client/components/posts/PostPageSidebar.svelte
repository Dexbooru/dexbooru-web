<script lang="ts">
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import type { TPostOrderByColumn } from '$lib/shared/types/posts';
	import {
		Sidebar,
		SidebarGroup,
		SidebarWrapper,
		SidebarDropdownItem,
		SidebarDropdownWrapper
	} from 'flowbite-svelte';
	import {
		ListOrdoredSolid as OrderedListSolid,
		PalleteSolid,
		TagSolid
	} from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { postsPageStore } from '$lib/client/stores/posts';

	export let orderBy: TPostOrderByColumn;
	export let ascending: boolean;
	export let uniqueTags: string[] = [];
	export let uniqueArtists: string[] = [];

	const postsBaseUrl = $page.url.origin + $page.url.pathname;

	const handleTagsClick = (tag: string) => {
		if (!tag) return;

		postsPageStore.update((currentPosts) => {
			return currentPosts.filter((post) => {
				const postTags = post.tags.map((tag) => tag.name);
				return postTags.includes(tag);
			});
		});
	};

	const handleArtistClick = (artist: string) => {
		if (!artist) return;
		console.log($postsPageStore);
		postsPageStore.update((currentPosts) => {
			return currentPosts.filter((post) => {
				const postArtists = post.artists.map((artist) => artist.name);
				return postArtists.includes(artist);
			});
		});
	};
</script>

<Sidebar>
	<SidebarWrapper>
		<SidebarGroup>
			<SidebarDropdownWrapper isOpen label="Order by">
				<svelte:fragment slot="icon">
					<OrderedListSolid
						class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
					/>
				</svelte:fragment>
				{#each Object.values(ORDER_BY_TRANSLATION_MAP) as orderOptions}
					{#each orderOptions as { label, isActive, getHref }}
						<SidebarDropdownItem
							data-sveltekit-reload
							href={getHref(postsBaseUrl)}
							{label}
							active={isActive(orderBy, ascending)}
						/>
					{/each}
				{/each}
			</SidebarDropdownWrapper>
			<SidebarDropdownWrapper isOpen label="All Tags">
				<svelte:fragment slot="icon">
					<TagSolid
						class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
					/>
				</svelte:fragment>
				<LabelContainer labelsAreLarge labels={uniqueTags} handleLabelClick={handleTagsClick} />
			</SidebarDropdownWrapper>
			<SidebarDropdownWrapper isOpen label="All Artists">
				<svelte:fragment slot="icon">
					<PalleteSolid
						class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
					/>
				</svelte:fragment>
				<LabelContainer
					labelsAreLarge
					labelColor="green"
					labels={uniqueArtists}
					handleLabelClick={handleArtistClick}
				/>
			</SidebarDropdownWrapper>
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>
