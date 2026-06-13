<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { updateApplicationConfiguration } from '$lib/client/api/applicationConfiguration';
	import { INSTANCE_CONFIGURATION_SECTIONS } from '$lib/client/components/admin/constants';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import type {
		TApplicationConfiguration,
		TPartialApplicationConfiguration,
	} from '$lib/shared/applicationConfiguration';
	import {
		buildSearchableSyncWarningMessage,
		getSearchableSyncImpactFromUpdates,
	} from '$lib/shared/applicationConfiguration';
	import type { TSection } from './types';

	type Props = {
		initialConfiguration: TApplicationConfiguration;
	};

	const sections: TSection[] = INSTANCE_CONFIGURATION_SECTIONS;
	const applicationConfiguration = getApplicationConfiguration();

	let { initialConfiguration }: Props = $props();
	const createConfigurationCopy = () => ({ ...initialConfiguration });
	const pageLoadConfiguration = createConfigurationCopy();
	let currentConfiguration: TApplicationConfiguration = createConfigurationCopy();
	let formValues = $state<TPartialApplicationConfiguration>(createConfigurationCopy());
	let isSaving = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let currentTab = $state(sections[0]?.name ?? '');

	const getTabLabel = (section: TSection) => section.tabLabel ?? section.name;

	const configKeyLabels = Object.fromEntries(
		sections.flatMap((section) => section.fields.map((field) => [field.key, field.label])),
	);

	const getChangedFields = () => {
		const changedFields: TPartialApplicationConfiguration = {};
		for (const section of sections) {
			for (const field of section.fields) {
				if (formValues[field.key] !== currentConfiguration[field.key]) {
					changedFields[field.key] = Number(formValues[field.key]);
				}
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
		return sections.some((section) =>
			section.fields.some((field) => {
				return Number(formValues[field.key]) !== Number(pageLoadConfiguration[field.key]);
			}),
		);
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
			formValues = { ...updatedConfiguration };
			currentConfiguration = updatedConfiguration;
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
				</div>
			</TabItem>
		{/each}
	</Tabs>
</section>
