<script lang="ts">
	import {
		PostCollectionReportCategory,
		UserReportCategory,
		type PostReportCategory,
	} from '$generated/prisma/browser';
	import { REPORT_MODAL_CONFIG } from '$lib/client/constants/reports';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { normalizeReportReasonName } from '$lib/client/helpers/reports';
	import {
		MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH,
		REPORT_POST_COLLECTION_REASON_CATEGORIES,
		REPORT_POST_REASON_CATEGORIES,
		REPORT_USER_REASON_CATEGORIES,
	} from '$lib/shared/constants/reports';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import type { TPost } from '$lib/shared/types/posts';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Select from 'flowbite-svelte/Select.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';

	type Props = {
		reportType: 'post' | 'collection' | 'user';
	};

	let { reportType }: Props = $props();

	let entityId = $state('');
	let reportVerbalReason = $state('');
	let selectedReportReasonCategory = $state<
		PostReportCategory | PostCollectionReportCategory | UserReportCategory | ''
	>('');
	let reportSending = $state(false);

	const activeModal = getActiveModal();

	const { modalName, reportCategories, apiFunction } = REPORT_MODAL_CONFIG[reportType];

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === modalName) {
			if (reportType === 'post') {
				entityId = (data.modalData as { post: TPost }).post.id;
			} else if (reportType === 'collection') {
				entityId = (data.modalData as { collection: TPostCollection }).collection.id;
			} else if (reportType === 'user') {
				entityId = (data.modalData as { user: TUser }).user.username;
			}
		}
	});

	const resetStates = () => {
		entityId = '';
		reportVerbalReason = '';
		selectedReportReasonCategory = '';
	};

	const handleModalClose = () => {
		resetStates();
		activeModal.set({ isOpen: false, focusedModalName: null });
	};

	const sendReport = async () => {
		if (selectedReportReasonCategory === '') {
			toast.push(`Please select a category to report this ${reportType}`, FAILURE_TOAST_OPTIONS);
			return;
		}

		reportSending = true;

		if (
			(reportType === 'post' &&
				!REPORT_POST_REASON_CATEGORIES.includes(
					selectedReportReasonCategory as PostReportCategory,
				)) ||
			(reportType === 'collection' &&
				!REPORT_POST_COLLECTION_REASON_CATEGORIES.includes(
					selectedReportReasonCategory as PostCollectionReportCategory,
				)) ||
			(reportType === 'user' &&
				!REPORT_USER_REASON_CATEGORIES.includes(selectedReportReasonCategory as UserReportCategory))
		) {
			toast.push('Invalid report category.', FAILURE_TOAST_OPTIONS);
			reportSending = false;
			return;
		}

		// @ts-expect-error - dynamic function call based on report type
		const response = await apiFunction(entityId, selectedReportReasonCategory, reportVerbalReason);
		if (response.ok) {
			toast.push(`The ${reportType} was reported successfully!`, SUCCESS_TOAST_OPTIONS);
			handleModalClose();
		} else {
			toast.push(
				'An error occurred while sending the report. Please try again later',
				FAILURE_TOAST_OPTIONS,
			);
		}

		reportSending = false;
	};

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	open={$activeModal.isOpen && $activeModal.focusedModalName === modalName}
	onclose={handleModalClose}
	size="xs"
	outsideclose
	class="w-full"
	title={`Report this ${reportType}!`}
>
	<Label class="space-y-2">
		<span>Report category</span>
		<Select
			placeholder="Pick a category..."
			bind:value={selectedReportReasonCategory}
			items={reportCategories.map((category) => ({
				name: normalizeReportReasonName(category),
				value: category,
			}))}
		/>
	</Label>
	<Label class="space-y-2">
		<span
			>Additional report description (max of {MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH} characters)</span
		>
		<Textarea
			class="w-full"
			rows={4}
			placeholder="Enter a brief description to provide more context"
			bind:value={reportVerbalReason}
			maxlength={MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH}
		/>
	</Label>
	<Button
		disabled={reportSending || selectedReportReasonCategory === ''}
		onclick={sendReport}
		class="w-full"
		color="red">Report this {reportType}</Button
	>
</Modal>
