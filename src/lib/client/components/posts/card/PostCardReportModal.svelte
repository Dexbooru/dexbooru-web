<script lang="ts">
	import { REPORT_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { REPORT_REASON_CATEGORIES } from '$lib/shared/constants/reports';
	import type { ReportReasonCategory } from '$lib/shared/types/reports';
	import { Button, Label, Modal, Select, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	let postId: string;
	let reportVerbalReason = '';
	let selectedReportReasonCategory: ReportReasonCategory;

	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === REPORT_MODAL_NAME) {
			const { postId: focusedPostId } = data.modalData as { postId: string };
			postId = focusedPostId;
		}
	});

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	open={$activeModal.isOpen && $activeModal.focusedModalName === REPORT_MODAL_NAME}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
		Report this post anonymously!
		{postId}
	</h3>

	<Label class="space-y-2">
		<span>Report category</span>
		<Select
			placeholder="Pick a category..."
			bind:value={selectedReportReasonCategory}
			items={REPORT_REASON_CATEGORIES.map((category) => {
				return {
					name: category,
					value: category,
				};
			})}
		/>
	</Label>
	<Label class="space-y-2">
		<span>Additional report description</span>
		<Textarea
			rows="4"
			placeholder="Enter a brief description/reason for this report in order to give more context to us"
			bind:value={reportVerbalReason}
		/>
	</Label>
	<Button class="w-full" color="red">Report this post</Button>
</Modal>
