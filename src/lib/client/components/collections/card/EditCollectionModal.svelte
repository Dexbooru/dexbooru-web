<script lang="ts">
	import { editCollection } from '$lib/client/api/collections';
	import { EDIT_COLLECTION_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getCollectionPage,
		getOriginalCollectionPage,
		getUserCollections,
	} from '$lib/client/helpers/context';
	import {
		MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
		MAXIMUM_COLLECTION_TITLE_LENGTH,
	} from '$lib/shared/constants/collections';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';

	let collection: TPostCollection;
	let title: string = $state('');
	let description: string = $state('');
	let editingCollection: boolean = false;

	const activeModal = getActiveModal();
	const collectionPage = getCollectionPage();
	const originalCollectionPage = getOriginalCollectionPage();
	const userCollections = getUserCollections();

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
			const collectionTitle = document.getElementById('collection-title');
			if (collectionTitle) {
				collectionTitle.innerText = title;
			}
			const collectionDescription = document.getElementById('collection-description');
			if (collectionDescription) {
				collectionDescription.innerText = description;
			}

			userCollections.update(updateCollectionPage);
			collectionPage.update(updateCollectionPage);
			originalCollectionPage.update(updateCollectionPage);
			activeModal.set({ isOpen: false, focusedModalName: null });
		} else {
			toast.push('An unexpected error occured while editing the collection', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	title="Edit this collection"
	open={$activeModal.isOpen && $activeModal.focusedModalName === EDIT_COLLECTION_MODAL_NAME}
	onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
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
	<p class="mt-2 text-right leading-none dark:text-gray-400">
		{title.length}/{MAXIMUM_COLLECTION_TITLE_LENGTH}
	</p>

	<Label class="mb-1" for="collection-description-textarea">
		Please enter a description for your collection <br /> (max {MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
		characters)
	</Label>
	<Textarea
		class="w-full"
		id="collection-description-textarea"
		maxlength={MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
		rows={5}
		bind:value={description}
		name="description"
		placeholder="Enter a description"
		required
	/>
	<p class="mt-2 text-right leading-none dark:text-gray-400">
		{description.length}/{MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
	</p>

	<Button
		disabled={editingCollection || title.length === 0 || description.length === 0}
		onclick={handleOnEditClick}
		class="w-full"
		color="green">Edit collection</Button
	>
</Modal>
