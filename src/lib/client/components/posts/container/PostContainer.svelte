<script lang="ts">
	import { page } from '$app/state';
	import PostGrid from '$lib/client/components/posts/container/PostGrid.svelte';
	import PostPageSidebar from '$lib/client/components/posts/container/PostPageSidebar.svelte';
	import PostPaginator from '$lib/client/components/posts/container/PostPaginator.svelte';
	import { LABEL_METADATA_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal, getOriginalPostsPage, getPostsPage } from '$lib/client/helpers/context';
	import { getUniqueLabelsFromPosts } from '$lib/shared/helpers/labels';
	import PalleteSolid from 'flowbite-svelte-icons/PalleteSolid.svelte';
	import TagSolid from 'flowbite-svelte-icons/TagSolid.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount } from 'svelte';

	type Props = {
		postContainerTitle: string;
	};

	let { postContainerTitle }: Props = $props();
	let uniqueTags: string[] = $state([]);
	let uniqueArtists: string[] = $state([]);

	const originalPostPage = getOriginalPostsPage();
	const postsPage = getPostsPage();
	const activeModal = getActiveModal();

	const getPageLabelType = (): 'tag' | 'artist' | null => {
		if (page.url.pathname.includes('/posts/tag')) return 'tag';
		if (page.url.pathname.includes('/posts/artist')) return 'artist';
		return null;
	};

	const postPageStoreUnsubscribe = postsPage.subscribe((updatedPosts) => {
		uniqueTags = getUniqueLabelsFromPosts(updatedPosts, 'tag');
		uniqueArtists = getUniqueLabelsFromPosts(updatedPosts, 'artist');
	});

	onMount(() => {
		return () => {
			postPageStoreUnsubscribe();
		};
	});
</script>

<main id="post-container" class="mt-5">
	<div id="post-container-sidebar">
		<PostPageSidebar {uniqueTags} {uniqueArtists} />
	</div>
	<div id="post-container-body" class="space-y-4 mb-5">
		<div id="post-container-title" class="block space-y-3">
			<h1 class="lg:text-4xl md:text-3xl sm:text-3xl text-lg dark:text-white">
				{postContainerTitle}
			</h1>
			<div class="flex flex-col space-y-2">
				{#if ['/posts/tag', '/posts/artist'].some( (path) => page.url.pathname.includes(path), ) && getPageLabelType()}
					<Button
						on:click={() =>
							activeModal.set({
								focusedModalName: LABEL_METADATA_MODAL_NAME,
								modalData: { labelType: getPageLabelType() },
								isOpen: true,
							})}
						color="blue"
						class="w-full sm:w-[20rem] sm:mr-auto sm:ml-auto md:ml-0 md:mr-auto"
					>
						{#if getPageLabelType() === 'tag'}
							<TagSolid class="mr-2" />
						{:else}
							<PalleteSolid class="mr-2" />
						{/if}
						View metadata for this {getPageLabelType()}</Button
					>
				{/if}

				{#if $originalPostPage.length > 0}
					<PostPaginator />
				{/if}
			</div>
		</div>
		<PostGrid />
	</div>
</main>

<style>
	#post-container {
		display: grid;
		grid-template-columns: repeat(4.5, 1fr);
		grid-template-rows: 0fr repeat(4, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}

	#post-container-sidebar {
		grid-area: 1 / 1 / 6 / 2;
		align-self: start;
	}

	#post-container-body {
		grid-area: 2 / 2 / 6 / 25;
	}

	@media screen and (max-width: 767px) {
		#post-container-sidebar {
			display: none;
		}

		#post-container-title {
			text-align: center;
		}

		#post-container {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
		}

		#post-container-body {
			grid-area: unset;
			width: 100%;
			padding: 1rem;
		}
	}
</style>
