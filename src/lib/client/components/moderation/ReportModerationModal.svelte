<script lang="ts">
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { updateReportStatus } from '$lib/client/api/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import { capitalize } from '$lib/shared/helpers/util';
	import { formatDate } from '$lib/shared/helpers/dates';

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
		} catch (error) {
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
		<div class="flex justify-between items-start">
			<div>
				<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
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
				<span class="block text-gray-500 dark:text-gray-400 font-medium">Created At</span>
				<span class="text-gray-900 dark:text-white">{formatDate(new Date(report.createdAt))}</span>
			</div>
			<div>
				<span class="block text-gray-500 dark:text-gray-400 font-medium">Report Type</span>
				<span class="text-gray-900 dark:text-white"
					>{capitalize(reportType.replace('Reports', ''))}</span
				>
			</div>
		</div>

		<div>
			<span class="block text-gray-500 dark:text-gray-400 font-medium mb-2">Description</span>
			<div
				class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 min-h-[100px]"
			>
				<p class="italic text-gray-700 dark:text-gray-300 leading-relaxed">
					{report.description || 'No description provided'}
				</p>
			</div>
		</div>

		<div class="pt-4 border-t border-gray-100 dark:border-gray-700">
			<Button color="alternative" class="w-full" href={getResourceLink()} target="_blank">
				View Reported {capitalize(reportType.replace('Reports', '').replace('post', 'Post'))}
			</Button>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex flex-wrap gap-3 w-full justify-end">
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
