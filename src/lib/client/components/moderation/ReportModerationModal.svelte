<script lang="ts">
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { updateReportStatus } from '$lib/client/api/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import { toast } from '@zerodevx/svelte-toast';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';

	type TReport = PostReport | PostCollectionReport | UserReport;

	type Props = {
		report: TReport;
		reportType: 'postReports' | 'postCollectionReports' | 'userReports';
		open: boolean;
	};

	let { report, reportType, open = $bindable() }: Props = $props();
	let loading = $state(false);

	const moderationData = getModerationPaginationData();

	const handleAction = async (status: 'ACCEPTED' | 'REJECTED' | 'IN_REVIEW') => {
		loading = true;
		try {
			const response = await updateReportStatus(report.id, reportType, status);
			if (response.ok) {
				toast.push(
					`Report ${capitalize(status.replace('_', ' ').toLowerCase())} successfully`,
					SUCCESS_TOAST_OPTIONS,
				);

				// Update local store
				moderationData.update((data) => {
					if (!data) return null;
					const updatedList = data[reportType].map((r) =>
						r.id === report.id ? { ...r, reviewStatus: status } : r,
					);
					return {
						...data,
						[reportType]: updatedList,
					};
				});
				open = false;
			} else {
				toast.push('Failed to update report status', FAILURE_TOAST_OPTIONS);
			}
		} catch {
			toast.push('An unexpected error occurred', FAILURE_TOAST_OPTIONS);
		} finally {
			loading = false;
		}
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

	const statusColors = {
		NOT_REVIEWED: 'yellow',
		IN_REVIEW: 'blue',
		REJECTED: 'red',
		ACCEPTED: 'green',
	} as const;
</script>

<Modal title="Inspect Report" bind:open size="md" outsideclose>
	<div class="space-y-6">
		<div class="flex items-start justify-between">
			<div>
				<h3 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
					{capitalize(report.category.replaceAll('_', ' '))}
				</h3>
				<p class="text-sm text-gray-500 dark:text-gray-400">ID: {report.id}</p>
			</div>
			<Badge color={statusColors[report.reviewStatus]}>
				{capitalize(report.reviewStatus.replaceAll('_', ' '))}
			</Badge>
		</div>

		<div class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<span class="block font-medium text-gray-500 dark:text-gray-400">Created At</span>
				<span class="text-gray-900 dark:text-white">{formatDate(new Date(report.createdAt))}</span>
			</div>
			<div>
				<span class="block font-medium text-gray-500 dark:text-gray-400">Report Type</span>
				<span class="text-gray-900 dark:text-white"
					>{capitalize(reportType.replace('Reports', ''))}</span
				>
			</div>
		</div>

		<div>
			<span class="mb-2 block font-medium text-gray-500 dark:text-gray-400">Description</span>
			<div
				class="min-h-[100px] rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
			>
				<p class="leading-relaxed text-gray-700 italic dark:text-gray-300">
					{report.description || 'No description provided'}
				</p>
			</div>
		</div>

		<div class="border-t border-gray-100 pt-4 dark:border-gray-700">
			<Button color="alternative" class="w-full" href={getResourceLink()} target="_blank">
				View Reported {capitalize(reportType.replace('Reports', '').replace('post', 'Post'))}
			</Button>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex w-full flex-wrap justify-end gap-3">
			<Button
				color="alternative"
				size="sm"
				disabled={loading}
				onclick={() => handleAction('IN_REVIEW')}
			>
				In Review
			</Button>
			<Button color="red" size="sm" disabled={loading} onclick={() => handleAction('REJECTED')}>
				Reject Report
			</Button>
			<Button color="green" size="sm" disabled={loading} onclick={() => handleAction('ACCEPTED')}>
				Accept Report
			</Button>
		</div>
	{/snippet}
</Modal>
