<script lang="ts">
	import { page } from '$app/state';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/collections';
	import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';
	import {
		Sidebar,
		SidebarDropdownItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarWrapper,
	} from 'flowbite-svelte';
	import { ListOrdoredSolid as OrderedListSolid, UserSolid } from 'flowbite-svelte-icons';

	type Props = {
		uniqueAuthors: { id: string; username: string; profilePictureUrl: string }[];
	};
	let { uniqueAuthors }: Props = $props();

	const collectionBaseUrl = page.url.origin + page.url.pathname;
</script>

{#if page.data.collections}
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
								href={getHref(collectionBaseUrl)}
								{label}
								active={isActive(
									page.data.orderBy as TCollectionOrderByColumn,
									page.data.ascending,
								)}
							/>
						{/each}
					{/each}
				</SidebarDropdownWrapper>

				<SidebarDropdownWrapper label="All Authors">
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
