<script lang="ts">
	import { normalizeCount } from '$lib/client/helpers/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';
	import PostAuthorDetails from './PostCardAuthorDetails.svelte';

	interface Props {
		post: TPost;
		tags: { name: string }[];
		artists: { name: string }[];
		author: { id: string; username: string; profilePictureUrl: string } | null;
		createdAt: Date;
	}

	let {
		post,
		tags,
		artists,
		author,
		createdAt
	}: Props = $props();
</script>

<div class="block space-y-2 ml-2 mt-2 mb-5">
	<p class="text-base dark:text-white cursor-text">Tags</p>
	<LabelContainer labelColor="red" labelType="tag" labels={tags} />

	<p class="text-base dark:text-white cursor-text">Artists</p>
	<LabelContainer labelColor="green" labelType="artist" labels={artists} />

	<p class="text-base dark:text-white cursor-text">Views</p>
	<h2 class="cursor-text">{normalizeCount(post.views)}</h2>

	<p class="text-base dark:text-white cursor-text">Comment count</p>
	<h2 class="cursor-text">{normalizeCount(post.commentCount)}</h2>

	<PostAuthorDetails {author} {createdAt} />
</div>
