<script lang="ts">
	import { page } from '$app/state';
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
	import { onMount } from 'svelte';

	interface Props {
		postsSection: string;
		orderBy: TPostOrderByColumn;
		pageNumber: number;
		ascending: boolean;
		posts: TPost[];
	}

	let { postsSection, pageNumber, posts, ascending, orderBy }: Props = $props();
	let pageTitle = $state('');
	let pageDescription = $state('');

	const postPaginationData = getPostPaginationData();
	const postsPage = getPostsPage();
	const originalPostsPage = getOriginalPostsPage();
	const nsfwPostsPage = getNsfwPostPage();
	const blacklistedPostsPage = getBlacklistedPostPage();

	$effect(() => {
		const data = generatePostWrapperMetaTags(postsSection, pageNumber, ascending, orderBy, posts);
		pageTitle = data.title;
		pageDescription = data.description;
	});

	onMount(() => {
		return () => {
			postPaginationData.set(null);
			postsPage.set([]);
			originalPostsPage.set([]);
			nsfwPostsPage.set([]);
			blacklistedPostsPage.set([]);
		};
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={`${page.url.href}/favicon.png`} />
</svelte:head>

{#if $postPaginationData}
	<PostContainer postContainerTitle={pageTitle} />
{/if}
