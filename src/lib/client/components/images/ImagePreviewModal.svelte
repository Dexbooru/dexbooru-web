<script lang="ts">
	import { IMAGE_PREVIEW_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { Modal } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let imageBase64: string = $state('');
	let imageFile: File = $state(new File([], ''));
	let imageAlt = $state('');

	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === IMAGE_PREVIEW_MODAL_NAME) {
			const { imageBase64: incomingImageBase64, imageFile: incomingImageFile } = data.modalData as {
				imageBase64: string;
				imageFile: File;
			};
			imageBase64 = incomingImageBase64;
			imageFile = incomingImageFile;
			imageAlt = `${incomingImageFile.name}-${Date.now()}`;
		}
	});

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	title="Full image preview of {imageFile && imageFile.name}"
	autoclose
	outsideclose
	open={$activeModal.isOpen && $activeModal.focusedModalName === IMAGE_PREVIEW_MODAL_NAME}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
>
	<img src={imageBase64} alt={imageAlt} />
</Modal>
