<script lang="ts">
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';
	import { capitalize } from '$lib/shared/helpers/util';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
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
	<div
		class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center dark:border-gray-700 dark:bg-gray-800/30"
	>
		<div class="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
			<ExclamationCircleSolid class="h-12 w-12 text-gray-400" />
		</div>
		<h3 class="mb-1 text-xl font-semibold text-gray-900 dark:text-white">No reports to display</h3>
		<p class="max-w-sm text-gray-500 dark:text-gray-400">
			There are currently no {capitalize(reportType.replace('Reports', ''))} reports that match your criteria.
		</p>
	</div>
{:else}
	<section id={containerId} class="space-y-8">
		<div
			class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each reports as report (report.id)}
				<ReportCard {report} {reportType} />
			{/each}
		</div>

		{#if loadingReports}
			<div class="flex items-center justify-center py-8">
				<Spinner class="text-primary-500 h-10 w-10" />
			</div>
		{:else if reports.length >= MAXIMUM_REPORTS_PER_PAGE}
			<div class="flex justify-center pt-4">
				<Button color="blue" onclick={handleLoadMoreReports} class="px-10">
					Load more reports
				</Button>
			</div>
		{/if}
	</section>
{/if}
