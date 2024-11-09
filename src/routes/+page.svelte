<script lang="ts">
	import HomeChibiWallpaper from '$lib/client/assets/home_chibi_wallpaper.webp';
	import { clearToken, storeToken } from '$lib/client/helpers/auth';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let { collectionCount, userCount, tagCount, artistCount, postCount } = data;

	onMount(() => {
		clearToken();
		storeToken();
	});
</script>

<svelte:head>
	<title>Dexbooru - Anime/Manga Imageboard</title>
</svelte:head>

<main class="flex flex-col items-center justify-center text-center mt-20">
	<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dexbooru</h1>
	<img
		class="block"
		width={600}
		height={600}
		src={HomeChibiWallpaper}
		alt="chibi wallpaper on home"
	/>
	<p class="text-lg md:text-xl text-gray-700 dark:text-gray-300 mt-6">
		Welcome to Dexbooru, an imageboard where you can share and discover anime/manga images.
		<br /> Serving <span>{formatNumberWithCommas(postCount)} posts</span>,
		<span>{formatNumberWithCommas(tagCount)} tags</span>,
		<span>{formatNumberWithCommas(artistCount)} artists</span>,
		<span>{formatNumberWithCommas(collectionCount)} collections</span>, and
		<span>{formatNumberWithCommas(userCount)} users</span>.
	</p>
</main>
