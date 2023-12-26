<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let tags: string[] = [];
	let artists: string[] = [];
	let tag: string;
	let artist: string;
	let description: string;
</script>

<h1>upload</h1>
<h1>{form && form.reason}</h1>

<form method="POST" class="flex flex-col space-y-2" enctype="multipart/form-data">
	<label for="description">Description</label>
	<textarea bind:value={description} name="description" placeholder="Enter a description" />

	<input bind:value={tag} type="text" placeholder="Enter a tag name" />
	<button type="button" on:click={() => (tags = [...tags, tag])}>Add tag</button>

	<input bind:value={artist} type="text" placeholder="Enter a artist name" />
	<button type="button" on:click={() => (artists = [...artists, artist])}>Add artist</button>

	<input type="file" name="postImageFiles" accept="image/*" multiple />

	<input type="hidden" name="tags" value={JSON.stringify(tags)} />
	<input type="hidden" name="artists" value={JSON.stringify(artists)} />

	<button type="submit">Upload</button>
</form>
