<script lang="ts">
	import { sortSimilarityResultsByCreatedAtDesc } from '$lib/shared/helpers/postImageSimilarity';
	import type { PostImageSimilarityResult } from '$lib/shared/types/postImageSimilarity';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import ImagePlaceholder from 'flowbite-svelte/ImagePlaceholder.svelte';
	import SimilaritySearchResultCard from './SimilaritySearchResultCard.svelte';

	type Props = {
		loading: boolean;
		results: PostImageSimilarityResult[];
		showNoResults: boolean;
	};

	let { loading, results, showNoResults }: Props = $props();

	const skeletonCount = 10;
	const sortedResults = $derived(sortSimilarityResultsByCreatedAtDesc(results));
</script>

{#if sortedResults.length > 0}
	<Alert color="green" class="mt-8">
		<span class="font-medium"
			>Found {sortedResults.length} similar image{sortedResults.length === 1 ? '' : 's'}</span
		>
		— ordered by upload date (newest first). Results may include imperfect matches.
	</Alert>
{/if}

{#if showNoResults}
	<Alert color="red" class="mt-8">No similar images were found in Dexbooru’s index.</Alert>
{/if}

<section
	class="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	aria-busy={loading}
>
	{#if loading}
		{#each Array(skeletonCount) as _, i (i)}
			<ImagePlaceholder />
		{/each}
	{:else}
		{#each sortedResults as item (item.post_id)}
			<SimilaritySearchResultCard result={item} />
		{/each}
	{/if}
</section>
