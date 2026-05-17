<script lang="ts">
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import { BLACKLISTED_LABELS, LABEL_REGEX } from '$lib/shared/constants/labels';
	import { transformLabel } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	type Props = {
		labels: string[];
		type: 'tag' | 'artist';
	};

	let { labels = $bindable(), type }: Props = $props();
	const applicationConfiguration = getApplicationConfiguration();

	let currentInput = $state('');

	const maxLabels = $derived(
		type === 'tag'
			? $applicationConfiguration.maximumTagsPerPost
			: $applicationConfiguration.maximumArtistsPerPost,
	);
	const maxLabelLength = $derived(
		type === 'tag'
			? $applicationConfiguration.maximumTagLength
			: $applicationConfiguration.maximumArtistLength,
	);
	const labelColor = $derived(type === 'tag' ? 'red' : 'green');
	const inputName = $derived(type === 'tag' ? 'tags' : 'artists');
	const placeholder = $derived(type === 'tag' ? 'Enter a tag name' : 'Enter an artist name');
	const labelText = $derived(
		type === 'tag'
			? `Please specify one or more tags (max of ${$applicationConfiguration.maximumTagsPerPost}):`
			: `Please specify one or more artists (max of ${$applicationConfiguration.maximumArtistsPerPost}):`,
	);

	const addLabel = () => {
		if (labels.length === maxLabels) {
			toast.push(
				`You have reached the maximum amount of ${type}s a post can have`,
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		if (currentInput.length === 0) {
			toast.push(`The ${type} cannot be empty!`, FAILURE_TOAST_OPTIONS);
			return;
		}

		const transformedLabel = transformLabel(currentInput);
		const labelBlocked = BLACKLISTED_LABELS.some((blockedLabel) =>
			transformedLabel.includes(blockedLabel),
		);
		const invalidLength = transformedLabel.length > maxLabelLength || transformedLabel.length === 0;
		if (!LABEL_REGEX.test(transformedLabel) || labelBlocked || invalidLength) {
			toast.push(`${transformedLabel} is not an allowed ${type}`, FAILURE_TOAST_OPTIONS);
			currentInput = '';
			return;
		}

		if (labels.includes(transformedLabel)) {
			toast.push(
				`A ${type} called ${transformedLabel} was previously added already!`,
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		labels = [...new Set([...labels, transformedLabel])];
		currentInput = '';
	};

	const removeLabel = (_event: Event, removalLabel: string) => {
		labels = labels.filter((l) => l !== removalLabel);
	};

	const handleKeypress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			addLabel();
		}
	};
</script>

<div class="w-full">
	<Label for="{type}-input">{labelText}</Label>
	<div class="mt-2 flex flex-col gap-2 sm:flex-row">
		<Input
			id="{type}-input"
			onkeypress={handleKeypress}
			bind:value={currentInput}
			pattern="[a-z]*"
			maxlength={maxLabelLength}
			type="text"
			{placeholder}
			class="w-full"
		/>
		<Button
			class="w-full sm:w-auto"
			disabled={labels.length === maxLabels || currentInput.length === 0}
			type="button"
			onclick={addLabel}>Add</Button
		>
	</div>
	<p class="mt-2 text-right leading-none dark:text-gray-400">
		{currentInput.length}/{maxLabelLength}
	</p>
	<div class="mt-2 max-h-32 w-full overflow-y-auto">
		<LabelContainer
			handleLabelClose={removeLabel}
			labelIsDismissable
			labelIsLink={false}
			{labelColor}
			labelType={type}
			{labels}
		/>
	</div>
	<Input type="hidden" name={inputName} value={labels.join(',')} />
</div>
