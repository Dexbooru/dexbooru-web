<script lang="ts">
	import { page } from '$app/state';
	import Button from 'flowbite-svelte/Button.svelte';

	const errorMessage = page.error?.message ?? 'An unexpected error occurred.';
	const attemptedQuery = page.url.searchParams.get('query') ?? '';
</script>

<main class="flex flex-col items-center justify-center p-4 mt-20">
	<div
		class="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center border border-red-300 dark:border-red-700"
	>
		<h1 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Invalid Query</h1>
		<p class="text-gray-700 dark:text-gray-300 mb-4">
			{errorMessage}
		</p>
		{#if attemptedQuery}
			<div
				class="text-sm text-gray-600 dark:text-gray-400 rounded-lg p-3 border border-red-200 dark:border-red-700"
			>
				<p>
					<strong>Attempted Query:</strong>
					<em>{attemptedQuery}</em>
				</p>
			</div>
		{/if}
		<div class="mt-6">
			<Button href="/" color="blue" outline={false}>Search again</Button>
		</div>
	</div>
</main>
