<script lang="ts">
	import { page } from '$app/state';
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';

	type Props = {
		report: PostReport | PostCollectionReport | UserReport;
		reportType: 'postReports' | 'postCollectionReports' | 'userReports';
	};

	let { report, reportType }: Props = $props();

	const RESOURCE_BUTTON_TEXT_MAP = {
		postReports: 'View Post',
		postCollectionReports: 'View Collection',
		userReports: 'View User Profile',
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
</script>

<Card>
	<p class="text-md font-semibold text-gray-800 dark:text-gray-200">ID: {report.id}</p>
	<p class="text-sm text-gray-500 dark:text-gray-400">
		Category: {capitalize(report.category.replaceAll('_', ' '))}
	</p>
	<p class="text-sm text-gray-500 dark:text-gray-400">
		Created At: {formatDate(new Date(report.createdAt))}
	</p>

	<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
		Description: {report.description && report.description.length > 0
			? report.description
			: 'No description provided'}
	</p>

	{#if !isOnResourceLink()}
		<Button href={getResourceLink()} class="w-fit">{RESOURCE_BUTTON_TEXT_MAP[reportType]}</Button>
	{/if}
</Card>
