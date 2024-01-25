<script lang="ts">
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION } from '$lib/shared/constants/images';
	import { transformLabel } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Heading, Input, Label, Textarea } from 'flowbite-svelte';
	import PostPictureUpload from '../../../lib/client/components/files/PostPictureUpload.svelte';
	import LabelContainer from '../../../lib/client/components/labels/LabelContainer.svelte';

	let tags: string[] = [];
	let artists: string[] = [];
	let tag: string = '';
	let artist: string = '';
	let description: string = '';

	const addTag = () => {
		if (!tag.length) {
			toast.push('The tag cannot be empty!', FAILURE_TOAST_OPTIONS);
			return;
		}

		const transformedTag = transformLabel(tag);

		if (tags.includes(transformedTag)) {
			toast.push(
				`A tag called ${transformedTag} was previously added already!`,
				FAILURE_TOAST_OPTIONS
			);
			return;
		}

		tags.push(transformedTag);
		tags = Array.from(new Set(tags));
		tag = '';
	};

	const addArtist = () => {
		if (!artist.length) {
			toast.push('The artist cannot be empty!', FAILURE_TOAST_OPTIONS);
			return;
		}

		const transformedArtist = transformLabel(artist);

		if (artists.includes(transformedArtist)) {
			toast.push(
				`An artist called ${transformedArtist} was previously added already!`,
				FAILURE_TOAST_OPTIONS
			);
			return;
		}

		artists.push(transformedArtist);
		artists = Array.from(new Set(artists));
		artist = '';
	};
</script>

<svelte:head>
	<title>Upload a post</title>
</svelte:head>

<main class="flex flex-col justify-center items-center mt-5 mb-5">
	<Heading class="mb-10 px-2.5 text-center">Upload a post!</Heading>
	<form method="POST" class="flex flex-col space-y-2 max-w-screen-md" enctype="multipart/form-data">
		<div id="description" class="mb-5 px-2.5">
			<Label
				>Please enter a description for your post (max {MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION} characters)</Label
			>
			<Textarea
				maxlength={MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
				rows="5"
				bind:value={description}
				name="description"
				placeholder="Enter a description"
				class="my-2.5 mb-0"
			/>
			<p class="leading-none dark:text-gray-400 text-right">
				{description.length} / {MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
			</p>
		</div>

		<div class="mb-5 px-2.5">
			<Label>Please enter one or more tags:</Label>
			<Input bind:value={tag} type="text" placeholder="Enter a tag name" class="my-2.5" />
			<Button type="button" on:click={addTag} class="my-2.5 w-full">Add tag</Button>
			<LabelContainer labelColor="red" labelType="tag" labels={tags} />
			<Input type="hidden" name="tags" value={tags.toString()} />
		</div>

		<div class="mb-5 px-2.5">
			<Label>Please specify one or more artists:</Label>
			<Input bind:value={artist} type="text" placeholder="Enter an artist name" class="my-2.5" />
			<Button type="button" on:click={addArtist} class="my-2.5 w-full">Add artist</Button>
			<LabelContainer labelColor="green" labelType="artist" labels={artists} />
			<Input type="hidden" name="artists" value={artists.toString()} />
		</div>

		<div class="mb-20">
			<PostPictureUpload />
		</div>

		<Button color="green" type="submit" class="m-2.5">Upload post</Button>
	</form>
</main>
