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
	let labelCounts = $state(new SvelteMap<string, number>());
	let pageNumber = 0;
	let selectedLabel = $state('');

	const getLabelsOnCurrentPage = async (event: Event, pressedLoadingMore: boolean) => {
		const target = event.target as HTMLButtonElement;
		const letter = pressedLoadingMore ? selectedLabel : target.innerText;

		loadingLabels = true;
		if (!pressedLoadingMore) {
			labels = [];
			labelCounts = new SvelteMap<string, number>();
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

<main class="flex flex-col grow justify-center m-7 space-y-5">
	<h1 class="text-4xl dark:text-white text-center">
		{labelType === 'tag' ? 'Tags' : 'Artists'} Index
	</h1>
	<div class="flex flex-wrap">
		{#each CHAR_OPTIONS_LOWERCASE as option}
			<Button
				disabled={loadingLabels}
				onclick={(event: Event) => getLabelsOnCurrentPage(event, false)}
				class="m-2 items-center justify-center  text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 focus-within:ring-gray-200 dark:focus-within:ring-gray-700 rounded-lg"
				>{option}</Button
			>
		{/each}
	</div>

	<section class="grid gap-3 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
		{#if hasLoadedLabelsOnce}
			{#if labels.length > 0}
				{#each labels as label (label)}
					<a
						class="text-center inline-flex justify-center space-x-2 border rounded p-2 leading-none dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
		<Spinner class="ml-auto mr-auto" size="12" />
	{/if}

	{#if labels.length >= MAXIMUM_LABELS_PER_PAGE && !loadingLabels && hasLoadedLabelsOnce && !finishedLabelPagination}
		<Button
			class="lg:w-1/3 w-full ml-auto mr-auto"
			onclick={(event: Event) => getLabelsOnCurrentPage(event, true)}
			color="blue">Load more {labelType}s</Button
		>
	{/if}

	{#if !loadingLabels && hasLoadedLabelsOnce && labels.length === 0}
		<p class="text-2xl dark:text-white text-center a">
			No {labelType}s were indexed that start with {selectedLabel}
		</p>
	{/if}
</main>
