<script lang="ts">
	import { getArtists } from '$lib/client/api/artists';
	import { getTags } from '$lib/client/api/tags';
	import { CHAR_OPTIONS } from '$lib/client/constants/labels';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import type { Artist, Tag } from '@prisma/client';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Spinner } from 'flowbite-svelte';
	import { PalleteSolid, TagSolid } from 'flowbite-svelte-icons';

	export let labelType: 'tag' | 'artist';

	let loadingLabels = false;
	let finishedLabelPagination = false;
	let hasLoadedLabelsOnce = false;
	let labels: string[] = [];
	let pageNumber = 0;
	let selectedLabel = '';

	const getLabelsOnCurrentPage = async (event: Event, pressedLoadingMore: boolean) => {
		const target = event.target as HTMLButtonElement;
		const letter = pressedLoadingMore ? selectedLabel : target.innerText;

		loadingLabels = true;
		if (!pressedLoadingMore) {
			labels = [];
			pageNumber = 0;
			finishedLabelPagination = false;
			selectedLabel = target.innerText;
		}

		const response =
			labelType === 'tag'
				? await getTags(letter, pageNumber)
				: await getArtists(letter, pageNumber);

		if (response.ok) {
			const rawLabels: (Tag & Artist)[] = await response.json();
			const rawLabelNames = rawLabels.map((rawLabel) => rawLabel.name);
			labels = !pressedLoadingMore ? rawLabelNames : [...labels, ...rawLabelNames];
			pageNumber++;
			hasLoadedLabelsOnce = true;
			if (pressedLoadingMore && rawLabelNames.length === 0) {
				finishedLabelPagination = true;
				toast.push(`Finished paginating through the ${labelType}s`, SUCCESS_TOAST_OPTIONS);
			}
		} else {
			toast.push(`There was an error while loading the ${labelType}s`, FAILURE_TOAST_OPTIONS);
		}

		loadingLabels = false;
	};
</script>

<main class="flex flex-col justify-center m-7 space-y-5">
	<p class="text-3xl dark:text-white text-center">
		{labelType === 'tag' ? 'Tags' : 'Artists'} Index
	</p>
	<div class="flex flex-wrap">
		{#each CHAR_OPTIONS as option}
			<Button
				disabled={loadingLabels}
				on:click={(event) => getLabelsOnCurrentPage(event, false)}
				class="m-2 items-center justify-center  text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 focus-within:ring-gray-200 dark:focus-within:ring-gray-700 rounded-lg"
				>{option}</Button
			>
		{/each}
	</div>

	<section class="grid gap-3 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
		{#if hasLoadedLabelsOnce}
			{#if labels.length > 0}
				{#each labels as label}
					<a
						class="text-center inline-flex justify-center space-x-2 border rounded p-2 leading-none dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						href="/posts/{labelType}/{label}"
					>
						<span># {label}</span>
						{#if labelType === 'tag'}
							<TagSolid />
						{:else}
							<PalleteSolid />
						{/if}
					</a>
				{/each}
			{/if}
		{/if}
	</section>

	{#if loadingLabels}
		<Spinner class="ml-auto mr-auto" size="12" />
	{/if}

	{#if labels.length > 0 && !loadingLabels && hasLoadedLabelsOnce && !finishedLabelPagination}
		<Button
			class="w-1/3 ml-auto mr-auto"
			on:click={(event) => getLabelsOnCurrentPage(event, true)}
			color="blue">Load more {labelType}s</Button
		>
	{/if}

	{#if !loadingLabels && hasLoadedLabelsOnce && labels.length === 0}
		<p class="text-6xl dark:text-white text-center">
			No {labelType}s were indexed that start with {selectedLabel}
		</p>
	{/if}
</main>
