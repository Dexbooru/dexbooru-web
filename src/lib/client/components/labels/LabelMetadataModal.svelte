<script lang="ts">
	import { page } from '$app/state';
	import type { Artist, Tag } from '$generated/prisma/browser';
	import { getLabelMetadata } from '$lib/client/api/labels';
	import { LABEL_METADATA_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { toast } from '@zerodevx/svelte-toast';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { onMount } from 'svelte';
	import LabelEditForm from './LabelEditForm.svelte';
	import LabelPresentation from './LabelPresentation.svelte';

	let labelType = $state<'tag' | 'artist'>();
	let labelName = $state<string>('');
	let loadingLabelMetadata = $state(false);
	let metadata = $state<Tag & Artist>();

	const activeModal = getActiveModal();
	const labelCache: Map<string, Tag & Artist> = new Map();

	const fetchLabelMetadata = async () => {
		if (!labelName || !labelType) return;
		if (labelCache.has(`${labelType}-${labelName}`)) {
			metadata = labelCache.get(`${labelType}-${labelName}`)!;
			return;
		}

		loadingLabelMetadata = true;

		const response = await getLabelMetadata(labelType, labelName);
		if (response.ok) {
			const responseData: TApiResponse<Tag & Artist> = await response.json();
			metadata = responseData.data;
			labelCache.set(`${labelType}-${labelName}`, metadata);
		} else {
			toast.push(
				`An unexpected error occured while fetching the ${labelType} metadata`,
				FAILURE_TOAST_OPTIONS,
			);
		}

		loadingLabelMetadata = false;
	};

	const activeModalUnsubscribe = activeModal.subscribe((modal) => {
		if (modal.focusedModalName === LABEL_METADATA_MODAL_NAME) {
			const modalData = modal.modalData as { labelType: 'tag' | 'artist' };
			labelType = modalData.labelType;
			labelName = page.params.name ?? '';
			fetchLabelMetadata();
		}
	});

	onMount(() => {
		return () => {
			activeModalUnsubscribe();
		};
	});
</script>

<Modal
	title="Metadata for the {labelType} called: {labelName}"
	open={$activeModal.isOpen && $activeModal.focusedModalName === LABEL_METADATA_MODAL_NAME}
	onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
>
	{#if loadingLabelMetadata}
		<Spinner class="ml-auto mr-auto block" size="10" />
	{/if}

	<Tabs style="underline">
		<TabItem open title="Details">
			<LabelPresentation {labelType} {metadata} />
		</TabItem>
		<TabItem title="Edit">
			<LabelEditForm
				{labelType}
				{metadata}
				updateMetadata={(updatedMetadata) => {
					metadata = updatedMetadata;
					labelCache.set(`${labelType}-${labelName}`, metadata);
				}}
			/>
		</TabItem>
	</Tabs>
</Modal>
