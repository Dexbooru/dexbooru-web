<script lang="ts">
	import { REPORT_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { REPORT_REASON_CATEGORIES } from '$lib/shared/constants/reports';
	import { ReportReasonCategory } from '$lib/shared/types/reports';
	import { Button, Label, Modal, Select, Textarea } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let postId: string = $state('');
	let reportVerbalReason = $state('');
	let selectedReportReasonCategory: ReportReasonCategory | '' = $state('');

	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === REPORT_MODAL_NAME) {
			const { postId: focusedPostId } = data.modalData as { postId: string };
			postId = focusedPostId;
		}
	});

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
