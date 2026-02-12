<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import LabelContainer from '../../labels/LabelContainer.svelte';

	type Props = {
		post: TPost;
	};

	let { post }: Props = $props();
	const { tags, artists } = $derived(post);
</script>

<div class="mt-2 mb-5 ml-2 block space-y-2">
	<p class="text-base dark:text-white">Tags</p>
	<LabelContainer labelColor="red" labelType="tag" labels={tags} sliceLabels />

	<p class="text-base dark:text-white">Artists</p>
	<LabelContainer labelColor="green" labelType="artist" labels={artists} sliceLabels />
</div>
