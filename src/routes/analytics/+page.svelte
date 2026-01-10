<script lang="ts">
	import { PIE_CHART_COLORS, PIE_CHART_OPTIONS } from '$lib/client/constants/analytics';
	import { TOP_K_LABEL_COUNT } from '$lib/shared/constants/analytics';
	import type { TAnalyticsData } from '$lib/shared/types/analytics';
	import Chart from '@flowbite-svelte-plugins/chart/Chart.svelte';
	import type { ApexOptions } from 'apexcharts';
	import Card from 'flowbite-svelte/Card.svelte';
	import Heading from 'flowbite-svelte/Heading.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let { topArtists, topTags }: TAnalyticsData = data;

	let tagOptions: ApexOptions = $state({
		...PIE_CHART_OPTIONS,
		series: topTags.map((tag) => tag.postCount),
		labels: topTags.map((tag) => tag.name),
		colors: PIE_CHART_COLORS,
	});

	let artistOptions: ApexOptions = $state({
		...PIE_CHART_OPTIONS,
		series: topArtists.map((artist) => artist.postCount),
		labels: topArtists.map((artist) => artist.name),
		colors: PIE_CHART_COLORS,
	});

	const hasTagData = $derived(topTags.length > 0 && topTags.some((tag) => tag.postCount > 0));
	const hasArtistData = $derived(
		topArtists.length > 0 && topArtists.some((artist) => artist.postCount > 0),
	);
</script>

<svelte:head>
	<title>Dexbooru - Analytics</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 lg:px-6">
	<div class="mb-8">
		<Heading
			tag="h1"
			class="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
		>
			Analytics Dashboard
		</Heading>
		<p class="text-gray-500 dark:text-gray-400 sm:text-xl">
			Insights into the most popular content on Dexbooru.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl font-bold leading-none text-gray-900 dark:text-white">
					Top {TOP_K_LABEL_COUNT} Tags by post count
				</h5>
			</div>
			{#if hasTagData}
				<Chart options={tagOptions} class="py-6" />
			{:else}
				<div class="flex min-h-[300px] items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>

		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl font-bold leading-none text-gray-900 dark:text-white">
					Top {TOP_K_LABEL_COUNT} Artists by post count
				</h5>
			</div>
			{#if hasArtistData}
				<Chart options={artistOptions} class="py-6" />
			{:else}
				<div class="flex min-h-[300px] items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>
	</div>
</div>
