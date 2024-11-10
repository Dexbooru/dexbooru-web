<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { FILE_IMAGE_ACCEPT } from '$lib/shared/constants/images';
	import type { TPostImageSimilarityResult } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Alert, Button, Fileupload, ImagePlaceholder, Input, Label } from 'flowbite-svelte';

	let postId = $state('');
	let imageUrl = $state('');
	let imageFile = $state('');
	let similaritySearchButtonDisabled = $derived.by(() => {
		return postId.length === 0 && imageUrl.length === 0 && imageFile.length === 0;
	});
	let similarityResults: TPostImageSimilarityResult[] = $state([]);
	let resultsLoading = $state(false);

	const onImageFileChange = async (event: Event) => {
		imageFile = '';

		const target = event.target as HTMLInputElement;
		if (target.files) {
			const file = target.files[0];
			const conversionResult = await fileToBase64String(file);
			if (conversionResult) {
				imageFile = conversionResult;
			}
		}
	};
</script>

<svelte:head>
	<title>Similarity Search - Find Similar Posts by Image</title>
	<meta
		name="description"
		content="Search for similar posts by uploading an image or entering a post ID or image URL. Enhance your search experience with our advanced similarity search tool."
	/>
	<meta
		name="keywords"
		content="similarity search, image search, post ID search, find similar posts, image URL search"
	/>
</svelte:head>

<main class="m-2 p-2">
	<h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200">Post Similarity Search</h1>
	<p class="text-gray-600 dark:text-gray-400">
		Use the form below to find posts similar to an image by entering a post ID, image URL, or
		uploading an image.
	</p>

	<form
		method="POST"
		enctype="multipart/form-data"
		use:enhance={({ formData }) => {
			const postId = formData.get('postId');
			const imageUrl = formData.get('imageUrl');
			const imageFile = formData.get('imageFile');

			if (postId === '') {
				formData.delete('postId');
			}
			if (imageUrl === '') {
				formData.delete('imageUrl');
			}
			if (imageFile === '') {
				formData.delete('imageFile');
			}

			resultsLoading = true;
			similarityResults = [];

			return async ({ result }) => {
				resultsLoading = false;

				if (result.type === 'success') {
					if (result.data) {
						const data = result.data.results as TPostImageSimilarityResult[];
						similarityResults = data;
					}
				} else if (result.type === 'failure') {
					toast.push(
						'An unexpected error occured while fetching similar posts',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		class="max-w-md bg-white dark:bg-gray-800 rounded-lg space-y-4 mt-5"
	>
		<div class="mb-6 space-y-1">
			<Label for="post-id-similarity-search" class="dark:text-gray-200">Post ID</Label>
			<Input
				name="postId"
				bind:value={postId}
				type="text"
				id="post-id-similarity-search"
				placeholder="Enter post ID"
				size="md"
				class="w-full dark:text-gray-200 dark:placeholder-gray-400 dark:bg-gray-700"
			/>
		</div>

		<div class="mb-6 space-y-1">
			<Label for="image-url-similarity-search" class="dark:text-gray-200">Image URL</Label>
			<Input
				name="imageUrl"
				bind:value={imageUrl}
				type="text"
				id="image-url-similarity-search"
				placeholder="Enter image URL"
				size="md"
				class="w-full dark:text-gray-200 dark:placeholder-gray-400 dark:bg-gray-700"
			/>
		</div>

		<div class="mb-6 space-y-1">
			<Label for="image-file" class="dark:text-gray-200">Upload Image</Label>
			<Fileupload
				on:change={onImageFileChange}
				id="image-file"
				accept={FILE_IMAGE_ACCEPT}
				class="w-full dark:text-gray-200 dark:placeholder-gray-400 dark:bg-gray-700"
			/>
			<Input name="imageFile" type="hidden" value={imageFile} />
		</div>

		<Button
			disabled={similaritySearchButtonDisabled || resultsLoading}
			type="submit"
			class="w-full dark:bg-blue-700 dark:hover:bg-blue-800">Find most similar posts</Button
		>
	</form>

	{#if similarityResults.length > 0}
		<Alert color="green">
			<span class="font-medium">Fetched {similarityResults.length} similar images!</span>
			They are ordered by their similarity distance, but may not all be relevant to your search.
		</Alert>
	{/if}

	<section
		class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ml-2 mr-2"
	>
		{#if resultsLoading}
			{#each Array(10) as _i}
				<ImagePlaceholder />
			{/each}
		{/if}

		{#if similarityResults.length > 0}
			{#each similarityResults as similarityResult}
				<div class="bg-white dark:bg-gray-800 rounded-lg p-4">
					<img
						src={similarityResult.image_url}
						alt="similarity post result for {similarityResult.post_id}"
						class="w-full object-contain"
					/>
					<p class="text-gray-600 dark:text-gray-400 mt-2">
						Similarity Distance: {similarityResult.distance}
					</p>
					<p class="text-gray-600 dark:text-gray-400">
						<a
							href="/posts/{similarityResult.post_id}"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-500 dark:text-blue-400"
						>
							View Post
						</a>
					</p>
				</div>
			{/each}
		{/if}
	</section>
</main>
