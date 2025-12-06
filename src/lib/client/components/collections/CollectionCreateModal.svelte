<script lang="ts">
	import InfoCircleSolid from 'flowbite-svelte-icons/InfoCircleSolid.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import CollectionCreateForm from './CollectionCreateForm.svelte';

	type Props = {
		isOpen: boolean;
	};

	let { isOpen = $bindable() }: Props = $props();
</script>

<Modal bind:open={isOpen} size="md" autoclose={false}>
	{#snippet header()}
		<div
			class="flex items-center text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
		>
			<InfoCircleSolid class="w-5 h-5 me-2.5" />
			New collection
		</div>
	{/snippet}

	<CollectionCreateForm bind:isOpen />
</Modal>
