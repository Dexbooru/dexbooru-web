<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import { updatePostModerationStatus } from '$lib/client/api/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import { capitalize } from '$lib/shared/helpers/util';
	import { formatDate } from '$lib/shared/helpers/dates';

	type Props = {
		post: TPost;
		open: boolean;
	};

	let { post, open = $bindable() }: Props = $props();
	let loading = $state(false);

	const moderationData = getModerationPaginationData();

	const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
		loading = true;
		try {
			const response = await updatePostModerationStatus(post.id, status);
			if (response.ok) {
				toast.push(`Post ${capitalize(status.toLowerCase())} successfully`, SUCCESS_TOAST_OPTIONS);

				// Update local store to remove the post from pending list
				moderationData.update((data) => {
					if (!data) return null;
					return {
						...data,
						pendingPosts: data.pendingPosts.filter((p) => p.id !== post.id),
					};
				});
				open = false;
			} else {
				toast.push('Failed to update post status', FAILURE_TOAST_OPTIONS);
			}
		} catch (error) {
			toast.push('An unexpected error occurred', FAILURE_TOAST_OPTIONS);
		} finally {
			loading = false;
		}
	};
</script>

<Modal title="Inspect Post" bind:open size="xl" outsideclose>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="space-y-4">
			<div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
				{#each post.imageUrls as imageUrl (imageUrl)}
					<img src={imageUrl} alt={post.description} class="w-full h-auto mb-2 last:mb-0" />
				{/each}
			</div>
		</div>

		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
					{post.description || 'No description'}
				</h3>
				<div class="flex flex-wrap gap-2">
					<Badge color={post.isNsfw ? 'red' : 'green'}>{post.isNsfw ? 'NSFW' : 'SFW'}</Badge>
					<Badge color="blue">{capitalize(post.moderationStatus)}</Badge>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span class="block text-gray-500 dark:text-gray-400 font-medium">Author</span>
					<span class="text-gray-900 dark:text-white">{post.author?.username || 'Unknown'}</span>
				</div>
				<div>
					<span class="block text-gray-500 dark:text-gray-400 font-medium">Created At</span>
					<span class="text-gray-900 dark:text-white">{formatDate(new Date(post.createdAt))}</span>
				</div>
			</div>

			{#if post.sourceLink}
				<div>
					<span class="block text-gray-500 dark:text-gray-400 font-medium mb-1">Source</span>
					<a
						href={post.sourceLink}
						target="_blank"
						class="text-primary-600 hover:underline text-sm break-all"
					>
						{post.sourceLink}
					</a>
				</div>
			{/if}

			<div class="pt-4 border-t border-gray-100 dark:border-gray-700">
				<Button color="alternative" class="w-full" href="/posts/{post.id}" target="_blank">
					View Post Page
				</Button>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3 w-full">
			<Button color="red" disabled={loading} onclick={() => handleAction('REJECTED')}>
				Reject Post
			</Button>
			<Button color="green" disabled={loading} onclick={() => handleAction('APPROVED')}>
				Approve Post
			</Button>
		</div>
	{/snippet}
</Modal>
