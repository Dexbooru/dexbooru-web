<script lang="ts">
	import { enhance } from '$app/forms';
	import { getEstimatedPostRating } from '$lib/client/api/mlApi';
	import { checkDuplicatePosts } from '$lib/client/api/posts';
	import DescriptionSection from '$lib/client/components/posts/upload/DescriptionSection.svelte';
	import LabelSection from '$lib/client/components/posts/upload/LabelSection.svelte';
	import RatingEstimate from '$lib/client/components/posts/upload/RatingEstimate.svelte';
	import SourceLinkSection from '$lib/client/components/posts/upload/SourceLinkSection.svelte';
	import UploadStatusModal from '$lib/client/components/posts/upload/UploadStatusModal.svelte';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { clearPostDraft, loadPostDraft, savePostDraft } from '$lib/client/helpers/drafts';
	import { calculateHash } from '$lib/client/helpers/hashing';
	import { filesToBase64Strings } from '$lib/client/helpers/images';
	import {
		MAXIMUM_IMAGES_PER_POST,
		MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	} from '$lib/shared/constants/images';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { isLabelAppropriate } from '$lib/shared/helpers/labels';
	import type { TPostDuplicate } from '$lib/shared/types/posts';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from '@zerodevx/svelte-toast';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Heading from 'flowbite-svelte/Heading.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import type { ActionData } from '../../../../routes/posts/upload/$types';
	import PostPictureUpload from '../files/PostPictureUpload.svelte';

	type Props = {
		form: ActionData;
	};

	type TEstimatedPostRating = 's' | 'q' | 'e';

	let { form }: Props = $props();

	let isNsfw = $state(false);
	let tags = $state<string[]>([]);
	let artists = $state<string[]>([]);
	let description = $state('');
	let sourceLink = $state('');
	let hasLoaded = $state(false);

	let postImages: {
		imageBase64: string;
		file: File;
	}[] = $state([]);
	let loadingPostPictures = $state(false);
	let loading = $state(false);
	let statusMessage = $state('Uploading post... Please wait.');
	let eventSource: EventSource | null = null;
	let duplicates = $state<TPostDuplicate[]>([]);
	let forceUpload = $state(false);

	$effect(() => {
		const check = async () => {
			if (postImages.length > 0) {
				const hashes = await Promise.all(postImages.map((img) => calculateHash(img.file)));
				const response = await checkDuplicatePosts(hashes);
				if (response.ok) {
					const data = await response.json();
					untrack(() => {
						duplicates = data.data.duplicatePosts;
					});
				}
			} else {
				untrack(() => {
					duplicates = [];
					forceUpload = false;
				});
			}
		};
		check();
	});

	$effect(() => {
		if (form) {
			untrack(() => {
				isNsfw = form.isNsfw ?? false;
				tags = form.tags || [];
				artists = form.artists || [];
				description = form.description || '';
				sourceLink = form.sourceLink || '';
			});
		}
	});

	$effect(() => {
		if (!hasLoaded) return;

		const currentDraft = { isNsfw, tags, artists, description, sourceLink };
		const isEmpty =
			!isNsfw &&
			tags.length === 0 &&
			artists.length === 0 &&
			description === '' &&
			sourceLink === '';

		if (isEmpty) {
			clearPostDraft();
		} else {
			savePostDraft(currentDraft);
		}
	});

	const hasDraft = $derived(
		isNsfw || tags.length > 0 || artists.length > 0 || description !== '' || sourceLink !== '',
	);

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
				(postImage) => !isFileImage(postImage.file) || !isFileImageSmall(postImage.file, 'post'),
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
		formData.append('ignoreDuplicates', forceUpload.toString());

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
				const serverDuplicates = result.data?.duplicatePosts as TPostDuplicate[] | undefined;

				if (serverDuplicates && serverDuplicates.length > 0) {
					duplicates = serverDuplicates;
					toast.push('Duplicates detected on server', FAILURE_TOAST_OPTIONS);
				} else if (reason) {
					toast.push(reason, FAILURE_TOAST_OPTIONS);
				}
			} else if (result.type === 'redirect') {
				clearPostDraft();
			}
			await update();
		};
	};

	onMount(() => {
		if (form) {
			isNsfw = form.isNsfw ?? false;
			tags = form.tags || [];
			artists = form.artists || [];
			description = form.description || '';
			sourceLink = form.sourceLink || '';
		} else {
			const draft = loadPostDraft();
			if (draft) {
				isNsfw = draft.isNsfw;
				tags = draft.tags;
				artists = draft.artists;
				description = draft.description;
				sourceLink = draft.sourceLink;
			}
		}
		hasLoaded = true;

		if (form?.reason) {
			toast.push(form.reason, FAILURE_TOAST_OPTIONS);
		}

		return () => {
			if (hasDraft) {
				toast.push('Post draft saved locally', SUCCESS_TOAST_OPTIONS);
			}
		};
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});

	const handleClearDraft = () => {
		clearPostDraft();
		isNsfw = false;
		tags = [];
		artists = [];
		description = '';
		sourceLink = '';
		postImages = [];
	};

	const handlePaste = async (event: ClipboardEvent) => {
		const items = event.clipboardData?.items;
		if (!items) return;

		const pastedFiles: File[] = [];
		for (let i = 0; i < items.length; i++) {
			if (items[i]?.type.startsWith('image/')) {
				const blob = items[i]?.getAsFile() ?? null;
				if (blob) {
					const file = new File(
						[blob],
						`pasted-image-${Date.now()}-${i}.${blob.type.split('/')[1]}`,
						{
							type: blob.type,
						},
					);
					pastedFiles.push(file);
				}
			}
		}

		if (pastedFiles.length === 0) return;

		const totalCount = postImages.length + pastedFiles.length;
		if (totalCount > MAXIMUM_IMAGES_PER_POST) {
			toast.push(
				`Cannot upload more than ${MAXIMUM_IMAGES_PER_POST} files per post`,
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		for (const file of pastedFiles) {
			if (file.size === 0) {
				toast.push('At least one of the files contained empty data', FAILURE_TOAST_OPTIONS);
				return;
			}

			if (!isFileImageSmall(file, 'post')) {
				toast.push(
					`At least one of the image files exceeded the maximum upload size of ${MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB} MB`,
					FAILURE_TOAST_OPTIONS,
				);
				return;
			}

			if (!isFileImage(file)) {
				toast.push(
					'At least one of the image files was not a proper image format',
					FAILURE_TOAST_OPTIONS,
				);
				return;
			}
		}

		loadingPostPictures = true;
		const { failedFiles, results } = await filesToBase64Strings(pastedFiles);
		if (failedFiles.length > 0) {
			toast.push(failedFiles.join(', '), FAILURE_TOAST_OPTIONS);
		} else {
			postImages = [...postImages, ...results];
		}
		loadingPostPictures = false;
	};
</script>

<main class="flex justify-center px-4 sm:px-6 lg:px-8" onpaste={handlePaste}>
	<Card size="lg" class="mt-3 mb-3 w-full max-w-3xl space-y-2 p-6 shadow-lg">
		<div class="flex items-center justify-between">
			<div class="w-1/4"></div>
			<Heading class="mt-2 mb-5 text-center">Upload a post!</Heading>
			<div class="flex w-1/4 justify-end">
				{#if hasDraft}
					<Button color="red" size="xs" onclick={handleClearDraft}>Clear Draft</Button>
				{/if}
			</div>
		</div>

		{#if duplicates.length > 0}
			<Alert color="red" class="mb-4">
				<div class="flex items-center gap-2">
					<ExclamationCircleSolid class="h-5 w-5" />
					<span class="font-medium"
						>{duplicates.length} potential duplicate post{duplicates.length > 1 ? 's' : ''} detected!</span
					>
				</div>
				<ul class="mt-2 ml-7 space-y-3">
					{#each duplicates as duplicate (duplicate.id)}
						<li class="flex items-center gap-3">
							{#if duplicate.imageUrls?.[0]}
								<img
									src={duplicate.imageUrls[0]}
									alt="Duplicate preview"
									class="h-12 w-12 rounded border border-yellow-300 object-cover"
								/>
							{/if}
							<a
								href="/posts/{duplicate.id}"
								target="_blank"
								class="hover:text-primary-600 text-sm underline"
							>
								{duplicate.description || `Post ID: ${duplicate.id.slice(0, 8)}`}
							</a>
						</li>
					{/each}
				</ul>
				<div class="mt-4 ml-7 text-gray-500 dark:text-gray-600">
					<Checkbox bind:checked={forceUpload}>I want to upload this anyway</Checkbox>
				</div>
			</Alert>
		{/if}

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

			<Button disabled={uploadButtonDisabled} color="green" type="submit" class="mt-5!"
				>Upload post</Button
			>
		</form>
	</Card>

	<UploadStatusModal bind:open={loading} {statusMessage} />
</main>
