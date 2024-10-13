<script lang="ts">
	import { IMAGE_PREVIEW_MODAL_NAME } from '$lib/client/constants/layout';
	import { modalStore } from '$lib/client/stores/layout';
	import { Modal } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	let imageBase64: string;
	let imageFile: File;
	let imageAlt = '';

	const modalStoreUnsubscribe = modalStore.subscribe((data) => {
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

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	title="Full image preview of {imageFile && imageFile.name}"
	autoclose
	outsideclose
	open={$modalStore.isOpen && $modalStore.focusedModalName === IMAGE_PREVIEW_MODAL_NAME}
	on:close={() => modalStore.set({ isOpen: false, focusedModalName: null })}
>
	<img src={imageBase64} alt={imageAlt} />
</Modal>
