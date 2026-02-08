<script lang="ts">
	import { page } from '$app/state';
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import ClockOutline from 'flowbite-svelte-icons/ClockOutline.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import FileLinesOutline from 'flowbite-svelte-icons/FileLinesOutline.svelte';
	import LinkOutline from 'flowbite-svelte-icons/LinkOutline.svelte';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
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
	class="flex h-full w-full max-w-none flex-col p-3 shadow-md transition-shadow duration-200 hover:shadow-lg"
>
	<div class="mb-4 flex items-start justify-between">
		<Badge color={currentStatusColor} class="px-2.5 py-0.5">
			{capitalize(report.reviewStatus.replaceAll('_', ' '))}
		</Badge>
		<span
			class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-400 dark:bg-gray-800 dark:text-gray-500"
		>
			#{report.id.slice(0, 8)}
		</span>
	</div>

	<div class="mb-3 flex items-center gap-2">
		<div class="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
			<ExclamationCircleSolid class="text-primary-600 dark:text-primary-500 h-5 w-5" />
		</div>
		<h3 class="line-clamp-1 text-lg font-bold text-gray-900 dark:text-white">
			{capitalize(report.category.replaceAll('_', ' '))}
		</h3>
	</div>

	<div class="grow space-y-4">
		<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
			<ClockOutline class="h-4 w-4" />
			<span>{formatDate(new Date(report.createdAt))}</span>
		</div>

		<div
			class="flex min-h-20 items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300"
		>
			<FileLinesOutline class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
			<p class="leading-relaxed italic">
				{report.description && report.description.length > 0
					? report.description
					: 'No description provided'}
			</p>
		</div>
	</div>

	<div class="mt-6 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
		<Button
			size="sm"
			class="flex w-full items-center justify-center gap-2"
			color="alternative"
			onclick={() => (isModalOpen = true)}
		>
			<SearchOutline class="h-4 w-4" />
			Inspect Report
		</Button>

		{#if !isOnResourceLink()}
			<Button
				href={getResourceLink()}
				size="sm"
				class="hover:text-primary-600 dark:hover:text-primary-500 flex w-full items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400"
				color="primary"
			>
				<LinkOutline class="h-3 w-3" />
				{RESOURCE_BUTTON_TEXT_MAP[reportType]}
			</Button>
		{/if}
	</div>
</Card>

{#if isModalOpen}
	<ReportModerationModal bind:open={isModalOpen} {report} {reportType} />
{/if}
