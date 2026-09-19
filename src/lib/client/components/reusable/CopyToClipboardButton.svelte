<script lang="ts">
	import {
		FAILURE_TOAST_OPTIONS,
		SUCCESS_TOAST_OPTIONS,
		TOAST_DEFAULT_OPTIONS,
	} from '$lib/client/constants/toasts';
	import { toast } from '@zerodevx/svelte-toast';
	import ClipboardOutline from 'flowbite-svelte-icons/ClipboardOutline.svelte';

	type Props = {
		value: string;
		label?: string;
		successMessage?: string;
		failureMessage?: string;
		class?: string;
	};

	let {
		value,
		label = 'Copy to clipboard',
		successMessage = 'Copied to clipboard',
		failureMessage = 'Could not copy to clipboard',
		class: className = '',
	}: Props = $props();

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			toast.push(successMessage, {
				...TOAST_DEFAULT_OPTIONS,
				...SUCCESS_TOAST_OPTIONS,
			});
		} catch {
			toast.push(failureMessage, FAILURE_TOAST_OPTIONS);
		}
	};
</script>

<button
	type="button"
	class="inline-flex shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 {className}"
	aria-label={label}
	title={label}
	onclick={handleCopy}
>
	<ClipboardOutline class="h-4 w-4 shrink-0" />
</button>
