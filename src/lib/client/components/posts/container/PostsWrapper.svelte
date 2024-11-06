<script lang="ts">
	import { page } from '$app/stores';
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import {
		getBlacklistedPostPage,
		getNsfwPostPage,
		getOriginalPostsPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import { generatePostWrapperMetaTags } from '$lib/client/helpers/posts';
	import type { TPost, TPostOrderByColumn } from '$lib/shared/types/posts';
	import { onDestroy } from 'svelte';

	interface Props {
		postsSection: string;
		orderBy: TPostOrderByColumn;
		pageNumber: number;
		ascending: boolean;
		posts: TPost[];
	}

	let { postsSection, pageNumber, posts, ascending, orderBy }: Props = $props();

	const postPaginationData = getPostPaginationData();
	const postsPage = getPostsPage();
	const originalPostsPage = getOriginalPostsPage();
	const nsfwPostsPage = getNsfwPostPage();
	const blacklistedPostsPage = getBlacklistedPostPage();
	const { title: pageTitle, description: pageDescription } = generatePostWrapperMetaTags(
		postsSection,
		pageNumber,
		ascending,
		orderBy,
		posts,
	);

	onDestroy(() => {
		postPaginationData.set(null);
		postsPage.set([]);
		originalPostsPage.set([]);
		nsfwPostsPage.set([]);
		blacklistedPostsPage.set([]);
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={`${$page.url.href}/favicon.png`} />
</svelte:head>

{#if $postPaginationData}
	<PostContainer postContainerTitle={pageTitle} />
{/if}
