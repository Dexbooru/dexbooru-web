<script lang="ts">
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type Props = {
		open: boolean;
		statusMessage: string;
	};

	let { open = $bindable(), statusMessage }: Props = $props();
</script>

<Modal bind:open size="xs" dismissable={false} class="w-full">
	<div class="flex flex-col items-center">
		<Spinner size="12" />
		<p class="mt-4 text-lg font-semibold text-gray-900 dark:text-white text-center">
			{statusMessage}
		</p>
	</div>
</Modal>
