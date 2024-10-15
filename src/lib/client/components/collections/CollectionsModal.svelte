<script lang="ts">
	import { COLLECTIONS_MODAL_NAME } from '$lib/client/constants/layout';
	import { modalStore } from '$lib/client/stores/layout';
	import { Button, Checkbox, Modal } from 'flowbite-svelte';
	import { PlusSolid } from 'flowbite-svelte-icons';

	//export let currentPost: any; // Assume this is passed from the parent component

	let collections = [
		{ id: 1, name: 'Favorites', postCount: 5 },
		{ id: 2, name: 'Read Later', postCount: 10 },
		{ id: 3, name: 'Work Related', postCount: 3 },
		// Add more collections as needed
	];

	let selectedCollections: number[] = [];

	function toggleCollection(collectionId: number) {
		if (selectedCollections.includes(collectionId)) {
			selectedCollections = selectedCollections.filter((id) => id !== collectionId);
		} else {
			selectedCollections = [...selectedCollections, collectionId];
		}
	}

	function handleSave() {
		// Implement save logic here
		console.log('Saving post to collections:', selectedCollections);
	}

	function createNewCollection() {
		// Implement new collection creation logic here
		console.log('Creating new collection');
	}
</script>

<Modal
	open={$modalStore.isOpen && $modalStore.focusedModalName === COLLECTIONS_MODAL_NAME}
	on:close={() => modalStore.set({ isOpen: false, focusedModalName: null })}
	size="xl"
	outsideclose
>
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Add to Collection</h3>
		<Button size="sm" color="alternative" class="p-1" on:click={createNewCollection}>
			<PlusSolid class="w-6 h-6" />
		</Button>
	</div>

	<div class="flex flex-wrap -mx-2">
		{#each collections as collection (collection.id)}
			<div class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
				<div
					class="border border-gray-200 rounded-lg p-4 dark:border-gray-700 h-full flex flex-col"
				>
					<div class="flex items-center justify-between mb-2">
						<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
							{collection.name}
						</h4>
						<Checkbox
							checked={selectedCollections.includes(collection.id)}
							on:change={() => toggleCollection(collection.id)}
						/>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400 flex-grow">
						{collection.postCount} posts
					</p>
				</div>
			</div>
		{/each}
	</div>

	<svelte:fragment slot="footer">
		<Button
			color="alternative"
			on:click={() => modalStore.set({ isOpen: false, focusedModalName: null })}>Cancel</Button
		>
		<Button color="primary" on:click={handleSave}>Save</Button>
	</svelte:fragment>
</Modal>
