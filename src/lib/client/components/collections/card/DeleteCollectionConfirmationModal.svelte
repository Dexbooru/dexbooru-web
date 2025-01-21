<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { deleteCollection } from '$lib/client/api/collections';
	import { INDIVIDUAL_COLLECTION_PATH_REGEX } from '$lib/client/constants/collections';
	import { DELETE_COLLECTION_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getCollectionPage,
		getCollectionPaginationData,
		getOriginalCollectionPage,
		getUserCollections,
	} from '$lib/client/helpers/context';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { toast } from '@zerodevx/svelte-toast';
	import ExclamationCircleOutline from 'flowbite-svelte-icons/ExclamationCircleOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';

	let targetDeletionCollection: TPostCollection | null = $state(null);
	let collectionId: string;
	let collectionDeletionLoading = $state(false);

	const userCollections = getUserCollections();
	const collectionsPage = getCollectionPage();
	const originalCollectionsPage = getOriginalCollectionPage();
	const collectionPagination = getCollectionPaginationData();
	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === DELETE_COLLECTION_MODAL_NAME) {
			const { collection: focusedDeletionCollection } = data.modalData as {
				collection: TPostCollection;
			};
			targetDeletionCollection = focusedDeletionCollection;
			collectionId = targetDeletionCollection.id;
		}
	});

	const updateCollections = (previousCollections: TPostCollection[]) =>
		previousCollections.filter((collection) => collection.id !== collectionId);

	const handleDeleteCollection = async () => {
		collectionDeletionLoading = true;
		const response = await deleteCollection(collectionId);
		collectionDeletionLoading = false;

		if (response.ok) {
			toast.push('The collection was deleted successfully!', SUCCESS_TOAST_OPTIONS);
			activeModal.set({
				isOpen: false,
				focusedModalName: null,
			});

			const pagePath = page.url.pathname;
			if (INDIVIDUAL_COLLECTION_PATH_REGEX.test(pagePath)) {
				goto('/collections');
				return;
			}
			collectionsPage.update(updateCollections);
			originalCollectionsPage.update(updateCollections);
			userCollections.update(updateCollections);
			collectionPagination.update((paginationData) => {
				if (!paginationData) return null;

				return {
					...paginationData,
					posts: paginationData.collections.filter((collection) => collection.id !== collectionId),
				};
			});
		} else {
			toast.push('There was an error while deleting the post!', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	open={$activeModal.isOpen &&
		$activeModal.focusedModalName === DELETE_COLLECTION_MODAL_NAME &&
		targetDeletionCollection !== null}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this collection?
		</h3>
		<Button
			disabled={collectionDeletionLoading}
			on:click={handleDeleteCollection}
			color="red"
			class="me-2">Yes, I'm sure</Button
		>
		<Button
			on:click={() => activeModal.set({ isOpen: false, focusedModalName: null })}
			color="alternative">No, cancel</Button
		>
	</div>
</Modal>
