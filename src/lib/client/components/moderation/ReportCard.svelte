<script lang="ts">
	import { page } from '$app/state';
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import ClockOutline from 'flowbite-svelte-icons/ClockOutline.svelte';
	import FileLinesOutline from 'flowbite-svelte-icons/FileLinesOutline.svelte';
	import LinkOutline from 'flowbite-svelte-icons/LinkOutline.svelte';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import ReportModerationModal from './ReportModerationModal.svelte';

	type Props = {
		report: PostReport | PostCollectionReport | UserReport;
		reportType: 'postReports' | 'postCollectionReports' | 'userReports';
	};

	let { report, reportType }: Props = $props();

	let isModalOpen = $state(false);

	const RESOURCE_BUTTON_TEXT_MAP = {
		postReports: 'View Post',
		postCollectionReports: 'View Collection',
		userReports: 'View Profile',
	};

	const getResourceLink = () => {
		switch (reportType) {
			case 'postReports':
				return `/posts/${(report as PostReport).postId}`;
			case 'postCollectionReports':
				return `/collections/${(report as PostCollectionReport).postCollectionId}`;
			case 'userReports':
				return `/profile/${(report as UserReport).userId}`;
			default:
				return '';
		}
	};

	const isOnResourceLink = () => {
		const pathname = page.url.pathname;

		switch (reportType) {
			case 'postReports':
				return pathname.includes(`/posts/${(report as PostReport).postId}`);
			case 'postCollectionReports':
				return pathname.includes(
					`/collections/${(report as PostCollectionReport).postCollectionId}`,
				);
			case 'userReports':
				return pathname.includes(`/profile/${(report as UserReport).userId}`);
			default:
				return false;
		}
	};

	const statusColors = {
		NOT_REVIEWED: 'yellow',
		IN_REVIEW: 'blue',
		REJECTED: 'red',
		ACCEPTED: 'green',
	} as const;

	const currentStatusColor = $derived(statusColors[report.reviewStatus]);
</script>

<Card
	class="w-full max-w-none shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full p-3"
>
	<div class="flex justify-between items-start mb-4">
		<Badge color={currentStatusColor} class="px-2.5 py-0.5">
			{capitalize(report.reviewStatus.replaceAll('_', ' '))}
		</Badge>
		<span
			class="text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded"
		>
			#{report.id.slice(0, 8)}
		</span>
	</div>

	<div class="flex items-center gap-2 mb-3">
		<div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
			<ExclamationCircleSolid class="w-5 h-5 text-primary-600 dark:text-primary-500" />
		</div>
		<h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
			{capitalize(report.category.replaceAll('_', ' '))}
		</h3>
	</div>

	<div class="space-y-4 grow">
		<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
			<ClockOutline class="w-4 h-4" />
			<span>{formatDate(new Date(report.createdAt))}</span>
		</div>

		<div
			class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 min-h-20"
		>
			<FileLinesOutline class="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
			<p class="italic leading-relaxed">
				{report.description && report.description.length > 0
					? report.description
					: 'No description provided'}
			</p>
		</div>
	</div>

	<div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
		<Button
			size="sm"
			class="w-full flex items-center justify-center gap-2"
			color="alternative"
			onclick={() => (isModalOpen = true)}
		>
			<SearchOutline class="w-4 h-4" />
			Inspect Report
		</Button>

		{#if !isOnResourceLink()}
			<Button
				href={getResourceLink()}
				size="sm"
				class="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500 text-xs"
				color="none"
			>
				<LinkOutline class="w-3 h-3" />
				{RESOURCE_BUTTON_TEXT_MAP[reportType]}
			</Button>
		{/if}
	</div>
</Card>

{#if isModalOpen}
	<ReportModerationModal bind:open={isModalOpen} {report} {reportType} />
{/if}
