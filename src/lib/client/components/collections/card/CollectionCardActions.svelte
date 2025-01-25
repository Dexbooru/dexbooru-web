<script lang="ts">
	import {
		DELETE_COLLECTION_MODAL_NAME,
		EDIT_COLLECTION_MODAL_NAME,
	} from '$lib/client/constants/layout';
	import { getActiveModal, getAuthenticatedUser } from '$lib/client/helpers/context';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import ArrowRightToBracketSolid from 'flowbite-svelte-icons/ArrowRightToBracketSolid.svelte';
	import PenSolid from 'flowbite-svelte-icons/PenSolid.svelte';
	import TrashBinSolid from 'flowbite-svelte-icons/TrashBinSolid.svelte';
	import Button from 'flowbite-svelte/Button.svelte';

	type Props = {
		collection: TPostCollection;
		onCollectionViewPage?: boolean;
	};

	let { collection, onCollectionViewPage = false }: Props = $props();

	const authenticatedUser = getAuthenticatedUser();
	const activeModal = getActiveModal();

	const handleModalOpen = (modalName: string, data: { collection: TPostCollection }) => {
		activeModal.set({ isOpen: true, focusedModalName: modalName, modalData: data });
	};
</script>

<div class="flex {onCollectionViewPage ? 'flex-row space-x-3' : 'flex-col space-y-3'} mt-4">
	{#if !onCollectionViewPage}
		<Button class="space-x-2" href="/collections/{collection.id}" color="blue">
			<span>View collection</span>
			<ArrowRightToBracketSolid />
		</Button>
	{/if}

	{#if $authenticatedUser && $authenticatedUser.id === collection.authorId}
		<Button
			color="green"
			class="space-x-2"
			on:click={() => handleModalOpen(EDIT_COLLECTION_MODAL_NAME, { collection })}
		>
			<span>Edit collection</span>
			<PenSolid />
		</Button>
		<Button
			class="space-x-2"
			on:click={() => handleModalOpen(DELETE_COLLECTION_MODAL_NAME, { collection })}
			color="red"
		>
			<span>Delete collection</span>
			<TrashBinSolid />
		</Button>
	{/if}
</div>
