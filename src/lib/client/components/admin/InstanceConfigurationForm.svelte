<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import { updateApplicationConfiguration } from '$lib/client/api/applicationConfiguration';
	import { INSTANCE_CONFIGURATION_SECTIONS } from '$lib/client/components/admin/constants';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import type {
		TApplicationConfiguration,
		TPartialApplicationConfiguration,
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

	const hasNetNewChangesSincePageLoad = $derived.by(() => {
		return sections.some((section) =>
			section.fields.some((field) => {
				return Number(formValues[field.key]) !== Number(pageLoadConfiguration[field.key]);
			}),
		);
	});

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
</script>

<section class="mx-auto w-full max-w-6xl p-4">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Instance Configuration</h1>
			<p class="text-sm text-gray-600 dark:text-gray-300">
				Updates apply globally and stream to connected clients in real-time.
			</p>
		</div>
		<Button disabled={isSaving || !hasNetNewChangesSincePageLoad} onclick={handleSave}>
			{isSaving ? 'Saving...' : 'Save Configuration'}
		</Button>
	</div>

	{#if successMessage}
		<p class="mb-2 text-sm text-green-600 dark:text-green-400">{successMessage}</p>
	{/if}
	{#if errorMessage}
		<p class="mb-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
	{/if}

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		{#each sections as section (section.name)}
			<Card class="h-full p-3">
				<h2 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">{section.name}</h2>
				<div class="grid grid-cols-1 gap-3">
					{#each section.fields as field (field.key)}
						<div>
							<Label class="mb-1 block">{field.label}</Label>
							<Input
								type="number"
								bind:value={formValues[field.key]}
								min={1}
								step={field.step ?? 1}
							/>
						</div>
					{/each}
				</div>
			</Card>
		{/each}
	</div>
</section>
