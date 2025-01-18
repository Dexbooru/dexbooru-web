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
	import { onMount } from 'svelte';

	type Props = {
		postsSection: string;
	};

	let { postsSection }: Props = $props();

	const postPaginationData = getPostPaginationData();
	const postsPage = getPostsPage();
	const originalPostsPage = getOriginalPostsPage();
	const nsfwPostsPage = getNsfwPostPage();
	const blacklistedPostsPage = getBlacklistedPostPage();

	let titleData = $derived.by(() => {
		return generatePostWrapperMetaTags(
			postsSection,
			page.data.pageNumber ?? 0,
			page.data.ascending ?? false,
			page.data.orderBy ?? 'createdAt',
			page.data.posts ?? [],
		);
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
	<title>{titleData.title}</title>
	<meta property="og:title" content={titleData.title} />
	<meta property="og:description" content={titleData.description} />
	<meta property="og:image" content={`${page.url.href}/favicon.png`} />
</svelte:head>

<PostContainer postContainerTitle={titleData.title} />
