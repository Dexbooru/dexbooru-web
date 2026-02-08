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
		<h1 class="mt-4 mb-6 text-center text-3xl font-bold dark:text-white">
			Search results for "{animeResults.transformedTitle}"
		</h1>
		<div class="grid grid-cols-1 justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each animeResults.data as anime (anime.url)}
				<Card class="flex h-full max-w-sm flex-col">
					<div class="h-64 overflow-hidden rounded-t-lg">
						<Img
							src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url || ''}
							alt={anime.title}
							class="h-full w-full object-cover"
						/>
					</div>
					<div class="flex grow flex-col p-5">
						<h5
							class="mb-2 line-clamp-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white"
						>
							{anime.title}
						</h5>
						<p
							class="mb-3 line-clamp-4 grow text-sm leading-tight font-normal text-gray-700 dark:text-gray-400"
						>
							{anime.synopsis || 'No synopsis available.'}
						</p>
						<div class="mt-auto mb-4 flex flex-wrap gap-1">
							{#each anime.genres.slice(0, 3) as genre (genre.name)}
								<Badge color="primary" class="text-xs">{genre.name}</Badge>
							{/each}
						</div>
						<a
							href={anime.url}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-2 inline-flex items-center font-medium text-blue-600 hover:underline"
						>
							View on MyAnimeList
							<svg
								class="ml-2 h-4 w-4"
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
		<div class="mt-20 text-center">
			<h2 class="text-2xl font-semibold dark:text-white">
				No results found for "{data.title.replaceAll('_', ' ')}"
			</h2>
			<p class="mt-4 dark:text-gray-400">Try a different search term or check your spelling.</p>
			<a href="/" class="mt-6 inline-block text-blue-500 hover:underline">Return Home</a>
		</div>
	{/if}
</div>
