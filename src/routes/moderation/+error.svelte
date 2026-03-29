<script lang="ts">
	import { page } from '$app/state';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';

	const message = $derived(page.error?.message ?? 'An unexpected error occurred.');

	const title = $derived.by(() => {
		if (page.status === 401) return 'Sign in required';
		if (page.status === 403) return 'Access denied';
		return 'Something went wrong';
	});

	const isAuthError = $derived(page.status === 401 || page.status === 403);
</script>

<main class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-6">
	<div class="w-full max-w-lg">
		<Alert color="red" class="shadow-md">
			<div class="flex w-full flex-col items-center gap-4 text-center">
				<div class="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
					<ExclamationCircleSolid class="h-8 w-8 shrink-0" aria-hidden="true" />
					<span class="text-xl font-semibold text-gray-900 dark:text-white">{title}</span>
				</div>
				<p class="text-base leading-relaxed text-gray-700 dark:text-gray-300">
					{message}
				</p>
				<div class="flex flex-wrap justify-center gap-3 pt-1">
					{#if page.status === 401}
						<Button href="/login" color="blue">Sign in</Button>
					{/if}
					{#if isAuthError}
						<Button href="/" color="alternative">Back to home</Button>
					{:else}
						<Button href="/" color="blue">Back to home</Button>
					{/if}
				</div>
			</div>
		</Alert>
	</div>
</main>
