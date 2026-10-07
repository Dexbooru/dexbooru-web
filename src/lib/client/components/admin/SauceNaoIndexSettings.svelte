<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import { updateEnabledSauceNaoIndexes } from '$lib/client/api/sauceNao';
	import { DEFAULT_SAUCENAO_ENABLED_INDEX_IDS } from '$lib/shared/constants/sauceNao';
	import type { TSauceNaoIndex } from '$lib/shared/types/sauceNao';

	type Props = {
		initialIndexes: TSauceNaoIndex[];
	};

	let { initialIndexes }: Props = $props();

	const enabledIdsOf = (indexes: readonly TSauceNaoIndex[]) =>
		indexes.filter((index) => index.enabled).map((index) => index.id);

	const readInitialIndexes = () => [...initialIndexes];

	let indexes = $state<TSauceNaoIndex[]>(readInitialIndexes());
	let savedIds = $state<number[]>(enabledIdsOf(readInitialIndexes()));
	let selectedIds = $state<number[]>(enabledIdsOf(readInitialIndexes()));
	let isSaving = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	const hasUnsavedChanges = $derived(
		selectedIds.length !== savedIds.length || selectedIds.some((id) => !savedIds.includes(id)),
	);

	const setIndexEnabled = (id: number, enabled: boolean) => {
		if (enabled === selectedIds.includes(id)) return;
		selectedIds = enabled
			? [...selectedIds, id]
			: selectedIds.filter((selected) => selected !== id);
		successMessage = '';
	};

	const restoreDefaults = () => {
		const availableIds = indexes.map((index) => index.id);
		selectedIds = DEFAULT_SAUCENAO_ENABLED_INDEX_IDS.filter((id) => availableIds.includes(id));
		successMessage = '';
	};

	const handleSave = async () => {
		try {
			isSaving = true;
			errorMessage = '';
			const updatedIndexes = await updateEnabledSauceNaoIndexes(selectedIds);
			indexes = updatedIndexes;
			savedIds = enabledIdsOf(updatedIndexes);
			selectedIds = [...savedIds];
			successMessage = 'SauceNAO indexes updated successfully.';
		} catch (error) {
			errorMessage = (error as Error).message;
			successMessage = '';
		} finally {
			isSaving = false;
		}
	};
</script>

<section class="w-full p-4">
	<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">SauceNAO indexes</h2>
			<p class="mt-1 mb-0 text-sm text-gray-600 dark:text-gray-300">
				Sites searched for post source suggestions. Suggestions are off when no index is selected or
				the server has no SauceNAO API key.
			</p>
		</div>
		<Button
			class="shrink-0 self-start"
			disabled={isSaving || !hasUnsavedChanges}
			onclick={handleSave}
		>
			{isSaving ? 'Saving...' : 'Save Indexes'}
		</Button>
	</div>

	{#if successMessage}
		<p class="mb-4 text-sm text-green-600 dark:text-green-400">{successMessage}</p>
	{/if}
	{#if errorMessage}
		<p class="mb-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
	{/if}

	{#if indexes.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">
			The SauceNAO index list has not been synced yet. It loads in the background when the server
			starts.
		</p>
	{:else}
		<div class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each indexes as index (index.id)}
				<Checkbox
					checked={selectedIds.includes(index.id)}
					onchange={(event) => setIndexEnabled(index.id, event.currentTarget.checked)}
				>
					{index.name}
				</Checkbox>
			{/each}
		</div>
		<Button type="button" color="alternative" size="sm" class="mt-4" onclick={restoreDefaults}>
			Restore defaults
		</Button>
	{/if}
</section>
