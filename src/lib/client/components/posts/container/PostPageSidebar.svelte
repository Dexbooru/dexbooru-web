<script lang="ts">
	import { page } from '$app/state';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import OrderedListOutline from 'flowbite-svelte-icons/OrderedListOutline.svelte';
	import PalleteSolid from 'flowbite-svelte-icons/PaletteSolid.svelte';
	import TagSolid from 'flowbite-svelte-icons/TagSolid.svelte';
	import {
		Sidebar,
		SidebarItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarWrapper
	} from 'flowbite-svelte';
	import HiddenPostAlert from './HiddenPostAlert.svelte';

	type Props = {
		uniqueTags?: string[];
		uniqueArtists?: string[];
	};

	let { uniqueTags = [], uniqueArtists = [] }: Props = $props();

	const postsBaseUrl = page.url.origin + page.url.pathname;
</script>

<Sidebar position="static">
	<SidebarWrapper>
		<SidebarGroup>
			<SidebarDropdownWrapper
				isOpen={uniqueArtists.length > 0 && uniqueTags.length > 0}
				label="Order by"
			>
				{#snippet icon()}
					<OrderedListOutline
						class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
					/>
				{/snippet}
				{#each Object.values(ORDER_BY_TRANSLATION_MAP) as orderOptions}
					{#each orderOptions as { label, isActive, getHref }}
						<SidebarItem
							href={getHref(postsBaseUrl)}
							{label}
							active={isActive(page.data.orderBy ?? 'createdAt', page.data.ascending ?? false)}
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
