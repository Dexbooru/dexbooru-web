<script lang="ts">
	import { ESTIMATED_TAG_RATING_LABEL_MAP } from '$lib/client/constants/labels';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type TEstimatedPostRating = 's' | 'q' | 'e';

	type Props = {
		estimatedPostRating: Promise<TEstimatedPostRating | null>;
	};

	let { estimatedPostRating }: Props = $props();
</script>

{#await estimatedPostRating}
	<div class="flex items-center space-x-2">
		<Spinner />
	</div>
{:then rating}
	<div class="flex items-center space-x-2 !mt-5">
		<span class="font-semibold text-gray-800 dark:text-gray-300">Estimated Rating:</span>
		{#if rating}
			<span class="text-sm text-gray-900 dark:text-gray-100"
				>{ESTIMATED_TAG_RATING_LABEL_MAP[rating]}</span
			>
		{:else}
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Will show here once tags are added</span
			>
		{/if}
	</div>

	{#if rating === 'q' || rating === 'e'}
		<div class="mt-2 p-3 bg-yellow-100 text-yellow-800 rounded-md">
			<strong>Recommendation:</strong> The provided tags are potentially rated as
			{#if rating === 'q'}
				{ESTIMATED_TAG_RATING_LABEL_MAP['q']}
			{:else}
				{ESTIMATED_TAG_RATING_LABEL_MAP['e']}
			{/if}. It is recommended to mark this post as NSFW.
		</div>
	{/if}
{/await}
