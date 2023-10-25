<script lang="ts">
	import LabelContainer from '../labels/LabelContainer.svelte';
	import PostAuthorDetails from './PostAuthorDetails.svelte';

	export let tags: { name: string }[];
	export let artists: { name: string }[];
	export let author: { id: string; username: string; profilePictureUrl: string } | null;
	export let createdAt: Date;
</script>

<div class="block space-y-2 ml-2 mt-2 mb-5">
	<p class="text-base dark:text-white">Tags</p>
	<LabelContainer labelColor="red" labels={tags} />

	<p class="text-base dark:text-white">Artists</p>
	<LabelContainer labelColor="green" labels={artists} />

	<PostAuthorDetails {author} {createdAt} />
</div>
