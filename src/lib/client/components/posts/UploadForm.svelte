<script lang="ts">
	import { enhance } from '$app/forms';
	import { getEstimatedPostRating } from '$lib/client/api/mlApi';
	import DescriptionSection from '$lib/client/components/posts/upload/DescriptionSection.svelte';
	import LabelSection from '$lib/client/components/posts/upload/LabelSection.svelte';
	import RatingEstimate from '$lib/client/components/posts/upload/RatingEstimate.svelte';
	import SourceLinkSection from '$lib/client/components/posts/upload/SourceLinkSection.svelte';
	import UploadStatusModal from '$lib/client/components/posts/upload/UploadStatusModal.svelte';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { isLabelAppropriate } from '$lib/shared/helpers/labels';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Heading from 'flowbite-svelte/Heading.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import { onDestroy, onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/posts/upload/$types';
	import PostPictureUpload from '../files/PostPictureUpload.svelte';

	type Props = {
		form: ActionData;
	};

	type TEstimatedPostRating = 's' | 'q' | 'e';

	let { form }: Props = $props();

	let isNsfw: boolean = $state(false);
	let tags: string[] = $state(form?.tags || []);
	let artists: string[] = $state(form?.artists || []);
	let description: string = $state(form?.description || '');
	let sourceLink: string = $state(form?.sourceLink || '');
	let postImages: {
		imageBase64: string;
		file: File;
	}[] = $state([]);
	let loadingPostPictures = $state(false);
	let loading = $state(false);
	let statusMessage = $state('Uploading post... Please wait.');
	let eventSource: EventSource | null = null;

	let uploadButtonDisabled = $derived.by(() => {
		const isValidForm =
			!loadingPostPictures &&
			description.length > 0 &&
			sourceLink.length > 0 &&
			isLabelAppropriate(description, 'postDescription') &&
			tags.length > 0 &&
			artists.length > 0 &&
			postImages.length > 0 &&
			!tags.some((tag) => !isLabelAppropriate(tag, 'tag')) &&
			!artists.some((artist) => !isLabelAppropriate(artist, 'artist')) &&
			!postImages.some(
				(postImage) => !isFileImage(postImage.file) || !isFileImageSmall(postImage.file, 'post')
			);
		return !isValidForm;
	});

	let estimatedPostRating: Promise<TEstimatedPostRating | null> = $derived.by(async () => {
		if (tags.length === 0) {
			return null;
		}

		const response = await getEstimatedPostRating(tags);
		if (response.ok) {
			const data = await response.json();
			return data.predicted_rating as TEstimatedPostRating;
		}

		return null;
	});

	const handleSubmit: SubmitFunction = ({ formData }) => {
		loading = true;
		statusMessage = 'Uploading post... Please wait.';

		const uploadId = crypto.randomUUID();
		formData.append('uploadId', uploadId);

		formData.delete('postPictures');
		postImages.forEach(({ file }) => {
			formData.append('postPictures', file);
		});

		eventSource = new EventSource(`/api/events/upload-status/${uploadId}`);
		eventSource.onmessage = (event) => {
			statusMessage = event.data;
		};
		eventSource.onerror = () => {
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};

		return async ({ result, update }) => {
			loading = false;
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}

			if (result.type === 'failure') {
				const reason = result.data?.reason as string | undefined;
				if (reason) {
					toast.push(reason, FAILURE_TOAST_OPTIONS);
				}
			}
			await update();
		};
	};

	onMount(() => {
		if (form?.reason) {
			toast.push(form.reason, FAILURE_TOAST_OPTIONS);
		}
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});
</script>

<main class="flex justify-center px-4 sm:px-6 lg:px-8">
	<Card size="lg" class="mt-3 mb-3 p-6 shadow-lg w-full max-w-3xl space-y-2">
		<Heading class="mb-5 mt-2 text-center ">Upload a post!</Heading>
		<form
			id="upload-form"
			method="POST"
			class="flex flex-col justify-center"
			enctype="multipart/form-data"
			use:enhance={handleSubmit}
		>
			<section class="space-y-2">
				<DescriptionSection bind:description />

				<LabelSection bind:labels={tags} type="tag" />

				<LabelSection bind:labels={artists} type="artist" />

				<SourceLinkSection bind:sourceLink />

				<PostPictureUpload bind:loadingPictures={loadingPostPictures} bind:images={postImages} />

				<Checkbox class="" bind:checked={isNsfw}>Mark post as NSFW?</Checkbox>
				<Input type="hidden" name="isNsfw" value={isNsfw.toString()} />

				<RatingEstimate {estimatedPostRating} />
			</section>

			<Button disabled={uploadButtonDisabled} color="green" type="submit" class="!mt-5"
				>Upload post</Button
			>
		</form>
	</Card>

	<UploadStatusModal bind:open={loading} {statusMessage} />
</main>