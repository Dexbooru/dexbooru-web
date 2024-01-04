<script lang="ts">
	import { Button, Heading, Input, Label, Textarea } from 'flowbite-svelte';
	import PostPictureUpload from '../../../lib/client/components/files/PostPictureUpload.svelte';
	import LabelContainer from '../../../lib/client/components/labels/LabelContainer.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let tags: string[] = [];
	let artists: string[] = [];
	let tag: string = '';
	let artist: string = '';
	let description: string;

	const uploadTags: () => void = () => {
		if (tag.length && !tags.includes(tag)) {
			tags = [...tags, tag];
		}
		tag = '';
	};
	const uploadArtists: () => void = () => {
		if (artist.length && !artists.includes(artist)) {
			artists = [...artists, artist];
		}
		artist = '';
	};
</script>

<main class="flex flex-col justify-center items-center">
	<Heading class="mb-10 px-2.5 text-center">Upload a post!</Heading>
	<form method="POST" class="flex flex-col space-y-2 max-w-screen-md" enctype="multipart/form-data">
		<div id="description" class="mb-5 px-2.5">
			<Label>Please enter a description for your post (max 1000 characters)</Label>
			<Textarea
				maxlength="1000"
				rows="5"
				bind:value={description}
				name="description"
				placeholder="Enter a description"
				class="my-2.5"
			/>
		</div>

		<div id="tags" class="mb-5 px-2.5">
			<Label>Please enter one or more tags</Label>
			<Input
				bind:value={tag}
				type="text"
				placeholder="Enter a tag name"
				class="my-2.5"
				id="taginput"
			/>
			<LabelContainer labelColor="red" labelType="tag" labels={tags} />
			<Button outline type="button" pill on:click={uploadTags} class="my-2.5">Add tag</Button>
		</div>

		<div id="artists" class="mb-5 px-2.5">
			<Label>Please specify one or more artists</Label>
			<Input
				bind:value={artist}
				type="text"
				placeholder="Enter a artist name"
				class="my-2.5"
				id="artistinput"
			/>
			<LabelContainer labelColor="red" labelType="artist" labels={artists} />
			<Button outline type="button" pill on:click={uploadArtists} class="my-2.5">Add artist</Button>
		</div>

		<div id="photoupload" class="mb-20">
			<PostPictureUpload />
		</div>

		<!-- <input type="hidden" name="tags" value={JSON.stringify(tags)} />
		<input type="hidden" name="artists" value={JSON.stringify(artists)} /> -->

		<Button type="submit" class="m-2.5">Upload</Button>
	</form>
</main>
