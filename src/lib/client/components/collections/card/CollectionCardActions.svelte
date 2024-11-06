<script lang="ts">
	import {
		DELETE_COLLECTION_MODAL_NAME,
		EDIT_COLLECTION_MODAL_NAME,
	} from '$lib/client/constants/layout';
	import { getActiveModal, getAuthenticatedUser } from '$lib/client/helpers/context';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { Button } from 'flowbite-svelte';
	import { ArrowRightToBracketSolid, PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	type Props = {
		collection: TPostCollection;
	};
	let { collection }: Props = $props();

	const authenticatedUser = getAuthenticatedUser();
	const activeModal = getActiveModal();

	const handleModalOpen = (modalName: string, data: { collection: TPostCollection }) => {
		activeModal.set({ isOpen: true, focusedModalName: modalName, modalData: data });
	};
</script>

<div class="flex flex-col space-y-3 mt-4">
	<Button class="space-x-2" href="/collections/{collection.id}" color="blue">
		<span>View collection</span>
		<ArrowRightToBracketSolid />
	</Button>

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
