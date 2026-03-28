<script lang="ts">
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
</script>

{#if results.length > 0}
	<Alert color="green" class="mt-8">
		<span class="font-medium"
			>Found {results.length} similar image{results.length === 1 ? '' : 's'}</span
		>
		— ordered by similarity score (higher is closer). Results may include imperfect matches.
	</Alert>
{/if}

{#if showNoResults}
	<Alert color="red" class="mt-8">No similar images were found in Dexbooru’s index.</Alert>
{/if}

<section
	class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
	aria-busy={loading}
>
	{#if loading}
		{#each Array(skeletonCount) as _, i (i)}
			<ImagePlaceholder />
		{/each}
	{:else}
		{#each results as item (item.post_id)}
			<SimilaritySearchResultCard result={item} />
		{/each}
	{/if}
</section>
