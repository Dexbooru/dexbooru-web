<script lang="ts">
	import {
		getPredictedClassProbability,
		isQuestionableTagRating,
		sortRatingProbabilities,
		tagRatingClassDisplayLabel,
	} from '$lib/shared/helpers/tagRating';
	import type { TagRatingPredictionResponse } from '$lib/shared/types/tagRating';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type Props = {
		loading: boolean;
		prediction: TagRatingPredictionResponse | null;
		hasTags: boolean;
		nsfwLockedByExplicit: boolean;
	};

	let { loading, prediction, hasTags, nsfwLockedByExplicit }: Props = $props();

	const predictedProbability = $derived(
		prediction ? getPredictedClassProbability(prediction) : null,
	);

	const sortedProbabilities = $derived(
		prediction ? sortRatingProbabilities(prediction.class_probabilities_percent) : [],
	);

	const showQuestionableSuggestion = $derived(
		prediction ? isQuestionableTagRating(prediction.predicted_class) : false,
	);
</script>

<div class="!mt-5 space-y-2">
	<div class="flex flex-wrap items-center gap-2">
		<span class="font-semibold text-gray-800 dark:text-gray-300">Tag rating (ML):</span>
		{#if !hasTags}
			<span class="text-sm text-gray-500 dark:text-gray-400">Add tags to request a prediction.</span
			>
		{:else if loading}
			<Spinner />
		{:else if prediction}
			<span class="text-sm text-gray-900 dark:text-gray-100">
				{tagRatingClassDisplayLabel(prediction.predicted_class)}
				{#if predictedProbability !== null}
					<span class="text-gray-600 dark:text-gray-400">
						— {predictedProbability.toFixed(2)}% estimated probability</span
					>
				{/if}
			</span>
		{:else}
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Prediction unavailable (check ML API).</span
			>
		{/if}
	</div>

	{#if prediction && sortedProbabilities.length > 0}
		<div
			class="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
		>
			<p class="mb-1 font-medium">All class probabilities (%)</p>
			<ul class="space-y-0.5">
				{#each sortedProbabilities as row (row.className)}
					<li class="flex justify-between gap-4">
						<span>{tagRatingClassDisplayLabel(row.className)}</span>
						<span class="tabular-nums">{row.percent.toFixed(2)}%</span>
					</li>
				{/each}
			</ul>
			{#if prediction.transformed_input}
				<p class="mt-2 text-gray-500 dark:text-gray-500">
					Normalized input: <span class="font-mono">{prediction.transformed_input}</span>
				</p>
			{/if}
		</div>
	{/if}

	{#if nsfwLockedByExplicit}
		<div
			class="rounded-md bg-red-100 p-3 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-100"
		>
			<strong>NSFW required:</strong> The model predicts explicit content for these tags. “Mark post as
			NSFW” is enabled and cannot be turned off while this prediction stands.
		</div>
	{/if}

	{#if showQuestionableSuggestion && !nsfwLockedByExplicit}
		<div
			class="rounded-md bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/25 dark:text-amber-100"
		>
			<strong>Suggestion:</strong> Tags look <strong>questionable</strong>. Consider marking the
			post as NSFW if that matches the content; the choice is yours.
		</div>
	{/if}
</div>
