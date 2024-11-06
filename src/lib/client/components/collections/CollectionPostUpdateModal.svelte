<script lang="ts">
	import {
		createGetCollectionsByAuthorPaginator,
		updatePostCollections,
	} from '$lib/client/api/collections';
	import { COLLECTIONS_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import {
		COLLECTION_TITLE_UPDATE_MODAL_MAX_LENGTH,
		MAXIMUM_COLLECTIONS_PER_PAGE,
		MAXIMUM_POSTS_PER_COLLECTION,
	} from '$lib/shared/constants/collections';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Checkbox, Modal } from 'flowbite-svelte';
	import { UndoOutline } from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';

	let userCollections: TPostCollection[] = $state([]);
	let userCollectionsLoading: boolean = $state(false);
	let userCollectionsSaving: boolean = $state(false);
	let originalSelectedSelections = $state<Map<string, 'add' | 'delete'>>(new Map());
	let selectedCollections = $state<Map<string, 'add' | 'delete'>>(new Map());
	let currentPostId: string = $state('');

	const activeModal = getActiveModal();
	const userCollectionPaginator = createGetCollectionsByAuthorPaginator();

	const buildOriginalSelectedSelectionsMap = () => {
		const collectionMap = new Map<string, 'add' | 'delete'>();

		userCollections.forEach((collection) => {
			if (collection.posts.some((post) => post.id === currentPostId)) {
				collectionMap.set(collection.id, 'delete');
			} else {
				collectionMap.set(collection.id, 'add');
			}
		});

		return collectionMap;
	};

	const handleCollectionCheck = (collectionId: string) => {
		if (!selectedCollections.has(collectionId)) return;

		if (selectedCollections.get(collectionId) === 'add') {
			selectedCollections.set(collectionId, 'delete');
		} else {
			selectedCollections.set(collectionId, 'add');
		}

		selectedCollections = selectedCollections;
	};

	const handleLoadMoreCollections = async () => {
		userCollectionsLoading = true;

		const newCollections = await userCollectionPaginator();
		newCollections.forEach((collection) => userCollections.push(collection));
		originalSelectedSelections = buildOriginalSelectedSelectionsMap();

		userCollectionsLoading = false;
	};

	const handleSave = async () => {
		userCollectionsSaving = true;

		const response = await updatePostCollections(
			currentPostId,
			originalSelectedSelections,
			selectedCollections,
		);
		if (response.ok) {
			toast.push('Successfully updated your collections for this post', SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push('Failed to update your collections for this post', FAILURE_TOAST_OPTIONS);
		}

		userCollectionsSaving = false;
	};

	const handleModalClose = () => {
		activeModal.set({ isOpen: false, focusedModalName: null });
		selectedCollections = new Map<string, 'add' | 'delete'>();
	};

	const activeModalUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === COLLECTIONS_MODAL_NAME) {
			const { postId } = data.modalData as { postId: string };
			currentPostId = postId;
			originalSelectedSelections = buildOriginalSelectedSelectionsMap();
			selectedCollections = originalSelectedSelections;
		}
	});

	onMount(() => {
		userCollectionPaginator().then((collections) => {
			userCollections = collections;
		});
	});

	onDestroy(() => {
		activeModalUnsubscribe();
	});
</script>

<Modal
	open={$activeModal.isOpen && $activeModal.focusedModalName === COLLECTIONS_MODAL_NAME}
	on:close={handleModalClose}
	size="lg"
	outsideclose
	title="Add/remove this post from your collections"
>
	<div class="flex flex-wrap -mx-2">
		{#if userCollections.length === 0}
			<p class="m-2">
				<span>You haven't created any collections yet!</span>
				<br />
				<span>Make one using the button at the top of this page</span>
			</p>
		{:else}
			<div class="block space-y-5">
				<Button on:click={() => (selectedCollections = originalSelectedSelections)} color="red">
					<UndoOutline class="mr-2" />
					Reset Selections
				</Button>
				<section class="flex flex-wrap gap-4">
					{#each userCollections as collection (collection.id)}
						<div
							class="border border-gray-200 rounded-lg p-4 dark:border-gray-700 h-full flex flex-col"
						>
							<div class="flex space-x-3 mb-2">
								<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
									{collection.title.length <= COLLECTION_TITLE_UPDATE_MODAL_MAX_LENGTH
										? collection.title
										: collection.title.slice(0, COLLECTION_TITLE_UPDATE_MODAL_MAX_LENGTH) + '...'}
								</h4>
								<Checkbox
									class={collection.posts.length === MAXIMUM_POSTS_PER_COLLECTION
										? 'cursor-not-allowed'
										: 'cursor-pointer'}
									disabled={collection.posts.length === MAXIMUM_POSTS_PER_COLLECTION}
									checked={selectedCollections.get(collection.id) === 'delete'}
									on:change={() => handleCollectionCheck(collection.id)}
								/>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400 flex-grow">
								{collection.posts.length} posts
							</p>
						</div>
					{/each}
				</section>
			</div>
		{/if}
	</div>
	{#if userCollections.length % MAXIMUM_COLLECTIONS_PER_PAGE === 0}
		<Button color="blue" disabled={userCollectionsLoading} on:click={handleLoadMoreCollections}
			>Load more collections</Button
		>
	{/if}

	{#snippet footer()}
		<Button color="alternative" on:click={handleModalClose}>Cancel</Button>
		<Button
			disabled={userCollections.length === 0 || userCollectionsSaving || userCollectionsLoading}
			color="primary"
			on:click={handleSave}>Save</Button
		>
	{/snippet}
</Modal>
