<script lang="ts">
	import { page } from '$app/state';
	import ExclamationCircleOutline from 'flowbite-svelte-icons/ExclamationCircleOutline.svelte';
</script>

<svelte:head>
	<title>{page.status} - Account Recovery Error</title>
</svelte:head>

<div class="mt-64 flex items-center justify-center">
	<div
		class="w-full max-w-lg rounded-lg border border-red-300 bg-white px-4 py-6 shadow-md dark:border-red-700 dark:bg-gray-800"
	>
		<div class="flex items-center space-x-4">
			<ExclamationCircleOutline class="h-6 w-6 text-red-500 dark:text-red-400" />
			<h2 class="text-lg font-semibold text-red-600 dark:text-red-400">Error {page.status}</h2>
		</div>
		<p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
			{page.error?.message ?? 'An unexpected error occurred. Please try again later.'}
		</p>
		<div class="mt-6">
			<a
				href="/forgot-password"
				class="inline-block rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-red-500 dark:focus:ring-offset-gray-800"
			>
				Go back to forgot password
			</a>
		</div>
	</div>
</div>
