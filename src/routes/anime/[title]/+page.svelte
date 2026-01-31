<script lang="ts">
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const animeResults = data.animeData;
</script>

<svelte:head>
	<title>Search results for {data.title.replaceAll('_', ' ')} - Dexbooru</title>
</svelte:head>

<div class="container mx-auto p-4">
	{#if animeResults && animeResults.data && animeResults.data.length > 0}
		<h1 class="mb-6 text-3xl font-bold text-center dark:text-white mt-4">
			Search results for "{animeResults.transformedTitle}"
		</h1>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
			{#each animeResults.data as anime}
				<Card class="max-w-sm h-full flex flex-col">
					<div class="h-64 overflow-hidden rounded-t-lg">
						<Img
							src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url || ''}
							alt={anime.title}
							class="w-full h-full object-cover"
						/>
					</div>
					<div class="p-5 flex flex-col grow">
						<h5
							class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2"
						>
							{anime.title}
						</h5>
						<p
							class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight text-sm grow line-clamp-4"
						>
							{anime.synopsis || 'No synopsis available.'}
						</p>
						<div class="flex flex-wrap gap-1 mb-4 mt-auto">
							{#each anime.genres.slice(0, 3) as genre}
								<Badge color="primary" class="text-xs">{genre.name}</Badge>
							{/each}
						</div>
						<a
							href={anime.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center text-blue-600 hover:underline mt-2 font-medium"
						>
							View on MyAnimeList
							<svg
								class="w-4 h-4 ml-2"
								fill="currentColor"
								viewBox="0 0 20 20"
								xmlns="http://www.w3.org/2000/svg"
								><path
									fill-rule="evenodd"
									d="M10.293 3.293a1  0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/></svg
							>
						</a>
					</div>
				</Card>
			{/each}
		</div>
	{:else}
		<div class="text-center mt-20">
			<h2 class="text-2xl font-semibold dark:text-white">
				No results found for "{data.title.replaceAll('_', ' ')}"
			</h2>
			<p class="mt-4 dark:text-gray-400">Try a different search term or check your spelling.</p>
			<a href="/" class="text-blue-500 hover:underline mt-6 inline-block">Return Home</a>
		</div>
	{/if}
</div>
