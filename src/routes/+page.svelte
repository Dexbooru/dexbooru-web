<script lang="ts">
	import Searchbar from '$lib/client/components/reusable/Searchbar.svelte';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let { collectionCount, userCount, tagCount, artistCount, postCount } = data;
</script>

<svelte:head>
	<title>Dexbooru - Anime/Manga Imageboard</title>
</svelte:head>

<main class="flex flex-col items-center justify-center text-center mt-2">
	<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dexbooru</h1>
	<Searchbar width="50%" inputElementId="advanced-searchbar" placeholder="Make a query" />
	<p class="text-md text-gray-700 dark:text-gray-300 mt-6">
		Serving <span>{formatNumberWithCommas(postCount)} posts</span>,
		<span>{formatNumberWithCommas(tagCount)} tags</span>,
		<span>{formatNumberWithCommas(artistCount)} artists</span>,
		<span>{formatNumberWithCommas(collectionCount)} collections</span>, and
		<span>{formatNumberWithCommas(userCount)} users</span>.
	</p>
</main>
