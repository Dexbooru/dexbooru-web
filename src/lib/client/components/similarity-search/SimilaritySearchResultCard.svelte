<script lang="ts">
	import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { PostImageSimilarityResult } from '$lib/shared/types/postImageSimilarity';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Img from 'flowbite-svelte/Img.svelte';

	type Props = {
		result: PostImageSimilarityResult;
	};

	let { result }: Props = $props();

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;
		target.src = DefaultPostPicture;
	};

	const onAvatarError = (event: Event) => {
		const target = event.target as HTMLImageElement;
		target.src = DefaultProfilePicture;
	};
</script>

<Card class="w-full max-w-none overflow-hidden p-3 shadow-md sm:p-4 dark:bg-gray-800">
	<Img
		src={result.image_url}
		alt="Similar post {result.post_id}"
		onerror={onImageError}
		class="max-h-56 w-full object-contain sm:max-h-64"
	/>
	<p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
		Similarity score: <span class="font-medium text-gray-900 dark:text-gray-100"
			>{result.similarity_score.toFixed(2)}%</span
		>
	</p>
	<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
		Uploaded: <span class="font-medium text-gray-900 dark:text-gray-100"
			>{formatDate(new Date(result.createdAt))}</span
		>
	</p>
	<div class="mt-2 flex items-center gap-2">
		<Avatar
			size="sm"
			src={result.authorProfilePictureUrl ?? undefined}
			alt={result.authorUsername
				? `profile picture of ${result.authorUsername}`
				: 'default user account'}
			onerror={onAvatarError}
		/>
		{#if result.authorUsername}
			<a
				href="/profile/{result.authorUsername}"
				class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
			>
				{result.authorUsername}
			</a>
		{:else}
			<span class="text-sm text-gray-600 dark:text-gray-400">{DELETED_ACCOUNT_HEADING}</span>
		{/if}
	</div>
	<p class="mt-2">
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
