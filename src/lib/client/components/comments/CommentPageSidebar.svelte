<script lang="ts">
	import { page } from '$app/state';
	import { ORDER_BY_COMMENT_TRANSLATION_MAP } from '$lib/client/constants/comments';
	import type { TCommentOrderByColumn } from '$lib/shared/types/comments';
	import OrderedListOutline from 'flowbite-svelte-icons/OrderedListOutline.svelte';
	import Sidebar from 'flowbite-svelte/Sidebar.svelte';
	import SidebarDropdownWrapper from 'flowbite-svelte/SidebarDropdownWrapper.svelte';
	import SidebarGroup from 'flowbite-svelte/SidebarGroup.svelte';
	import SidebarItem from 'flowbite-svelte/SidebarItem.svelte';
	import SidebarWrapper from 'flowbite-svelte/SidebarWrapper.svelte';

	const commentsBaseUrl = page.url.origin + page.url.pathname;
</script>

<Sidebar position="static">
	<SidebarWrapper>
		<SidebarGroup>
			<SidebarDropdownWrapper isOpen={true} label="Order by">
				{#snippet icon()}
					<OrderedListOutline
						class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
					/>
				{/snippet}
				{#each Object.entries(ORDER_BY_COMMENT_TRANSLATION_MAP) as [column, orderOptions] (column)}
					{#each orderOptions as { label, isActive, getHref } (label)}
						<SidebarItem
							href={getHref(commentsBaseUrl)}
							{label}
							active={isActive(
								(page.data.orderBy as TCommentOrderByColumn) ?? 'createdAt',
								page.data.ascending ?? false,
							)}
						/>
					{/each}
				{/each}
			</SidebarDropdownWrapper>
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>
