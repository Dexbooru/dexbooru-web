<script lang="ts">
	import { page } from '$app/state';
	import ExclamationCircleOutline from 'flowbite-svelte-icons/ExclamationCircleOutline.svelte';
</script>

<svelte:head>
	<title>{page.status} - Account Recovery Error</title>
</svelte:head>

<div class="flex items-center justify-center mt-64">
	<div
		class="max-w-lg w-full px-4 py-6 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-lg shadow-md"
	>
		<div class="flex items-center space-x-4">
			<ExclamationCircleOutline class="w-6 h-6 text-red-500 dark:text-red-400" />
			<h2 class="text-lg font-semibold text-red-600 dark:text-red-400">Error {page.status}</h2>
		</div>
		<p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
			{page.error?.message ?? 'An unexpected error occurred. Please try again later.'}
		</p>
		<div class="mt-6">
			<a
				href="/forgot-password"
				class="inline-block px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-red-500 dark:focus:ring-offset-gray-800"
			>
				Go back to forgot password
			</a>
		</div>
	</div>
</div>
