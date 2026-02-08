<script lang="ts">
	import { updatePostModerationStatus } from '$lib/client/api/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';

	type Props = {
		post: TPost;
		open: boolean;
	};

	let { post, open = $bindable() }: Props = $props();
	let loading = $state(false);
	let imageUrls = $derived<string[]>(post.imageUrls.slice(0, 1));

	const moderationData = getModerationPaginationData();

	const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
		loading = true;
		try {
			const response = await updatePostModerationStatus(post.id, status);
			if (response.ok) {
				toast.push(`Post ${capitalize(status.toLowerCase())} successfully`, SUCCESS_TOAST_OPTIONS);

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
		} catch {
			toast.push('An unexpected error occurred', FAILURE_TOAST_OPTIONS);
		} finally {
			loading = false;
		}
	};
</script>

<Modal title="Inspect Post" bind:open size="xl" outsideclose>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="space-y-4">
			<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
				{#if imageUrls.length > 0}
					{#each imageUrls as imageUrl (imageUrl)}
						<img src={imageUrl} alt={post.description} class="mb-2 h-auto w-full last:mb-0" />
					{/each}
				{:else}
					<div class="flex h-64 w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
						<span class="text-gray-500 dark:text-gray-400">No image available</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-6">
			<div>
				<h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">
					{post.description || 'No description'}
				</h3>
				<div class="flex flex-wrap gap-2">
					<Badge color={post.isNsfw ? 'red' : 'green'}>{post.isNsfw ? 'NSFW' : 'SFW'}</Badge>
					<Badge color="blue">{capitalize(post.moderationStatus)}</Badge>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span class="block font-medium text-gray-500 dark:text-gray-400">Author</span>
					<span class="text-gray-900 dark:text-white">{post.author?.username || 'Unknown'}</span>
				</div>
				<div>
					<span class="block font-medium text-gray-500 dark:text-gray-400">Created At</span>
					<span class="text-gray-900 dark:text-white">{formatDate(new Date(post.createdAt))}</span>
				</div>
			</div>

			{#if post.sourceLink}
				<div>
					<span class="mb-1 block font-medium text-gray-500 dark:text-gray-400">Source</span>
					<a
						href={post.sourceLink}
						target="_blank"
						class="text-primary-600 text-sm break-all hover:underline"
					>
						{post.sourceLink}
					</a>
				</div>
			{/if}

			<div class="border-t border-gray-100 pt-4 dark:border-gray-700">
				<Button color="alternative" class="w-full" href="/posts/{post.id}" target="_blank">
					View Post Page
				</Button>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex w-full justify-end gap-3">
			<Button color="red" disabled={loading} onclick={() => handleAction('REJECTED')}>
				Reject Post
			</Button>
			<Button color="green" disabled={loading} onclick={() => handleAction('APPROVED')}>
				Approve Post
			</Button>
		</div>
	{/snippet}
</Modal>
