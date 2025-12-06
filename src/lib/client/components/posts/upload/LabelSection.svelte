<script lang="ts">
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import LabelContainer from '$lib/client/components/labels/LabelContainer.svelte';
	import { MAXIMUM_ARTIST_LENGTH, MAXIMUM_TAG_LENGTH } from '$lib/shared/constants/labels';
	import { MAXIMUM_ARTISTS_PER_POST, MAXIMUM_TAGS_PER_POST } from '$lib/shared/constants/posts';
	import { isLabelAppropriate, transformLabel } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	type Props = {
		labels: string[];
		type: 'tag' | 'artist';
	};

	let { labels = $bindable(), type }: Props = $props();

	let currentInput = $state('');

	const maxLabels = type === 'tag' ? MAXIMUM_TAGS_PER_POST : MAXIMUM_ARTISTS_PER_POST;
	const maxLabelLength = type === 'tag' ? MAXIMUM_TAG_LENGTH : MAXIMUM_ARTIST_LENGTH;
	const labelColor = type === 'tag' ? 'red' : 'green';
	const inputName = type === 'tag' ? 'tags' : 'artists';
	const placeholder = type === 'tag' ? 'Enter a tag name' : 'Enter an artist name';
	const labelText =
		type === 'tag'
			? `Please specify one or more tags (max of ${MAXIMUM_TAGS_PER_POST}):`
			: `Please specify one or more artists (max of ${MAXIMUM_ARTISTS_PER_POST}):`;

	const addLabel = () => {
		if (labels.length === maxLabels) {
			toast.push(
				`You have reached the maximum amount of ${type}s a post can have`,
				FAILURE_TOAST_OPTIONS
			);
			return;
		}

		if (currentInput.length === 0) {
			toast.push(`The ${type} cannot be empty!`, FAILURE_TOAST_OPTIONS);
			return;
		}

		const transformedLabel = transformLabel(currentInput);
		if (!isLabelAppropriate(transformedLabel, type)) {
			toast.push(`${transformedLabel} is not an allowed ${type}`, FAILURE_TOAST_OPTIONS);
			currentInput = '';
			return;
		}

		if (labels.includes(transformedLabel)) {
			toast.push(
				`A ${type} called ${transformedLabel} was previously added already!`,
				FAILURE_TOAST_OPTIONS
			);
			return;
		}

		labels = [...new Set([...labels, transformedLabel])];
		currentInput = '';
	};

	const removeLabel = (event: CustomEvent<any> & { explicitOriginalTarget: Element }) => {
		const target = event.explicitOriginalTarget as Element;
		const badgeDiv = target.closest('div');

		if (badgeDiv) {
			const removalLabel = badgeDiv.textContent?.split(' ')[0].trim() ?? '';
			labels = labels.filter((l) => l !== removalLabel);
		}
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
	<div class="flex flex-col sm:flex-row gap-2 mt-2">
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
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{currentInput.length}/{maxLabelLength}
	</p>
	<div class="mt-2 max-h-32 overflow-y-auto w-full">
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
