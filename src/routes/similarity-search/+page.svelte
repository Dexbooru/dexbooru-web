<script lang="ts">
	import { enhance } from '$app/forms';
	import SimilaritySearchFormFields from '$lib/client/components/similarity-search/SimilaritySearchFormFields.svelte';
	import SimilaritySearchHeader from '$lib/client/components/similarity-search/SimilaritySearchHeader.svelte';
	import SimilaritySearchResultsSection from '$lib/client/components/similarity-search/SimilaritySearchResultsSection.svelte';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { fileToBase64String } from '$lib/client/helpers/images';
	import type { PostImageSimilarityResult } from '$lib/shared/types/postImageSimilarity';
	import { isFileImage } from '$lib/shared/helpers/images';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';

	let postId = $state('');
	let imageUrl = $state('');
	let imageFile = $state('');
	let similarityDescription = $state('');

	let similarityResults = $state<PostImageSimilarityResult[]>([]);
	let resultsLoading = $state(false);
	let showNoResults = $state(false);

	const similaritySearchButtonDisabled = $derived.by(() => {
		return postId.length === 0 && imageUrl.length === 0 && imageFile.length === 0;
	});

	const resetFileUploadState = (target: HTMLInputElement) => {
		target.value = '';
		imageFile = '';
	};

	const onImageFileChange = async (event: Event) => {
		imageFile = '';

		const target = event.target as HTMLInputElement;
		if (target.files) {
			const file = target.files[0];
			if (!file) {
				resetFileUploadState(target);
				return;
			}

			if (!isFileImage(file)) {
				toast.push('The selected file is not a supported image type.', FAILURE_TOAST_OPTIONS);
				resetFileUploadState(target);
				return;
			}

			const conversionResult = await fileToBase64String(file);
			if (!conversionResult) {
				toast.push('Could not read the image file.', FAILURE_TOAST_OPTIONS);
				resetFileUploadState(target);
				return;
			}

			imageFile = conversionResult;
		}
	};

	function extractFailureMessage(data: unknown): string {
		if (data && typeof data === 'object' && 'message' in data) {
			const m = (data as { message: unknown }).message;
			if (typeof m === 'string' && m.trim()) {
				return m;
			}
		}
		return 'Something went wrong while searching for similar posts.';
	}
</script>

<main class="m-2 w-1/2 p-2">
	<SimilaritySearchHeader />

	<Card class="mt-2 max-w-md space-y-4 p-6 shadow-lg dark:bg-gray-800">
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				if (formData.get('postId') === '') {
					formData.delete('postId');
				}
				if (formData.get('imageUrl') === '') {
					formData.delete('imageUrl');
				}
				if (formData.get('imageFile') === '') {
					formData.delete('imageFile');
				}
				const desc = formData.get('similarityDescription');
				if (desc === '' || desc === null) {
					formData.delete('similarityDescription');
				}

				resultsLoading = true;
				similarityResults = [];
				showNoResults = false;

				return async ({ result }) => {
					resultsLoading = false;

					if (result.type === 'success' && result.data) {
						const data = result.data as { results?: PostImageSimilarityResult[] };
						similarityResults = data.results ?? [];
						showNoResults = similarityResults.length === 0;
					} else if (result.type === 'failure') {
						similarityResults = [];
						showNoResults = false;
						toast.push(extractFailureMessage(result.data), FAILURE_TOAST_OPTIONS);
					}
				};
			}}
			class="flex flex-col gap-4"
		>
			<SimilaritySearchFormFields
				bind:postId
				bind:imageUrl
				bind:imageFile
				bind:similarityDescription
				{onImageFileChange}
			/>

			<Button
				disabled={similaritySearchButtonDisabled || resultsLoading}
				type="submit"
				class="w-full dark:bg-blue-700 dark:hover:bg-blue-800"
			>
				Find most similar posts
			</Button>
		</form>
	</Card>

	<SimilaritySearchResultsSection
		loading={resultsLoading}
		results={similarityResults}
		{showNoResults}
	/>
</main>
