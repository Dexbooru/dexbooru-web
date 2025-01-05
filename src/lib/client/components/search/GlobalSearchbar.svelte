<script lang="ts">
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { Button, Input, Kbd } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	const activeModal = getActiveModal();
</script>

<div class="hidden relative md:block mt-1" id="global-searchbar">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4" />
	</div>
	<div class="flex space-x-2 absolute inset-y-2 end-11 items-center ps-10 pointer-events-none">
		<Kbd class="p-1">CTRL</Kbd>
		<Kbd class="p-1">K</Kbd>
	</div>
	<Button
		on:click={() => activeModal.set({ isOpen: true, focusedModalName: GLOBAL_SEARCH_MODAL_NAME })}
		color="alternative"
		class="p-0 border-none opacity-50 hover:opacity-100"
	>
		<Input
			readonly
			class="ps-10 hover:cursor-pointer border-none outline-none caret-transparent focus:ring-0 focus:ring-offset-0"
			placeholder="Search"
		/>
	</Button>
</div>

<style>
	#global-searchbar {
		width: 250px;
	}
</style>
