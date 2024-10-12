<script lang="ts">
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION } from '$lib/shared/constants/images';
	import {
		MAXIMUM_ARTIST_LENGTH,
		MAXIMUM_ARTISTS_PER_POST,
		MAXIMUM_TAG_LENGTH,
		MAXIMUM_TAGS_PER_POST,
		SEPERATOR_CHARACTER_UI,
	} from '$lib/shared/constants/labels';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { isLabelAppropriate, transformLabel } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Checkbox, Heading, Input, Label, Li, List, Textarea } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/posts/upload/$types';
	import PostPictureUpload from '../files/PostPictureUpload.svelte';
	import LabelContainer from '../labels/LabelContainer.svelte';

	export let form: ActionData;

	let isNsfw: boolean = false;
	let tags: string[] = form?.tags || [];
	let artists: string[] = form?.artists || [];
	let tag: string = '';
	let artist: string = '';
	let description: string = form?.description || '';
	let uploadButtonDisabled = true;
	let postImages: {
		imageBase64: string;
		file: File;
	}[] = [];
	let loadingPostPictures = false;

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

	const removeLabel = (event: Event, labelType: 'tag' | 'artist') => {
		const target = event.target as Element;
		const badgeDiv = target.closest('div');

		if (badgeDiv) {
			const removalLabel = badgeDiv.textContent?.split(' ')[0];
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

	$: {
		const isValidForm =
			!loadingPostPictures &&
			isLabelAppropriate(description, 'description') &&
			tags.length > 0 &&
			artists.length > 0 &&
			postImages.length > 0 &&
			!tags.some((tag) => !isLabelAppropriate(tag, 'tag')) &&
			!artists.some((artist) => !isLabelAppropriate(artist, 'artist')) &&
			!postImages.some(
				(postImage) => !isFileImage(postImage.file) || !isFileImageSmall(postImage.file),
			);
		uploadButtonDisabled = !isValidForm;
	}
</script>

<main class="flex flex-col justify-center items-center m-5">
	<Heading class="mb-5 px-2.5 text-center">Upload a post!</Heading>
	<form
		id="upload-form"
		method="POST"
		class="flex flex-col space-y-2 max-w-2xl"
		enctype="multipart/form-data"
	>
		<section class="space-y-2">
			<Label class="mb-1" for="description-textarea">
				Please enter a description for your post (max {MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION} characters)
			</Label>
			<Textarea
				id="description-textarea"
				maxlength={MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
				rows="5"
				bind:value={description}
				name="description"
				placeholder="Enter a description"
				required
			/>
			<p class="leading-none dark:text-gray-400 text-right mt-2">
				{description.length}/{MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
			</p>

			<List class="dark:text-gray-400" list="disc">
				{#each SEPERATOR_CHARACTER_UI as message}
					<Li>{message}</Li>
				{/each}
			</List>

			<Label for="tag-input"
				>Please specify one or more tags (max of {MAXIMUM_TAGS_PER_POST}):</Label
			>
			<div class="flex gap-2 mt-2">
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
				<Button
					disabled={tags.length === MAXIMUM_TAGS_PER_POST}
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

			<Label for="artist-input"
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
				<Button
					disabled={artists.length === MAXIMUM_ARTISTS_PER_POST}
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

			<PostPictureUpload bind:loadingPictures={loadingPostPictures} bind:images={postImages} />

			<Checkbox bind:checked={isNsfw}>Mark post as NSFW?</Checkbox>
			<Input type="hidden" name="isNsfw" value={isNsfw} />
		</section>

		<Button disabled={uploadButtonDisabled} color="green" type="submit" class="!mt-5"
			>Upload post</Button
		>
	</form>
</main>
