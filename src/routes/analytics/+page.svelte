<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { PIE_CHART_COLORS, PIE_CHART_OPTIONS } from '$lib/client/constants/analytics';
	import { TOP_K_LABEL_COUNT, TOP_K_POST_LOOKBACK_HOURS } from '$lib/shared/constants/analytics';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TAnalyticsData } from '$lib/shared/types/analytics';
	import Chart from '@flowbite-svelte-plugins/chart/Chart.svelte';
	import type { ApexOptions } from 'apexcharts';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Heading from 'flowbite-svelte/Heading.svelte';
	import Table from 'flowbite-svelte/Table.svelte';
	import TableBody from 'flowbite-svelte/TableBody.svelte';
	import TableBodyCell from 'flowbite-svelte/TableBodyCell.svelte';
	import TableBodyRow from 'flowbite-svelte/TableBodyRow.svelte';
	import TableHead from 'flowbite-svelte/TableHead.svelte';
	import TableHeadCell from 'flowbite-svelte/TableHeadCell.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let isDark = $state(false);

	onMount(() => {
		const checkDark = () => {
			isDark = document.documentElement.classList.contains('dark');
		};

		checkDark();

		const observer = new MutationObserver(checkDark);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => observer.disconnect();
	});

	let { topArtists, topTags, topLikedPosts, topViewedPosts }: TAnalyticsData = $derived(data);

	let tagOptions: ApexOptions = $derived({
		...PIE_CHART_OPTIONS,
		series: topTags.map((tag) => tag.postCount),
		labels: topTags.map((tag) => tag.name),
		colors: PIE_CHART_COLORS,
		chart: {
			...PIE_CHART_OPTIONS.chart,
			foreColor: isDark ? '#f9fafb' : '#374151',
		},
		theme: {
			mode: isDark ? 'dark' : 'light',
		},
	});

	let artistOptions: ApexOptions = $derived({
		...PIE_CHART_OPTIONS,
		series: topArtists.map((artist) => artist.postCount),
		labels: topArtists.map((artist) => artist.name),
		colors: PIE_CHART_COLORS,
		chart: {
			...PIE_CHART_OPTIONS.chart,
			foreColor: isDark ? '#f9fafb' : '#374151',
		},
		theme: {
			mode: isDark ? 'dark' : 'light',
		},
	});

	const hasTagData = $derived(topTags.length > 0 && topTags.some((tag) => tag.postCount > 0));
	const hasArtistData = $derived(
		topArtists.length > 0 && topArtists.some((artist) => artist.postCount > 0),
	);
	const hasLikedPostData = $derived(topLikedPosts.length > 0);
	const hasViewedPostData = $derived(topViewedPosts.length > 0);

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultProfilePicture;
	};
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
		<p class="text-gray-500 sm:text-xl dark:text-gray-400">
			Insights into the most popular content on Dexbooru.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl leading-none font-bold text-gray-900 dark:text-white">
					Top {TOP_K_LABEL_COUNT} Tags by post count
				</h5>
			</div>
			{#if hasTagData}
				<Chart options={tagOptions} class="py-6" />
			{:else}
				<div class="flex min-h-75 items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>

		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl leading-none font-bold text-gray-900 dark:text-white">
					Top {TOP_K_LABEL_COUNT} Artists by post count
				</h5>
			</div>
			{#if hasArtistData}
				<Chart options={artistOptions} class="py-6" />
			{:else}
				<div class="flex min-h-75 items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>
	</div>

	<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl leading-none font-bold text-gray-900 dark:text-white">
					Top {topLikedPosts.length} Most Liked Posts over the past {TOP_K_POST_LOOKBACK_HOURS} hour(s)
				</h5>
			</div>
			{#if hasLikedPostData}
				<div class="overflow-x-auto">
					<Table hoverable>
						<TableHead>
							<TableHeadCell>Description</TableHeadCell>
							<TableHeadCell>Author</TableHeadCell>
							<TableHeadCell>Likes</TableHeadCell>
							<TableHeadCell>Date</TableHeadCell>
							<TableHeadCell>Link</TableHeadCell>
						</TableHead>
						<TableBody class="divide-y">
							{#each topLikedPosts as post (post.id)}
								<TableBodyRow>
									<TableBodyCell class="min-w-37.5 whitespace-normal">
										{post.description.length > 50
											? post.description.slice(0, 50) + '...'
											: post.description}
									</TableBodyCell>
									<TableBodyCell class="flex items-center space-x-2">
										<Avatar
											src={post.author?.profilePictureUrl ?? DefaultProfilePicture}
											alt={post.author?.username}
											size="xs"
											onerror={onImageError}
										/>
										<span class="font-medium dark:text-white"
											>{post.author?.username ?? 'Unknown'}</span
										>
									</TableBodyCell>
									<TableBodyCell>{post.likes}</TableBodyCell>
									<TableBodyCell>{formatDate(new Date(post.createdAt))}</TableBodyCell>
									<TableBodyCell>
										<a
											href="/posts/{post.id}"
											class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
											>View</a
										>
									</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{:else}
				<div class="flex min-h-75 items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>

		<Card class="w-full max-w-none p-6 lg:p-8">
			<div class="mb-8 flex items-center justify-center">
				<h5 class="text-2xl leading-none font-bold text-gray-900 dark:text-white">
					Top {topViewedPosts.length} Most Viewed Posts over the past {TOP_K_POST_LOOKBACK_HOURS} hour(s)
				</h5>
			</div>
			{#if hasViewedPostData}
				<div class="overflow-x-auto">
					<Table hoverable>
						<TableHead>
							<TableHeadCell>Description</TableHeadCell>
							<TableHeadCell>Author</TableHeadCell>
							<TableHeadCell>Views</TableHeadCell>
							<TableHeadCell>Date</TableHeadCell>
							<TableHeadCell>Link</TableHeadCell>
						</TableHead>
						<TableBody class="divide-y">
							{#each topViewedPosts as post (post.id)}
								<TableBodyRow>
									<TableBodyCell class="min-w-37.5 whitespace-normal">
										{post.description.length > 50
											? post.description.slice(0, 50) + '...'
											: post.description}
									</TableBodyCell>
									<TableBodyCell class="flex items-center space-x-2">
										<Avatar
											src={post.author?.profilePictureUrl ?? DefaultProfilePicture}
											alt={post.author?.username}
											size="xs"
											onerror={onImageError}
										/>
										<span class="font-medium dark:text-white"
											>{post.author?.username ?? 'Unknown'}</span
										>
									</TableBodyCell>
									<TableBodyCell>{post.views}</TableBodyCell>
									<TableBodyCell>{formatDate(new Date(post.createdAt))}</TableBodyCell>
									<TableBodyCell>
										<a
											href="/posts/{post.id}"
											class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
											>View</a
										>
									</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{:else}
				<div class="flex min-h-75 items-center justify-center">
					<p class="text-center text-gray-500 dark:text-gray-400">Not enough data available.</p>
				</div>
			{/if}
		</Card>
	</div>
</div>
