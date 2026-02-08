<script lang="ts">
	import { page } from '$app/state';
	import Button from 'flowbite-svelte/Button.svelte';

	const errorMessage = page.error?.message ?? 'An unexpected error occurred.';
	const attemptedQuery = page.url.searchParams.get('query') ?? '';
</script>

<main class="mt-20 flex flex-col items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-lg border border-red-300 bg-white p-6 text-center shadow-md dark:border-red-700 dark:bg-gray-800"
	>
		<h1 class="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">Invalid Query</h1>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
			{errorMessage}
		</p>
		{#if attemptedQuery}
			<div
				class="rounded-lg border border-red-200 p-3 text-sm text-gray-600 dark:border-red-700 dark:text-gray-400"
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
