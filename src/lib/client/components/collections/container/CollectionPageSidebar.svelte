<script lang="ts">
	import { page } from '$app/state';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/collections';
	import { getCollectionPage } from '$lib/client/helpers/context';
	import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';
	import OrderedListSolid from 'flowbite-svelte-icons/ListOrdoredSolid.svelte';
	import UserSolid from 'flowbite-svelte-icons/UserSolid.svelte';
	import Sidebar from 'flowbite-svelte/Sidebar.svelte';
	import SidebarDropdownItem from 'flowbite-svelte/SidebarDropdownItem.svelte';
	import SidebarDropdownWrapper from 'flowbite-svelte/SidebarDropdownWrapper.svelte';
	import SidebarGroup from 'flowbite-svelte/SidebarGroup.svelte';
	import SidebarWrapper from 'flowbite-svelte/SidebarWrapper.svelte';

	type Props = {
		uniqueAuthors: { id: string; username: string; profilePictureUrl: string }[];
	};
	let { uniqueAuthors }: Props = $props();

	const collectionBaseUrl = page.url.origin + page.url.pathname;
	const collectionPage = getCollectionPage();
</script>

{#if page.data.collections}
	<Sidebar>
		<SidebarWrapper>
			<SidebarGroup>
				<SidebarDropdownWrapper isOpen={$collectionPage.length > 0} label="Order by">
					{#snippet icon()}
						<OrderedListSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					{/snippet}
					{#each Object.values(ORDER_BY_TRANSLATION_MAP) as orderOptions}
						{#each orderOptions as { label, isActive, getHref }}
							<SidebarDropdownItem
								href={getHref(collectionBaseUrl)}
								{label}
								active={isActive(
									page.data.orderBy as TCollectionOrderByColumn,
									page.data.ascending ?? false,
								)}
							/>
						{/each}
					{/each}
				</SidebarDropdownWrapper>

				<SidebarDropdownWrapper isOpen={uniqueAuthors.length > 0} label="All Authors">
					{#snippet icon()}
						<UserSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					{/snippet}

					{#each uniqueAuthors as uniqueAuthor}
						<SidebarDropdownItem
							href="/profile/{uniqueAuthor.username}"
							label={uniqueAuthor.username}
						/>
					{/each}
				</SidebarDropdownWrapper>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>
{/if}
