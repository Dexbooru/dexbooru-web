<script lang="ts">
	import { page } from '$app/state';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import { getPostPaginationData } from '$lib/client/helpers/context';
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

	interface Props {
		uniqueTags?: string[];
		uniqueArtists?: string[];
	}

	let { uniqueTags = [], uniqueArtists = [] }: Props = $props();

	const postPaginationData = getPostPaginationData();

	const postsBaseUrl = page.url.origin + page.url.pathname;
</script>

{#if $postPaginationData}
	<Sidebar>
		<SidebarWrapper>
			<SidebarGroup>
				<SidebarDropdownWrapper isOpen label="Order by">
					{#snippet icon()}
						<OrderedListSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					{/snippet}
					{#each Object.values(ORDER_BY_TRANSLATION_MAP) as orderOptions}
						{#each orderOptions as { label, isActive, getHref }}
							<SidebarDropdownItem
								href={getHref(postsBaseUrl)}
								{label}
								active={isActive($postPaginationData.orderBy, $postPaginationData.ascending)}
							/>
						{/each}
					{/each}
				</SidebarDropdownWrapper>
				<SidebarDropdownWrapper label="All Tags">
					{#snippet icon()}
						<TagSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					{/snippet}
					<LabelContainer labelType="tag" labelsAreLarge labels={uniqueTags} />
				</SidebarDropdownWrapper>
				<SidebarDropdownWrapper label="All Artists">
					{#snippet icon()}
						<PalleteSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					{/snippet}
					<LabelContainer
						labelType="artist"
						labelsAreLarge
						labelColor="green"
						labels={uniqueArtists}
					/>
				</SidebarDropdownWrapper>
			</SidebarGroup>

			<HiddenPostAlert />
		</SidebarWrapper>
	</Sidebar>
{/if}
