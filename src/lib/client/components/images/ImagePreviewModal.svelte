<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';

	export let imageBase64: string;
	export let imageFile: File;

	const imageAlt = `${imageFile.name}-${Date.now()}`;
	let modalOpen = false;
</script>

<Button
	color="alternative"
	style="width: 200px; height: 200px; background-image: url({imageBase64}); background-repeat: no-repeat; background-size: cover;"
	on:click={() => (modalOpen = true)}
/>

<Modal
	title="Full image preview of {imageFile.name}"
	bind:open={modalOpen}
	autoclose
	on:close={() => (modalOpen = false)}
>
	<img src={imageBase64} alt={imageAlt} />
</Modal>
