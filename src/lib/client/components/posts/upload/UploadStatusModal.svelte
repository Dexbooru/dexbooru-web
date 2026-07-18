<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type Props = {
		open: boolean;
		statusMessage: string;
		failed?: boolean;
		onDismiss?: () => void;
	};

	let { open = $bindable(), statusMessage, failed = false, onDismiss }: Props = $props();

	const handleDismiss = () => {
		open = false;
		onDismiss?.();
	};
</script>

<Modal bind:open size="xs" dismissable={failed} class="w-full">
	<div class="flex flex-col items-center">
		{#if failed}
			<p class="text-center text-lg font-semibold text-red-600 dark:text-red-400">
				{statusMessage}
			</p>
			<Button class="mt-4" color="alternative" onclick={handleDismiss}>Close</Button>
		{:else}
			<Spinner size="12" />
			<p class="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
				{statusMessage}
			</p>
		{/if}
	</div>
</Modal>
