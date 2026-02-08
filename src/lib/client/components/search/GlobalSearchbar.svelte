<script lang="ts">
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Kbd from 'flowbite-svelte/Kbd.svelte';

	const activeModal = getActiveModal();
</script>

<div class="relative mt-1 hidden w-[250px] md:block" id="global-searchbar">
	<div class="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
		<SearchOutline class="h-4 w-4 text-gray-500 dark:text-gray-400" />
	</div>
	<div class="pointer-events-none absolute inset-y-2 end-11 flex items-center space-x-2 ps-10">
		<Kbd class="p-1">CTRL</Kbd>
		<Kbd class="p-1">K</Kbd>
	</div>
	<Button
		onclick={() => activeModal.set({ isOpen: true, focusedModalName: GLOBAL_SEARCH_MODAL_NAME })}
		color="alternative"
		class="border-none p-0 opacity-50 hover:opacity-75"
	>
		<Input
			readonly
			class="border-none ps-10 caret-transparent outline-none hover:cursor-pointer focus:ring-0 focus:ring-offset-0"
			placeholder="Search"
		/>
	</Button>
</div>
