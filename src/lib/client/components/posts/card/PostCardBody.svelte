<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';

	type Props = {
		post: TPost;
	};

	let { post }: Props = $props();
	const { tags, artists } = post;
</script>

<div class="block space-y-2 ml-2 mt-2 mb-5">
	<p class="text-base dark:text-white">Tags</p>
	<LabelContainer labelColor="red" labelType="tag" labels={tags} sliceLabels />

	<p class="text-base dark:text-white">Artists</p>
	<LabelContainer labelColor="green" labelType="artist" labels={artists} sliceLabels />
</div>
