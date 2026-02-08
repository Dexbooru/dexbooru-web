<script lang="ts">
	import type { Artist, Tag } from '$generated/prisma/browser';
	import { getArtists } from '$lib/client/api/artists';
	import { getTags } from '$lib/client/api/tags';
	import { CHAR_OPTIONS_LOWERCASE } from '$lib/client/constants/labels';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { MAXIMUM_LABELS_PER_PAGE } from '$lib/shared/constants/labels';
	import { renderLabel } from '$lib/shared/helpers/labels';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { toast } from '@zerodevx/svelte-toast';
	import PalleteSolid from 'flowbite-svelte-icons/PaletteSolid.svelte';
	import TagSolid from 'flowbite-svelte-icons/TagSolid.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type Props = {
		labelType: 'tag' | 'artist';
	};

	let { labelType }: Props = $props();

	let loadingLabels = $state(false);
	let finishedLabelPagination = $state(false);
	let hasLoadedLabelsOnce = $state(false);
	let labels: string[] = $state([]);
	let labelCounts = new SvelteMap<string, number>();
	let pageNumber = 0;
	let selectedLabel = $state('');

	const getLabelsOnCurrentPage = async (event: Event, pressedLoadingMore: boolean) => {
		const target = event.target as HTMLButtonElement;
		const letter = pressedLoadingMore ? selectedLabel : target.innerText;

		loadingLabels = true;
		if (!pressedLoadingMore) {
			labels = [];
			labelCounts.clear();
			pageNumber = 0;
			finishedLabelPagination = false;
			selectedLabel = target.innerText;
		}

		const response =
			labelType === 'tag'
				? await getTags(letter, pageNumber)
				: await getArtists(letter, pageNumber);

		if (response.ok) {
			const responseData: TApiResponse<(Tag & Artist)[]> = await response.json();
			const rawLabels: (Tag & Artist)[] = responseData.data;

			const rawLabelNames = rawLabels.map((rawLabel) => rawLabel.name);
			labels = !pressedLoadingMore ? rawLabelNames : [...labels, ...rawLabelNames];
			rawLabels.forEach((rawLabel) => {
				const { name: labelName, postCount: labelCount } = rawLabel;
				labelCounts.set(labelName, labelCount);
			});

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

<main class="m-7 flex grow flex-col justify-center space-y-5">
	<h1 class="text-center text-4xl dark:text-white">
		{labelType === 'tag' ? 'Tags' : 'Artists'} Index
	</h1>
	<div class="flex flex-wrap">
		{#each CHAR_OPTIONS_LOWERCASE as option (option)}
			<Button
				disabled={loadingLabels}
				onclick={(event: Event) => getLabelsOnCurrentPage(event, false)}
				class="m-2 items-center justify-center  rounded-lg border border-gray-300 bg-white text-gray-900 focus-within:ring-gray-200 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus-within:ring-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700"
				>{option}</Button
			>
		{/each}
	</div>

	<section class="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#if hasLoadedLabelsOnce}
			{#if labels.length > 0}
				{#each labels as label (label)}
					<a
						class="inline-flex justify-center space-x-2 rounded border p-2 text-center leading-none hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
						href="/posts/{labelType}/{encodeURIComponent(label)}"
					>
						<span class="mt-0.5"
							># {renderLabel(label, labelType, false)} - {formatNumberWithCommas(
								labelCounts.get(label) ?? 0,
							)}</span
						>
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
		<Spinner class="mr-auto ml-auto" size="12" />
	{/if}

	{#if labels.length >= MAXIMUM_LABELS_PER_PAGE && !loadingLabels && hasLoadedLabelsOnce && !finishedLabelPagination}
		<Button
			class="mr-auto ml-auto w-full lg:w-1/3"
			onclick={(event: Event) => getLabelsOnCurrentPage(event, true)}
			color="blue">Load more {labelType}s</Button
		>
	{/if}

	{#if !loadingLabels && hasLoadedLabelsOnce && labels.length === 0}
		<p class="a text-center text-2xl dark:text-white">
			No {labelType}s were indexed that start with {selectedLabel}
		</p>
	{/if}
</main>
