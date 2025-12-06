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

	let userCollectionsLoading: boolean = $state(false);
	let userCollectionsSaving: boolean = $state(false);
	let originalSelectedSelections = $state<SvelteMap<string, 'add' | 'delete'>>(new SvelteMap());
	let selectedCollections = $state<SvelteMap<string, 'add' | 'delete'>>(new SvelteMap());
	let currentPostId: string = $state('');
	let currentPost: TPost = $state(EMPTY_POST);

	const userCollections = getUserCollections();
	const activeModal = getActiveModal();
	const originalPostPage = getOriginalPostsPage();
	const userCollectionPaginator = createGetCollectionsByAuthorPaginator();

	const updateCollectionSelections = (updateSelectedCollections: boolean = false) => {
		$userCollections.forEach((collection) => {
			const action = collection.posts.some((post) => post.id === currentPostId) ? 'add' : 'delete';
			originalSelectedSelections.set(collection.id, action);
			if (updateSelectedCollections) {
				selectedCollections.set(collection.id, action);
			}
		});
	};

	const resetSelectedCollections = () => {
		for (const [collectionId, action] of originalSelectedSelections.entries()) {
			selectedCollections.set(collectionId, action);
		}
	};

	const handleCollectionCheck = (collectionId: string) => {
		if (!selectedCollections.has(collectionId)) return;

		if (selectedCollections.get(collectionId) === 'add') {
			selectedCollections.set(collectionId, 'delete');
		} else {
			selectedCollections.set(collectionId, 'add');
		}
	};

	const handleLoadMoreCollections = async () => {
		userCollectionsLoading = true;

		const newCollections = await userCollectionPaginator();
		userCollections.update((userCollections) => userCollections.concat(newCollections));
		updateCollectionSelections();

		userCollectionsLoading = false;
	};

	const handleSave = async () => {
		userCollectionsSaving = true;

		const updatedCollectionMap = new Map<string, 'add' | 'delete'>();
		for (const [collectionId, selectedAction] of selectedCollections.entries()) {
			const originalAction = originalSelectedSelections.get(collectionId);
			if (selectedAction !== originalAction) {
				updatedCollectionMap.set(collectionId, selectedAction);
			}
		}

		const response = await updatePostCollections(currentPostId, updatedCollectionMap);
		if (response.ok) {
			for (const [collectionId, action] of updatedCollectionMap.entries()) {
				const matchingCollection = $userCollections.find(
					(collection) => collection.id === collectionId,
				);
				if (matchingCollection) {
					if (action === 'add') {
						matchingCollection.posts.push(currentPost);
					} else {
						matchingCollection.posts = matchingCollection.posts.filter(
							(post) => post.id !== currentPostId,
						);

						const url = page.url;
						if (INDIVIDUAL_COLLECTION_PATH_REGEX.test(url.pathname)) {
							originalPostPage.update((posts) => posts.filter((post) => post.id !== currentPostId));
						}
					}
				}
			}

			updateCollectionSelections();
			toast.push('Successfully updated your collections for this post', SUCCESS_TOAST_OPTIONS);
			activeModal.set({ isOpen: false, focusedModalName: null });
		} else {
			toast.push('Failed to update your collections for this post', FAILURE_TOAST_OPTIONS);
		}

		userCollectionsSaving = false;
	};

	const handleModalClose = () => {
		activeModal.set({ isOpen: false, focusedModalName: null });
		selectedCollections.clear();
		originalSelectedSelections.clear();
	};

	const activeModalUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === COLLECTIONS_MODAL_NAME) {
			const { post } = data.modalData as { post: TPost };
			currentPostId = post.id;
			currentPost = post;
			updateCollectionSelections(true);
		}
	});

	onMount(() => {
		userCollectionPaginator().then((collections) => {
			userCollections.set(collections);
		});

		return () => {
			activeModalUnsubscribe();
		};
	});
</script>

<Modal
	open={$activeModal.isOpen && $activeModal.focusedModalName === COLLECTIONS_MODAL_NAME}
	onclose={handleModalClose}
	size="lg"
	outsideclose
	title="Add/remove this post from your collections"
>
	<div class="flex flex-wrap -mx-2">
		{#if $userCollections.length === 0}
			<p class="m-2">
				<span>You haven't created any collections yet!</span>
				<br />
				<span>Make one using the button at the top of the collections page</span>
			</p>
		{:else}
			<div class="block space-y-5">
				<Button onclick={resetSelectedCollections} color="red">
					<UndoOutline class="mr-2" />
					Reset Selections
				</Button>
				<br />
				<span class="block"
					>Note: Each collection can contain a maximum of {MAXIMUM_POSTS_PER_COLLECTION} post(s)</span
				>
				<section class="flex flex-wrap gap-4">
					{#each $userCollections as collection (collection.id)}
						<div
							class="border border-gray-200 rounded-lg p-4 dark:border-gray-700 h-full flex flex-col"
						>
							<div class="flex space-x-3 mb-2">
								<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
									{collection.title.length <= COLLECTION_TITLE_UPDATE_MODAL_MAXIMUM_LENGTH
										? collection.title
										: collection.title.slice(0, COLLECTION_TITLE_UPDATE_MODAL_MAXIMUM_LENGTH) +
											'...'}
								</h4>
								<Checkbox
									class={collection.posts.length === MAXIMUM_POSTS_PER_COLLECTION
										? 'cursor-not-allowed'
										: 'cursor-pointer'}
									disabled={collection.posts.length === MAXIMUM_POSTS_PER_COLLECTION}
									checked={selectedCollections.get(collection.id) === 'add'}
									onchange={() => handleCollectionCheck(collection.id)}
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
	{#if $userCollections.length % MAXIMUM_COLLECTIONS_PER_PAGE === 0 && $userCollections.length > 0}
		<Button color="blue" disabled={userCollectionsLoading} onclick={handleLoadMoreCollections}
			>Load more collections</Button
		>
	{/if}

	{#snippet footer()}
		<Button color="alternative" onclick={handleModalClose}>Cancel</Button>
		<Button
			disabled={$userCollections.length === 0 || userCollectionsSaving || userCollectionsLoading}
			color="primary"
			onclick={handleSave}>Save</Button
		>
	{/snippet}
</Modal>
