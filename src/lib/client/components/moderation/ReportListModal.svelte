<script lang="ts">
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import {
		REPORT_MODAL_LIST_CONFIG,
		REPORT_TYPE_TO_MODAL_CONFIG_KEY,
	} from '$lib/client/constants/reports';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import type { TPost } from '$lib/shared/types/posts';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';
	import ReportCard from './ReportCard.svelte';

	type Props = {
		reportType: 'postReports' | 'postCollectionReports' | 'userReports';
	};

	let { reportType }: Props = $props();

	let entityId = $state('');
	let reports = $state<(PostReport | PostCollectionReport | UserReport)[]>([]);
	let reportsLoading = $state(false);

	const configKey = $derived(
		REPORT_TYPE_TO_MODAL_CONFIG_KEY[reportType] as keyof typeof REPORT_MODAL_LIST_CONFIG,
	);
	const { modalName, apiFunction } = $derived.by(() => REPORT_MODAL_LIST_CONFIG[configKey]);

	const resetStates = () => {
		entityId = '';
		reports = [];
	};

	const fetchReports = async () => {
		reportsLoading = true;

		const response = await apiFunction(entityId);
		if (response.ok) {
			if (reportType === 'userReports') {
				const responseData: TApiResponse<{ userReports: UserReport[] }> = await response.json();
				reports = responseData.data.userReports;
			} else if (reportType === 'postReports') {
				const responseData: TApiResponse<{ postReports: PostReport[] }> = await response.json();
				reports = responseData.data.postReports;
			} else if (reportType === 'postCollectionReports') {
				const responseData: TApiResponse<{ postCollectionReports: PostCollectionReport[] }> =
					await response.json();
				reports = responseData.data.postCollectionReports;
			}
		} else {
			toast.push('An unexpected error occured while fetching the reports', FAILURE_TOAST_OPTIONS);
		}

		reportsLoading = false;
	};

	const handleModalClose = () => {
		resetStates();
		activeModal.set({ isOpen: false, focusedModalName: null });
	};

	const activeModal = getActiveModal();

	const activeModalUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === modalName) {
			if (reportType === 'postReports') {
				const { post: focusedPost } = data.modalData as { post: TPost };
				entityId = focusedPost.id;
			} else if (reportType === 'postCollectionReports') {
				const { postCollection: focusedPostCollection } = data.modalData as {
					postCollection: TPostCollection;
				};
				entityId = focusedPostCollection.id;
			} else if (reportType === 'userReports') {
				const { user: focusedUser } = data.modalData as { user: TUser };
				entityId = focusedUser.username;
			}

			if (entityId.length > 0) {
				fetchReports();
			}
		}
	});

	onMount(() => {
		return () => {
			activeModalUnsubscribe();
		};
	});
</script>

<Modal
	size="lg"
	title="{capitalize(configKey)} reports for: {entityId}"
	outsideclose
	open={$activeModal.isOpen && $activeModal.focusedModalName === modalName}
	onclose={handleModalClose}
>
	{#if reportsLoading}
		<div class="flex h-32 items-center justify-center">
			<div class="spinner spinner-primary"></div>
		</div>
	{/if}

	{#if reports.length === 0 && !reportsLoading}
		<div class="flex h-32 items-center justify-center">
			<p class="text-center text-gray-500">No reports found</p>
		</div>
	{/if}

	<section class="flex flex-wrap">
		{#each reports as report (report.id)}
			<ReportCard {report} {reportType} />
		{/each}
	</section>
</Modal>
