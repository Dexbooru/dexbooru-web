<script lang="ts">
	import type { PostImageSimilarityResult } from '$lib/shared/types/postImageSimilarity';
	import Card from 'flowbite-svelte/Card.svelte';
	import Img from 'flowbite-svelte/Img.svelte';

	type Props = {
		result: PostImageSimilarityResult;
	};

	let { result }: Props = $props();
</script>

<Card class="overflow-hidden p-4 shadow-md dark:bg-gray-800">
	<Img
		src={result.image_url}
		alt="Similar post {result.post_id}"
		class="max-h-64 w-full object-contain"
	/>
	<p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
		Similarity score: <span class="font-medium text-gray-900 dark:text-gray-100"
			>{result.similarity_score.toFixed(2)}%</span
		>
	</p>
	<p class="mt-1">
		<a
			href="/posts/{result.post_id}"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
		>
			View post
		</a>
	</p>
</Card>
