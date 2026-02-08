<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import ClockOutline from 'flowbite-svelte-icons/ClockOutline.svelte';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import {
		IMAGE_FILTER_EXCLUSION_BASE_URLS,
		PREVIEW_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import PostModerationModal from './PostModerationModal.svelte';

	type Props = {
		post: TPost;
	};

	let { post }: Props = $props();

	let isModalOpen = $state(false);

	const previewImageUrl = $derived(
		post.imageUrls.find((url) => {
			if (IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusion) => url.includes(exclusion))) {
				return true;
			}
			return url.endsWith(PREVIEW_IMAGE_SUFFIX);
		}) || post.imageUrls[0],
	);

	const statusColors = {
		PENDING: 'yellow',
		APPROVED: 'green',
		REJECTED: 'red',
	} as const;

	const currentStatusColor = $derived(statusColors[post.moderationStatus]);
</script>

<Card
	class="flex h-full w-full max-w-none flex-col overflow-hidden p-0 shadow-md transition-shadow duration-200 hover:shadow-lg"
>
	<div class="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
		<img src={previewImageUrl} alt={post.description} class="h-full w-full object-cover" />
		<div class="absolute top-2 left-2">
			<Badge color={currentStatusColor} class="px-2.5 py-0.5">
				{capitalize(post.moderationStatus)}
			</Badge>
		</div>
		{#if post.isNsfw}
			<div class="absolute top-2 right-2">
				<Badge color="red" class="px-2.5 py-0.5">NSFW</Badge>
			</div>
		{/if}
	</div>

	<div class="flex grow flex-col p-4">
		<h3 class="mb-2 line-clamp-1 text-lg font-bold text-gray-900 dark:text-white">
			{post.description || 'No description'}
		</h3>

		<div class="grow space-y-2">
			<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
				<ClockOutline class="h-4 w-4" />
				<span>{formatDate(new Date(post.createdAt))}</span>
			</div>
			<div class="text-sm text-gray-600 dark:text-gray-300">
				<span class="font-semibold">Author:</span>
				{post.author?.username || 'Unknown'}
			</div>
		</div>

		<div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
			<Button
				size="sm"
				class="flex w-full items-center justify-center gap-2"
				color="alternative"
				onclick={() => (isModalOpen = true)}
			>
				<SearchOutline class="h-4 w-4" />
				Inspect Post
			</Button>
		</div>
	</div>
</Card>

{#if isModalOpen}
	<PostModerationModal bind:open={isModalOpen} {post} />
{/if}
