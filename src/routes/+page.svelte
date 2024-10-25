<script lang="ts">
	import HomeChibiWallpaper from '$lib/client/assets/home_chibi_wallpaper.webp';
	import { clearToken, storeToken } from '$lib/client/helpers/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		clearToken();
		storeToken();
	});
</script>

<main class="flex flex-col items-center justify-center text-center">
	<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dexbooru</h1>
	<img
		class="block"
		width={500}
		height={500}
		src={HomeChibiWallpaper}
		alt="chibi wallpaper on home"
	/>
	<a
		href="/posts"
		class="mt-6 text-lg text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
	>
		Go to Posts
	</a>
</main>
