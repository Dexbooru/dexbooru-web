<script lang="ts">
	import { normalizeCount } from '$lib/client/helpers/posts';
	import type { IPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';
	import PostAuthorDetails from './PostCardAuthorDetails.svelte';

	export let post: IPost;
	export let tags: { name: string }[];
	export let artists: { name: string }[];
	export let author: { id: string; username: string; profilePictureUrl: string } | null;
	export let createdAt: Date;
</script>

<div class="block space-y-2 ml-2 mt-2 mb-5">
	<p class="text-base dark:text-white">Tags</p>
	<LabelContainer labelColor="red" labelType="tag" labels={tags} />

	<p class="text-base dark:text-white">Artists</p>
	<LabelContainer labelColor="green" labelType="artist" labels={artists} />

	<p class="text-base dark:text-white">Views</p>
	<h2>{normalizeCount(post.views)}</h2>

	<PostAuthorDetails {author} {createdAt} />
</div>
