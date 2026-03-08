<script lang="ts">
	import { page } from '$app/state';
	import {
		createGetCollectionsByAuthorPaginator,
		updatePostCollections,
	} from '$lib/client/api/collections';
	import { INDIVIDUAL_COLLECTION_PATH_REGEX } from '$lib/client/constants/collections';
	import { COLLECTIONS_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getOriginalPostsPage,
		getUserCollections,
	} from '$lib/client/helpers/context';
	import {
		COLLECTION_TITLE_UPDATE_MODAL_MAXIMUM_LENGTH,
		MAXIMUM_COLLECTIONS_PER_PAGE,
		MAXIMUM_POSTS_PER_COLLECTION,
	} from '$lib/shared/constants/collections';
	import { EMPTY_POST } from '$lib/shared/constants/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import UndoOutline from 'flowbite-svelte-icons/UndoOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let userCollectionsLoading = $state(false);
	let userCollectionsSaving = $state(false);
	let originalSelectedSelections = new SvelteMap<string, 'add' | 'delete'>();
	let selectedCollections = new SvelteMap<string, 'add' | 'delete'>();
	let currentPostId = $state('');
	let currentPost: TPost = $state(EMPTY_POST);

	const userCollectionsStore = getUserCollections();
	const activeModal = getActiveModal();
	const originalPostPage = getOriginalPostsPage();
	const userCollectionPaginator = createGetCollectionsByAuthorPaginator();

	const collectionsList = $derived($userCollectionsStore);
	const isModalOpen = $derived(
		$activeModal.isOpen && $activeModal.focusedModalName === COLLECTIONS_MODAL_NAME,
	);

	$effect(() => {
		if (isModalOpen && $activeModal.modalData) {
			const { post } = $activeModal.modalData as { post: TPost };
			currentPostId = post.id;
			currentPost = post;
		}
	});

	$effect(() => {
		const validIds = new Set(collectionsList.map((c) => c.id));

		collectionsList.forEach((collection) => {
			const isPostInCollection = collection.posts.some((p) => p.id === currentPostId);
			const action = isPostInCollection ? 'add' : 'delete';

			originalSelectedSelections.set(collection.id, action);
			if (!selectedCollections.has(collection.id)) {
				selectedCollections.set(collection.id, action);
			}
		});

		for (const id of selectedCollections.keys()) {
			if (!validIds.has(id)) {
				selectedCollections.delete(id);
				originalSelectedSelections.delete(id);
			}
		}
	});

	const resetSelectedCollections = () => {
		for (const [id, action] of originalSelectedSelections.entries()) {
			selectedCollections.set(id, action);
		}
	};

	const handleCollectionCheck = (collectionId: string) => {
		const current = selectedCollections.get(collectionId);
		selectedCollections.set(collectionId, current === 'add' ? 'delete' : 'add');
	};

	const handleLoadMoreCollections = async () => {
		userCollectionsLoading = true;
		const newCollections = await userCollectionPaginator();
		userCollectionsStore.update((curr) => curr.concat(newCollections));
		userCollectionsLoading = false;
	};

	const handleSave = async () => {
		userCollectionsSaving = true;
		const updatedCollectionMap = new SvelteMap<string, 'add' | 'delete'>();

		for (const [id, action] of selectedCollections.entries()) {
			if (action !== originalSelectedSelections.get(id)) {
				updatedCollectionMap.set(id, action);
			}
		}

		const response = await updatePostCollections(currentPostId, updatedCollectionMap);
		if (response.ok) {
			for (const [id, action] of updatedCollectionMap.entries()) {
				const match = collectionsList.find((c) => c.id === id);
				if (match) {
					if (action === 'add') {
						match.posts.push(currentPost);
					} else {
						match.posts = match.posts.filter((p) => p.id !== currentPostId);
						if (INDIVIDUAL_COLLECTION_PATH_REGEX.test(page.url.pathname)) {
							originalPostPage.update((posts) => posts.filter((p) => p.id !== currentPostId));
						}
					}
				}
			}
			toast.push('Successfully updated your collections', SUCCESS_TOAST_OPTIONS);
			handleModalClose();
		} else {
			toast.push('Failed to update collections', FAILURE_TOAST_OPTIONS);
		}
		userCollectionsSaving = false;
	};

	const handleModalClose = () => {
		activeModal.set({ isOpen: false, focusedModalName: null });
		selectedCollections.clear();
		originalSelectedSelections.clear();
	};

	onMount(() => {
		userCollectionPaginator().then((collections) => {
			userCollectionsStore.set(collections);
		});
	});
</script>

<Modal
	open={isModalOpen}
	onclose={handleModalClose}
	size="lg"
	outsideclose
	title="Add/remove this post from your collections"
>
	<div class="-mx-2 flex flex-wrap">
		{#if collectionsList.length === 0}
			<p class="m-2">
				<span>You haven't created any collections yet!</span>
			</p>
		{:else}
			<div class="block space-y-5">
				<Button onclick={resetSelectedCollections} color="red">
					<UndoOutline class="mr-2" />
					Reset Selections
				</Button>
				<span class="block text-sm text-gray-500">
					Note: Max {MAXIMUM_POSTS_PER_COLLECTION} posts per collection
				</span>
				<section class="flex flex-wrap gap-4">
					{#each collectionsList as collection (collection.id)}
						<div class="flex flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-700">
							<div class="mb-2 flex space-x-3">
								<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
									{collection.title.length <= COLLECTION_TITLE_UPDATE_MODAL_MAXIMUM_LENGTH
										? collection.title
										: collection.title.slice(0, COLLECTION_TITLE_UPDATE_MODAL_MAXIMUM_LENGTH) +
											'...'}
								</h4>
								<Checkbox
									disabled={collection.posts.length === MAXIMUM_POSTS_PER_COLLECTION &&
										selectedCollections.get(collection.id) !== 'add'}
									checked={selectedCollections.get(collection.id) === 'add'}
									onchange={() => handleCollectionCheck(collection.id)}
								/>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								{collection.posts.length} posts
							</p>
						</div>
					{/each}
				</section>
			</div>
		{/if}
	</div>

	{#if collectionsList.length % MAXIMUM_COLLECTIONS_PER_PAGE === 0 && collectionsList.length > 0}
		<Button color="blue" disabled={userCollectionsLoading} onclick={handleLoadMoreCollections}
			>Load more</Button
		>
	{/if}

	{#snippet footer()}
		<Button color="alternative" onclick={handleModalClose}>Cancel</Button>
		<Button
			disabled={collectionsList.length === 0 || userCollectionsSaving || userCollectionsLoading}
			color="primary"
			onclick={handleSave}>Save</Button
		>
	{/snippet}
</Modal>
