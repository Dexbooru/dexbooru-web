<script lang="ts">
	import { editCollection } from '$lib/client/api/collections';
	import { EDIT_COLLECTION_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getCollectionPage,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';
	import {
		MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
		MAXIMUM_COLLECTION_TITLE_LENGTH,
	} from '$lib/shared/constants/collections';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Input, Label, Modal, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	let collection: TPostCollection;
	let title: string = $state('');
	let description: string = $state('');
	let editingCollection: boolean = false;

	const activeModal = getActiveModal();
	const collectionPage = getCollectionPage();
	const originalCollectionPage = getOriginalCollectionPage();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === EDIT_COLLECTION_MODAL_NAME) {
			const { collection: focusedEditCollection } = data.modalData as {
				collection: TPostCollection;
			};
			collection = focusedEditCollection;
			title = focusedEditCollection.title;
			description = focusedEditCollection.description;
		}
	});

	const updateCollectionPage = (collections: TPostCollection[]) => {
		const updatedCollections = collections.map((currentCollection) => {
			if (currentCollection.id === collection.id) {
				return {
					...currentCollection,
					title,
					description,
				};
			}
			return currentCollection;
		});
		return updatedCollections;
	};

	const handleOnEditClick = async () => {
		if (!collection || !collection.id || title.length === 0 || description.length === 0) return;

		const response = await editCollection(collection.id, { title, description });
		if (response.ok) {
			toast.push('Edited the collection successfully', SUCCESS_TOAST_OPTIONS);

			collection.title = title;
			collection.description = description;
			collectionPage.update(updateCollectionPage);
			originalCollectionPage.update(updateCollectionPage);
			activeModal.set({ isOpen: false, focusedModalName: null });
		} else {
			toast.push('An unexpected error occured while editing the collection', FAILURE_TOAST_OPTIONS);
		}
	};

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	title="Edit this collection"
	open={$activeModal.isOpen && $activeModal.focusedModalName === EDIT_COLLECTION_MODAL_NAME}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<Label class="mb-1" for="collection-title-input">
		Please enter a title for your collection <br /> (max {MAXIMUM_COLLECTION_TITLE_LENGTH}
		characters)
	</Label>
	<Input
		id="collection-title-input"
		maxlength={MAXIMUM_COLLECTION_TITLE_LENGTH}
		placeholder="Enter a title"
		bind:value={title}
	/>
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{title.length}/{MAXIMUM_COLLECTION_TITLE_LENGTH}
	</p>

	<Label class="mb-1" for="collection-description-textarea">
		Please enter a description for your collection <br /> (max {MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
		characters)
	</Label>
	<Textarea
		id="collection-description-textarea"
		maxlength={MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
		rows="5"
		bind:value={description}
		name="description"
		placeholder="Enter a description"
		required
	/>
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{description.length}/{MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
	</p>

	<Button
		disabled={editingCollection || title.length === 0 || description.length === 0}
		on:click={handleOnEditClick}
		class="w-full"
		color="green">Edit collection</Button
	>
</Modal>
