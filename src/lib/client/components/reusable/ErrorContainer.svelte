<script lang="ts">
	import { page } from '$app/stores';
	import Image404 from '$lib/client/assets/404graphic.png';
	import { ERROR_PAGE_TITLE_MAP } from '$lib/client/constants/pages';
	import type { TErrorPageType } from '$lib/client/types/page';
	import { Button } from 'flowbite-svelte';

	interface Props {
		errorPageType: TErrorPageType;
	}

	let { errorPageType }: Props = $props();
</script>

<svelte:head>
	<title
		>{$page.status === 500
			? ERROR_PAGE_TITLE_MAP['internalServerError']
			: ERROR_PAGE_TITLE_MAP[errorPageType]}</title
	>
</svelte:head>

{#if $page.status === 404}
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
		{:else if errorPageType === 'collections'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Sorry, we dropped the magnifying glass and couldn't find the collection you were looking
				for!
			</p>
		{:else if errorPageType === 'general'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Sorry, we dropped the magnifying glass and couldn't find the resource you were looking for!
			</p>
			<p class="mt-2 text-md text-gray-500 dark:text-gray-300">
				You tried to visit the following route:
			</p>
			<code class="mt-1 p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-sm font-mono"
				>{$page.url.pathname}
			</code>
		{/if}

		<Button class="mt-5" color="blue" href="/">Go Home</Button>
	</section>
{:else if $page.status === 500}
	{$page.error?.message}
{/if}
