<script lang="ts">
	import { createPostReport } from '$lib/client/api/postReports';
	import { REPORT_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import {
		MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH,
		REPORT_REASON_CATEGORIES,
	} from '$lib/shared/constants/reports';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { PostReportCategory } from '@prisma/client';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Label, Modal, Select, Textarea } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let postId: string = $state('');
	let reportVerbalReason = $state('');
	let selectedReportReasonCategory: PostReportCategory | '' = $state('');
	let reportSending = $state(false);

	const activeModal = getActiveModal();

	const normalizePostReportReasonName = (reasonCategory: PostReportCategory) => {
		return capitalize(reasonCategory).replace('_', ' ');
	};

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === REPORT_MODAL_NAME) {
			const { postId: focusedPostId } = data.modalData as { postId: string };
			postId = focusedPostId;
		}
	});

	const sendReport = async () => {
		if (selectedReportReasonCategory === '') {
			toast.push(
				'Please select a category in order to send the post report',
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		reportSending = true;

		const response = await createPostReport(
			postId,
			selectedReportReasonCategory,
			reportVerbalReason,
		);
		if (response.ok) {
			toast.push('The post was reported successfully!', SUCCESS_TOAST_OPTIONS);
			activeModal.set({ isOpen: false, focusedModalName: null });
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
	open={$activeModal.isOpen && $activeModal.focusedModalName === REPORT_MODAL_NAME}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
	title="Report this post anonymously!"
>
	<Label class="space-y-2">
		<span>Report category</span>
		<Select
			placeholder="Pick a category..."
			bind:value={selectedReportReasonCategory}
			items={REPORT_REASON_CATEGORIES.map((category) => {
				return {
					name: normalizePostReportReasonName(category),
					value: category,
				};
			})}
		/>
	</Label>
	<Label class="space-y-2">
		<span
			>Additional report description (max of {MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH} characters)</span
		>
		<Textarea
			rows="4"
			placeholder="Enter a brief description/reason for this report in order to give more context to us"
			bind:value={reportVerbalReason}
			maxlength={MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH}
		/>
	</Label>
	<Button
		disabled={reportSending || selectedReportReasonCategory === ''}
		on:click={sendReport}
		class="w-full"
		color="red">Report this post</Button
	>
</Modal>
