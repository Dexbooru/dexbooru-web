<script lang="ts">
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';
	import type { PostCollectionReport, PostReport, UserReport } from '@prisma/client';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { onMount } from 'svelte';
	import ReportCard from './ReportCard.svelte';

	type Props = {
		reportType: 'postCollectionReports' | 'postReports' | 'userReports';
		handleLoadMoreReports: () => void;
		loadingReports?: boolean;
		containerId: string;
	};

	type TReport = PostReport | PostCollectionReport | UserReport;

	let { reportType, handleLoadMoreReports, loadingReports = false, containerId }: Props = $props();
	let reports = $state<TReport[]>([]);

	const moderationData = getModerationPaginationData();

	const moderationDataUnsubscribe = moderationData.subscribe((data) => {
		if (data) {
			const upcomingReports = data[reportType] ?? [];
			upcomingReports.sort((a, b) => {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			reports = upcomingReports;
		}
	});

	onMount(() => {
		return () => {
			moderationDataUnsubscribe();
		};
	});
</script>

{#if reports.length === 0 && !loadingReports}
	<div class="flex justify-center items-center py-12 text-xl text-gray-500">
		No reports to display.
	</div>
{:else}
	<section id={containerId}>
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
			{#each reports as report (report.id)}
				<ReportCard {report} {reportType} />
			{/each}
		</div>

		{#if loadingReports}
			<div class="flex justify-center items-center mt-8">
				<Spinner class="w-8 h-8 text-primary-500" />
			</div>
		{:else if reports.length >= MAXIMUM_REPORTS_PER_PAGE}
			<div class="flex justify-center mt-8">
				<Button color="blue" on:click={handleLoadMoreReports}>Load more</Button>
			</div>
		{/if}
	</section>
{/if}
