<script lang="ts">
	import { getEstimatedPostRating } from '$lib/client/api/mlApi';
	import { ESTIMATED_TAG_RATING_LABEL_MAP } from '$lib/client/constants/labels';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		MAXIMUM_ARTIST_LENGTH,
		MAXIMUM_TAG_LENGTH,
		SEPERATOR_CHARACTER_UI,
	} from '$lib/shared/constants/labels';
	import {
		MAXIMUM_ARTISTS_PER_POST,
		MAXIMUM_POST_DESCRIPTION_LENGTH,
		MAXIMUM_SOURCE_LINK_LENGTH,
		MAXIMUM_TAGS_PER_POST,
	} from '$lib/shared/constants/posts';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { isLabelAppropriate, transformLabel } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import {
		Button,
		Checkbox,
		Heading,
		Input,
		Label,
		Li,
		List,
		Spinner,
		Textarea,
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/posts/upload/$types';
	import PostPictureUpload from '../files/PostPictureUpload.svelte';
	import LabelContainer from '../labels/LabelContainer.svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let isNsfw: boolean = $state(false);
	let tags: string[] = $state(form?.tags || []);
	let artists: string[] = $state(form?.artists || []);
	let tag: string = $state('');
	let artist: string = $state('');
	let description: string = $state(form?.description || '');
	let sourceLink: string = $state(form?.sourceLink || '');
	let postImages: {
		imageBase64: string;
		file: File;
	}[] = $state([]);
	let loadingPostPictures = $state(false);
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
	let estimatedPostRating: Promise<'s' | 'q' | 'e' | null> = $derived.by(async () => {
		if (tags.length === 0) {
			return null;
		}

		const response = await getEstimatedPostRating(tags);
		if (response.ok) {
			const data = await response.json();
			return data.predicted_rating as 's' | 'q' | 'e';
		}

		return null;
	});

	const addLabel = (labelType: 'tag' | 'artist') => {
		const label = labelType === 'tag' ? tag : artist;
		const labels = labelType === 'tag' ? tags : artists;

		if (labelType === 'tag' && labels.length === MAXIMUM_TAGS_PER_POST) {
			toast.push(
				'You have reached the maximum amount of tags a post can have',
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		if (labelType === 'artist' && labels.length === MAXIMUM_ARTISTS_PER_POST) {
			toast.push(
				'You have reached the maximum amount of artists a post can have',
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		if (label.length === 0) {
			toast.push(`The ${labelType} cannot be empty!`, FAILURE_TOAST_OPTIONS);
			return;
		}

		const transformedLabel = transformLabel(label);
		if (!isLabelAppropriate(transformedLabel, labelType)) {
			toast.push(`${transformedLabel} is not an allowed ${labelType}`, FAILURE_TOAST_OPTIONS);
			if (labelType === 'tag') {
				tag = '';
			} else {
				artist = '';
			}
			return;
		}

		if (labels.includes(transformedLabel)) {
			toast.push(
				`A ${labelType} called ${transformedLabel} was previously added already!`,
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}

		if (labelType === 'tag') {
			tags = [...new Set([...tags, transformedLabel])];
			tag = '';
		} else {
			artists = [...new Set([...artists, transformedLabel])];
			artist = '';
		}
	};

	const removeLabel = (
		event: CustomEvent<any> & { explicitOriginalTarget: Element },
		labelType: 'tag' | 'artist',
	) => {
		const target = event.explicitOriginalTarget as Element;
		const badgeDiv = target.closest('div');

		if (badgeDiv) {
			const removalLabel = badgeDiv.textContent?.split(' ')[0].trim() ?? '';
			if (labelType === 'tag') {
				tags = tags.filter((t) => t !== removalLabel);
			} else {
				artists = artists.filter((a) => a !== removalLabel);
			}
		}
	};

	const handleLabelKeypress = (event: KeyboardEvent, labelType: 'tag' | 'artist') => {
		const target = event.target as HTMLInputElement;

		if (event.key === 'Enter') {
			event.preventDefault();
			addLabel(labelType);
			target.value = '';
		}
	};

	onMount(() => {
		if (form?.reason) {
			toast.push(form.reason, FAILURE_TOAST_OPTIONS);
		}
	});
</script>

<main class="flex flex-col justify-center items-center m-5">
	<Heading class="mb-5 px-2.5 text-center ">Upload a post!</Heading>
	<form
		id="upload-form"
		method="POST"
		class="flex flex-col space-y-2 max-w-2xl"
		enctype="multipart/form-data"
	>
		<section class="space-y-2">
			<Label class="mb-1 " for="description-textarea">
				Please enter a description for your post (max {MAXIMUM_POST_DESCRIPTION_LENGTH} characters):
			</Label>
			<Textarea
				id="description-textarea"
				maxlength={MAXIMUM_POST_DESCRIPTION_LENGTH}
				rows="5"
				bind:value={description}
				name="description"
				placeholder="Enter a description"
				required
			/>
			<p class="leading-none dark:text-gray-400 text-right mt-2">
				{description.length}/{MAXIMUM_POST_DESCRIPTION_LENGTH}
			</p>

			<List class="dark:text-gray-400 " list="disc">
				{#each SEPERATOR_CHARACTER_UI as message}
					<Li>{message}</Li>
				{/each}
			</List>

			<Label class="" for="tag-input"
				>Please specify one or more tags (max of {MAXIMUM_TAGS_PER_POST}):</Label
			>
			<div class="flex gap-2 mt-2 justify-around">
				<Input
					id="tag-input"
					on:keypress={(event) => handleLabelKeypress(event, 'tag')}
					bind:value={tag}
					pattern="[a-z]*"
					maxlength={MAXIMUM_TAG_LENGTH}
					type="text"
					placeholder="Enter a tag name"
					class="flex-grow"
				/>
				<p class="leading-none dark:text-gray-400 text-right mt-2">
					{tag.length}/{MAXIMUM_TAG_LENGTH}
				</p>
				<Button
					disabled={tags.length === MAXIMUM_TAGS_PER_POST || tag.length === 0}
					type="button"
					on:click={() => addLabel('tag')}>Add</Button
				>
			</div>
			<div class="mt-2 max-h-32 overflow-y-auto">
				<LabelContainer
					handleLabelClose={(event) => removeLabel(event, 'tag')}
					labelIsDismissable
					labelIsLink={false}
					labelColor="red"
					labelType="tag"
					labels={tags}
				/>
			</div>
			<Input type="hidden" name="tags" value={tags.join(',')} />

			<Label class="" for="artist-input"
				>Please specify one or more artists (max of {MAXIMUM_ARTISTS_PER_POST}):</Label
			>
			<div class="flex gap-2 mt-2">
				<Input
					id="artist-input"
					on:keypress={(event) => handleLabelKeypress(event, 'artist')}
					bind:value={artist}
					pattern="[a-z]*"
					maxlength={MAXIMUM_ARTIST_LENGTH}
					type="text"
					placeholder="Enter an artist name"
					class="flex-grow"
				/>
				<p class="leading-none dark:text-gray-400 text-right mt-2">
					{artist.length}/{MAXIMUM_ARTIST_LENGTH}
				</p>
				<Button
					disabled={artists.length === MAXIMUM_ARTISTS_PER_POST || artist.length === 0}
					type="button"
					on:click={() => addLabel('artist')}>Add</Button
				>
			</div>
			<div class="mt-2 max-h-32 overflow-y-auto">
				<LabelContainer
					handleLabelClose={(event) => removeLabel(event, 'artist')}
					labelIsDismissable
					labelIsLink={false}
					labelColor="green"
					labelType="artist"
					labels={artists}
				/>
			</div>
			<Input type="hidden" name="artists" value={artists.join(',')} />

			<Label for="sourceLink">Specify the source url of the post:</Label>
			<Input
				placeholder="Enter the source url"
				type="url"
				required
				name="sourceLink"
				maxlength={MAXIMUM_SOURCE_LINK_LENGTH}
				bind:value={sourceLink}
			/>

			<PostPictureUpload bind:loadingPictures={loadingPostPictures} bind:images={postImages} />

			<Checkbox class="" bind:checked={isNsfw}>Mark post as NSFW?</Checkbox>
			<Input type="hidden" name="isNsfw" value={isNsfw} />
			{#await estimatedPostRating}
				<div class="flex items-center space-x-2">
					<Spinner />
				</div>
			{:then rating}
				<div class="flex items-center space-x-2 !mt-5">
					<span class="font-semibold text-gray-800 dark:text-gray-300">Estimated Rating:</span>
					{#if rating}
						<span class="text-sm text-gray-900 dark:text-gray-100"
							>{ESTIMATED_TAG_RATING_LABEL_MAP[rating]}</span
						>
					{:else}
						<span class="text-sm text-gray-500 dark:text-gray-400"
							>Will show here once tags are added</span
						>
					{/if}
				</div>

				{#if rating === 'q' || rating === 'e'}
					<div class="mt-2 p-3 bg-yellow-100 text-yellow-800 rounded-md">
						<strong>Recommendation:</strong> The provided tags are potentially rated as
						{#if rating === 'q'}
							{ESTIMATED_TAG_RATING_LABEL_MAP['q']}
						{:else}
							{ESTIMATED_TAG_RATING_LABEL_MAP['e']}
						{/if}. It is recommended to mark this post as NSFW.
					</div>
				{/if}
			{/await}
		</section>

		<Button disabled={uploadButtonDisabled} color="green" type="submit" class="!mt-5"
			>Upload post</Button
		>
	</form>
</main>
