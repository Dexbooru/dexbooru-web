<script lang="ts">
	import { page } from '$app/stores';
	import Image404 from '$lib/client/assets/404graphic.png';
	import { ERROR_PAGE_TITLE_MAP } from '$lib/client/constants/pages';
	import type { TErrorPageType } from '$lib/client/types/page';
	import { Button } from 'flowbite-svelte';

	export let errorPageType: TErrorPageType;

	const errorMessage = $page.error?.message;
	const pageResponseStatus = $page.status;
	const pageRoute = $page.url.pathname;
</script>

<svelte:head>
	<title>{ERROR_PAGE_TITLE_MAP[errorPageType]}</title>
</svelte:head>

{#if pageResponseStatus === 404}
	<section
		class="flex flex-col mt-20 items-center justify-center text-gray-900 dark:text-gray-100 px-4 sm:px-6 lg:px-8"
	>
		<img
			src={Image404}
			alt="Error 404 Dexbooru"
			class="w-40 h-40 md:w-64 md:h-64"
			width="200"
			height="200"
			style="aspect-ratio: 200 / 200; object-fit: cover;"
		/>
		<h1 class="mt-8 text-4xl font-extrabold text-gray-900 dark:text-gray-100">404</h1>
		{#if errorPageType === 'posts'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Sorry, we dropped the magnifying glass and couldn't find the post you were looking for!
			</p>
			<code class="mt-1 p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-sm font-mono"
				>{errorMessage}
			</code>
		{:else if errorPageType === 'general'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Sorry, we dropped the magnifying glass and couldn't find the resource you were looking for!
			</p>
			<p class="mt-2 text-md text-gray-500 dark:text-gray-300">
				You tried to visit the following route:
			</p>
			<code class="mt-1 p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-sm font-mono"
				>{pageRoute}
			</code>
		{/if}

		<Button color="blue" href="/" data-sveltekit-reload>Go Home</Button>
	</section>
{:else if pageResponseStatus === 500}
	{pageResponseStatus} {errorMessage}
{/if}
