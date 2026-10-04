<script lang="ts">
	import { MAXIMUM_POST_SOURCE_LABEL_LENGTH } from '$lib/shared/constants/posts';
	import { transformLabel } from '$lib/shared/helpers/labels';
	import type { TPostSourceFields, TPostSourceType } from '$lib/shared/types/sauceNao';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Select from 'flowbite-svelte/Select.svelte';

	const SOURCE_TYPE_OPTIONS: { value: TPostSourceType; label: string }[] = [
		{ value: 'ANIME', label: 'Anime' },
		{ value: 'MANGA', label: 'Manga' },
		{ value: 'VIDEOGAME', label: 'Video game' },
		{ value: 'OTHER', label: 'Other' },
	];

	type Props = {
		characterName: string;
		sourceTitle: string;
		sourceType: TPostSourceType | '';
		detectedSource: TPostSourceFields | null;
	};

	let {
		characterName = $bindable(),
		sourceTitle = $bindable(),
		sourceType = $bindable(),
		detectedSource,
	}: Props = $props();

	const detectedPlaceholder = (detected: string | undefined, example: string) =>
		detected ? `Detected: ${detected}` : example;
</script>

<div class="w-full space-y-2">
	<div class="space-y-2">
		<Label for="characterName">Character name (optional)</Label>
		<Input
			id="characterName"
			name="characterName"
			type="text"
			class="w-full"
			maxlength={MAXIMUM_POST_SOURCE_LABEL_LENGTH}
			bind:value={characterName}
			onblur={() => (characterName = transformLabel(characterName))}
			placeholder={detectedPlaceholder(detectedSource?.characterName, 'e.g. hatsune_miku')}
		/>
	</div>
	<div class="space-y-2">
		<Label for="sourceTitle">Series name (optional)</Label>
		<Input
			id="sourceTitle"
			name="sourceTitle"
			type="text"
			class="w-full"
			maxlength={MAXIMUM_POST_SOURCE_LABEL_LENGTH}
			bind:value={sourceTitle}
			onblur={() => (sourceTitle = transformLabel(sourceTitle))}
			placeholder={detectedPlaceholder(detectedSource?.sourceTitle, 'e.g. vocaloid')}
		/>
	</div>
	<div class="space-y-2">
		<Label for="sourceType">Source type (optional)</Label>
		<Select id="sourceType" name="sourceType" class="w-full" placeholder="" bind:value={sourceType}>
			<option value="">Detect automatically</option>
			{#each SOURCE_TYPE_OPTIONS as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</Select>
	</div>
	{#if detectedSource}
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Detected values are used unless you override them.
		</p>
	{/if}
</div>
