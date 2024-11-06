<script lang="ts">
	import HomeChibiWallpaper from '$lib/client/assets/home_chibi_wallpaper.webp';
	import { clearToken, storeToken } from '$lib/client/helpers/auth';
	import { Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';

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
	<div class="flex m-5 space-x-2 justify-normal">
		<Button href="/posts">Check out some posts</Button>
		<Button href="/tags">Check out some tags</Button>
		<Button href="/artists">Check out some artists</Button>
	</div>
</main>
