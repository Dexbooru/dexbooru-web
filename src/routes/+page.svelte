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

<main class="flex flex-col items-center justify-center text-center mt-40">
	<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
		Dexbooru - Anime/Manga Imageboard
	</h1>
	<form action="/search" method="GET" class="w-full flex justify-center">
		<Searchbar
			width="50%"
			required
			name="query"
			autofocus
			inputElementId="advanced-searchbar"
			placeholder="example: tag1 -tag2 artist1 -artist2 uploader:bobby views:>1000 likes:<100"
		/>
	</form>
	<p class="text-md text-gray-700 dark:text-gray-300 mt-6">
		Serving <span>{formatNumberWithCommas(postCount)} posts</span>,
		<span>{formatNumberWithCommas(tagCount)} tags</span>,
		<span>{formatNumberWithCommas(artistCount)} artists</span>,
		<span>{formatNumberWithCommas(collectionCount)} collections</span>, and
		<span>{formatNumberWithCommas(userCount)} users</span>.
	</p>
</main>
