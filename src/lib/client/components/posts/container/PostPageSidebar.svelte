<script lang="ts">
	import { page } from '$app/stores';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import { postPaginationStore } from '$lib/client/stores/posts';
	import { userPreferenceStore } from '$lib/client/stores/users';
	import {
		Sidebar,
		SidebarDropdownItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarWrapper,
	} from 'flowbite-svelte';
	import {
		ListOrdoredSolid as OrderedListSolid,
		PalleteSolid,
		TagSolid,
	} from 'flowbite-svelte-icons';
	import HiddenPostAlert from './HiddenPostAlert.svelte';

	export let uniqueTags: string[] = [];
	export let uniqueArtists: string[] = [];

	const postsBaseUrl = $page.url.origin + $page.url.pathname;
</script>

{#if $postPaginationStore}
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
								href={getHref(postsBaseUrl)}
								{label}
								active={isActive($postPaginationStore.orderBy, $postPaginationStore.ascending)}
							/>
						{/each}
					{/each}
				</SidebarDropdownWrapper>
				{#if !$userPreferenceStore.hidePostMetadataOnPreview}
					<SidebarDropdownWrapper label="All Tags">
						<svelte:fragment slot="icon">
							<TagSolid
								class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
							/>
						</svelte:fragment>
						<LabelContainer labelType="tag" labelsAreLarge labels={uniqueTags} />
					</SidebarDropdownWrapper>
					<SidebarDropdownWrapper label="All Artists">
						<svelte:fragment slot="icon">
							<PalleteSolid
								class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
							/>
						</svelte:fragment>
						<LabelContainer
							labelType="artist"
							labelsAreLarge
							labelColor="green"
							labels={uniqueArtists}
						/>
					</SidebarDropdownWrapper>
				{/if}
			</SidebarGroup>

			<HiddenPostAlert />
		</SidebarWrapper>
	</Sidebar>
{/if}
