<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { updateApplicationConfiguration } from '$lib/client/api/applicationConfiguration';
	import { INSTANCE_CONFIGURATION_SECTIONS } from '$lib/client/components/admin/constants';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import {
		DEFAULT_SAUCENAO_ENABLED_INDEX_IDS,
		DEFAULT_SAUCENAO_MINIMUM_SIMILARITY,
		SAUCENAO_INDEXES,
	} from '$lib/shared/constants/sauceNao';
	import {
		SAUCE_NAO_MINIMUM_SIMILARITY_LOWER_BOUND,
		SAUCE_NAO_MINIMUM_SIMILARITY_UPPER_BOUND,
		buildSearchableSyncWarningMessage,
		getSearchableSyncImpactFromUpdates,
		type TApplicationConfiguration,
		type TPartialApplicationConfiguration,
	} from '$lib/shared/applicationConfiguration';
	import type { TSauceNaoSection, TSection } from './types';

	type Props = {
		initialConfiguration: TApplicationConfiguration;
	};

	const sections: TSection[] = INSTANCE_CONFIGURATION_SECTIONS;
	const applicationConfiguration = getApplicationConfiguration();

	let { initialConfiguration }: Props = $props();

	// A shallow copy would alias the enabled-index array across the page-load snapshot and the form.
	const copyConfiguration = (configuration: TApplicationConfiguration) => ({
		...configuration,
		sauceNaoEnabledIndexes: [...(configuration.sauceNaoEnabledIndexes ?? [])],
		sauceNaoMinimumSimilarity:
			configuration.sauceNaoMinimumSimilarity ?? DEFAULT_SAUCENAO_MINIMUM_SIMILARITY,
	});

	const copyInitialConfiguration = () => copyConfiguration(initialConfiguration);
	const pageLoadConfiguration = copyInitialConfiguration();
	let currentConfiguration: TApplicationConfiguration = copyInitialConfiguration();
	let formValues = $state<TApplicationConfiguration>(copyInitialConfiguration());
	let isSaving = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let currentTab = $state(sections[0]?.name ?? '');

	const getTabLabel = (section: TSection) =>
		section.kind === 'numeric' ? (section.tabLabel ?? section.name) : section.name;

	const configKeyLabels = Object.fromEntries(
		sections.flatMap((section) => {
			if (section.kind === 'numeric') {
				return section.fields.map((field) => [field.key, field.label]);
			}
			return [[section.minimumSimilarity.key, section.minimumSimilarity.label]];
		}),
	);

	const sameIndexIds = (left: readonly number[], right: readonly number[]) => {
		if (left.length !== right.length) return false;
		const sortedLeft = [...left].sort((a, b) => a - b);
		const sortedRight = [...right].sort((a, b) => a - b);
		return sortedLeft.every((id, index) => id === sortedRight[index]);
	};

	const getChangedFields = () => {
		const changedFields: TPartialApplicationConfiguration = {};
		for (const section of sections) {
			if (section.kind === 'numeric') {
				for (const field of section.fields) {
					if (formValues[field.key] !== currentConfiguration[field.key]) {
						changedFields[field.key] = Number(formValues[field.key]);
					}
				}
				continue;
			}

			const similarityKey = section.minimumSimilarity.key;
			if (formValues[similarityKey] !== currentConfiguration[similarityKey]) {
				changedFields[similarityKey] = Number(formValues[similarityKey]);
			}

			const indexesKey = section.enabledIndexesKey;
			if (!sameIndexIds(formValues[indexesKey], currentConfiguration[indexesKey])) {
				changedFields[indexesKey] = [...formValues[indexesKey]];
			}
		}
		return changedFields;
	};

	const pendingSearchableImpact = $derived.by(() => {
		const changedFields = getChangedFields();
		if (Object.keys(changedFields).length === 0) {
			return null;
		}

		const nextConfiguration = {
			...currentConfiguration,
			...changedFields,
		};

		return getSearchableSyncImpactFromUpdates(
			changedFields,
			currentConfiguration,
			nextConfiguration,
		);
	});

	const searchableSyncWarningMessage = $derived(
		pendingSearchableImpact
			? buildSearchableSyncWarningMessage(pendingSearchableImpact, configKeyLabels)
			: '',
	);

	const hasNetNewChangesSincePageLoad = $derived.by(() => {
		return sections.some((section) => {
			if (section.kind === 'numeric') {
				return section.fields.some(
					(field) => Number(formValues[field.key]) !== Number(pageLoadConfiguration[field.key]),
				);
			}

			const similarityKey = section.minimumSimilarity.key;
			const similarityChanged =
				Number(formValues[similarityKey]) !== Number(pageLoadConfiguration[similarityKey]);
			const indexesChanged = !sameIndexIds(
				formValues[section.enabledIndexesKey],
				pageLoadConfiguration[section.enabledIndexesKey],
			);
			return similarityChanged || indexesChanged;
		});
	});

	const handleSave = async () => {
		const changedFields = getChangedFields();
		if (Object.keys(changedFields).length === 0) {
			successMessage = 'No changes to save.';
			errorMessage = '';
			return;
		}

		try {
			isSaving = true;
			errorMessage = '';
			const updatedConfiguration = await updateApplicationConfiguration(changedFields);
			const nextConfiguration = copyConfiguration(updatedConfiguration);
			formValues = nextConfiguration;
			currentConfiguration = nextConfiguration;
			applicationConfiguration.set(updatedConfiguration);
			successMessage = 'Application configuration updated successfully.';
		} catch (error) {
			errorMessage = (error as Error).message;
			successMessage = '';
		} finally {
			isSaving = false;
		}
	};

	const handleTabClick = (tabName: string) => {
		if (currentTab === tabName) return;
		currentTab = tabName;
	};

	const setSauceNaoIndex = (section: TSauceNaoSection, indexId: number, enabled: boolean) => {
		const current = formValues[section.enabledIndexesKey];
		if (enabled === current.includes(indexId)) return;
		formValues[section.enabledIndexesKey] = enabled
			? [...current, indexId]
			: current.filter((id) => id !== indexId);
	};

	const onSauceNaoIndexChange = (section: TSauceNaoSection, indexId: number, event: Event) => {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		setSauceNaoIndex(section, indexId, input.checked);
	};

	const restoreSauceNaoDefaults = (section: TSauceNaoSection) => {
		formValues[section.enabledIndexesKey] = [...DEFAULT_SAUCENAO_ENABLED_INDEX_IDS];
	};
</script>

<section class="w-full p-4">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Instance Configuration</h1>
			<p class="mt-1 mb-0 text-sm text-gray-600 dark:text-gray-300">
				Updates apply globally and stream to connected clients in real-time.
			</p>
		</div>
		<Button
			class="shrink-0 self-start"
			disabled={isSaving || !hasNetNewChangesSincePageLoad}
			onclick={handleSave}
		>
			{isSaving ? 'Saving...' : 'Save Configuration'}
		</Button>
	</div>

	{#if successMessage}
		<p class="mb-4 text-sm text-green-600 dark:text-green-400">{successMessage}</p>
	{/if}
	{#if errorMessage}
		<p class="mb-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
	{/if}
	{#if searchableSyncWarningMessage}
		<Alert color="yellow" class="mb-4">
			{searchableSyncWarningMessage}
		</Alert>
	{/if}

	<Tabs
		tabStyle="underline"
		divider={false}
		class="flex-wrap gap-x-6 gap-y-1 border-b border-gray-200 px-6 pt-4 dark:border-gray-700"
		contentClass="!mt-0 !rounded-none !bg-transparent !p-0 dark:!bg-transparent"
	>
		{#each sections as section (section.name)}
			<TabItem
				onclick={() => handleTabClick(section.name)}
				open={currentTab === section.name}
				title={getTabLabel(section)}
			>
				<div class="px-6 py-6">
					{#if section.kind === 'numeric'}
						<div class="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
							{#each section.fields as field (field.key)}
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
										{field.label}
									</Label>
									<Input
										type="number"
										class="w-full"
										bind:value={formValues[field.key]}
										min={1}
										step={field.step ?? 1}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
							Suggestions are off when no index is selected or the server has no SauceNAO API key.
						</p>
						<div class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
							{#each SAUCENAO_INDEXES as index (index.id)}
								<Checkbox
									checked={formValues[section.enabledIndexesKey].includes(index.id)}
									onchange={(event) => onSauceNaoIndexChange(section, index.id, event)}
								>
									{index.name}
								</Checkbox>
							{/each}
						</div>
						<Button
							type="button"
							color="alternative"
							size="sm"
							class="mt-4"
							onclick={() => restoreSauceNaoDefaults(section)}
						>
							Restore defaults
						</Button>
						<div class="mt-6 max-w-sm space-y-2">
							<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
								{section.minimumSimilarity.label}
							</Label>
							<Input
								type="number"
								class="w-full"
								bind:value={formValues[section.minimumSimilarity.key]}
								min={SAUCE_NAO_MINIMUM_SIMILARITY_LOWER_BOUND}
								max={SAUCE_NAO_MINIMUM_SIMILARITY_UPPER_BOUND}
								step={section.minimumSimilarity.step ?? 1}
							/>
						</div>
					{/if}
				</div>
			</TabItem>
		{/each}
	</Tabs>
</section>
