<script lang="ts">
	import { MAXIMUM_SOURCE_LINK_LENGTH } from '$lib/shared/constants/posts';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	type Props = {
		sourceLink: string;
	};

	let { sourceLink = $bindable() }: Props = $props();
</script>

<div class="w-full space-y-2">
	<Label for="sourceLink">Specify the source url of the post:</Label>
	<Input
		placeholder="Enter the source url"
		type="url"
		required
		name="sourceLink"
		maxlength={MAXIMUM_SOURCE_LINK_LENGTH}
		bind:value={sourceLink}
		class="w-full"
	/>
</div>
