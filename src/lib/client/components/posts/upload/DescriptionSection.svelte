<script lang="ts">
	import { SEPERATOR_CHARACTER_UI } from '$lib/shared/constants/labels';
	import { MAXIMUM_POST_DESCRIPTION_LENGTH } from '$lib/shared/constants/posts';
	import Label from 'flowbite-svelte/Label.svelte';
	import Li from 'flowbite-svelte/Li.svelte';
	import List from 'flowbite-svelte/List.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';

	type Props = {
		description: string;
	};

	let { description = $bindable() }: Props = $props();
</script>

<div class="w-full space-y-2">
	<Label class="mb-1" for="description-textarea">
		Please enter a description for your post (max {MAXIMUM_POST_DESCRIPTION_LENGTH} characters):
	</Label>
	<Textarea
		id="description-textarea"
		maxlength={MAXIMUM_POST_DESCRIPTION_LENGTH}
		rows={5}
		bind:value={description}
		name="description"
		placeholder="Enter a description"
		required
		class="w-full"
	/>
	<p class="mt-2 text-right leading-none dark:text-gray-400">
		{description.length}/{MAXIMUM_POST_DESCRIPTION_LENGTH}
	</p>

	<List class="dark:text-gray-400">
		{#each SEPERATOR_CHARACTER_UI as message (message)}
			<Li>{message}</Li>
		{/each}
	</List>
</div>
