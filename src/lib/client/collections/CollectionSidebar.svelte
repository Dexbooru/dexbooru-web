<script lang="ts">
	import {
		Sidebar,
		SidebarDropdownItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
	} from 'flowbite-svelte';
	import {
		ChevronDoubleDownOutline,
		ChevronDoubleUpOutline,
		PlusSolid,
		UserOutline,
	} from 'flowbite-svelte-icons';
	import type { ActionData } from '../../../routes/collections/$types';
	import CollectionCreateDrawer from './CollectionCreateDrawer.svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let collectionCreationDrawerHidden: boolean = $state(true);
</script>

<Sidebar class="mt-5">
	<SidebarWrapper>
		<SidebarGroup>
			<SidebarItem
				label="Add collection"
				on:click={() => (collectionCreationDrawerHidden = false)}
				href="#create-collection"
			>
				{#snippet icon()}
							
						<PlusSolid
							class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					
							{/snippet}
			</SidebarItem>
			<SidebarDropdownWrapper label="Authors">
				{#snippet icon()}
							
						<UserOutline
							class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					
							{/snippet}
				{#snippet arrowup()}
							
						<ChevronDoubleUpOutline class="w-6 h-6" />
					
							{/snippet}
				{#snippet arrowdown()}
							
						<ChevronDoubleDownOutline class="w-6 h-6" />
					
							{/snippet}
				<SidebarDropdownItem label="Products" />
				<SidebarDropdownItem label="Billing" />
				<SidebarDropdownItem label="Invoice" />
			</SidebarDropdownWrapper>
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>

<CollectionCreateDrawer {form} bind:isHidden={collectionCreationDrawerHidden} />
