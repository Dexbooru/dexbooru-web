<script lang="ts">
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { postPaginationStore } from '$lib/client/stores/posts';
	import { onDestroy } from 'svelte';

	export let postsSection: string;

	let currentPageTitle: string;

	const postPaginationUnsubscribe = postPaginationStore.subscribe((paginationData) => {
		if (paginationData) {
			currentPageTitle = `${postsSection} - Page ${paginationData.pageNumber + 1}`;
		}
	});

	onDestroy(() => {
		postPaginationUnsubscribe();
	});
</script>

<svelte:head>
	<title>{currentPageTitle}</title>
</svelte:head>

<PostContainer postContainerTitle={currentPageTitle} />
