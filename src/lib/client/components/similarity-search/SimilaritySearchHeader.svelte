<script lang="ts">
	type Props = {
		title?: string;
		description?: string;
	};

	let {
		title = 'Post Similarity Search',
		description = 'Find posts similar to an image using a post ID, image URL, or file upload. Optional description text is passed to the ML service for context.',
	}: Props = $props();
</script>

<svelte:head>
	<title>Similarity Search - Find Similar Posts by Image</title>
	<meta
		name="description"
		content="Search for similar posts by uploading an image or entering a post ID or image URL."
	/>
	<meta
		name="keywords"
		content="similarity search, image search, post ID search, find similar posts, image URL search"
	/>
</svelte:head>

<div class="mb-4 sm:mb-6">
	<h1 class="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-gray-200">{title}</h1>
	<p class="mt-2 text-sm text-gray-600 sm:text-base dark:text-gray-400">
		{description}
	</p>
</div>
