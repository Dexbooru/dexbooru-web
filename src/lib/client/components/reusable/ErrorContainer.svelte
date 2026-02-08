<script lang="ts">
	import { page } from '$app/state';
	import Image404 from '$lib/client/assets/404graphic.webp';
	import { ERROR_PAGE_TITLE_MAP } from '$lib/client/constants/pages';
	import type { TErrorPageType } from '$lib/client/types/page';
	import Button from 'flowbite-svelte/Button.svelte';
	import Img from 'flowbite-svelte/Img.svelte';

	type Props = {
		errorPageType: TErrorPageType;
	};

	let { errorPageType }: Props = $props();
</script>

<svelte:head>
	<title
		>{page.status === 500
			? ERROR_PAGE_TITLE_MAP['internalServerError']
			: ERROR_PAGE_TITLE_MAP[errorPageType]}</title
	>
</svelte:head>

<section
	class="mt-20 flex flex-col items-center justify-center px-4 text-gray-900 sm:px-6 lg:px-8 dark:text-gray-100"
>
	{#if page.status === 404}
		<Img
			src={Image404}
			alt="Error 404 Dexbooru Post"
			class="h-40 w-40 md:h-64 md:w-64"
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
			<p class="text-md mt-2 text-gray-500 dark:text-gray-300">
				You tried to visit the following route:
			</p>
			<code class="mt-1 rounded-md bg-gray-200 p-2 font-mono text-sm dark:bg-gray-800"
				>{page.url.pathname}
			</code>
		{/if}

		<Button color="blue" href="/">Go Home</Button>
	{:else if page.status === 400}
		<Img
			src={Image404}
			alt="Error 404 Dexbooru Post"
			class="h-40 w-40 md:h-64 md:w-64"
			width="200"
			height="200"
			style="aspect-ratio: 200 / 200; object-fit: cover;"
		/>
		<h1 class="mt-8 text-4xl font-extrabold text-gray-900 dark:text-gray-100">400</h1>
		{#if errorPageType === 'posts'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Invalid post id provided. Please ensure that it is in a UUID format!
			</p>
		{:else if errorPageType === 'collections'}
			<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
				Invalid collection id provided. Please ensure that it is in a UUID format!
			</p>
		{/if}
	{:else if page.status === 500}
		{page.error?.message}
	{/if}
</section>
