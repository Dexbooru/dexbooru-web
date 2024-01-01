<script lang="ts">
	import { formatDate, getFormalDateTitle, ymdFormat } from '$lib/shared/helpers/dates';
	import type { IComment } from '$lib/shared/types/comments';
	import { Avatar, Button } from 'flowbite-svelte';
	import { MessagesSolid } from 'flowbite-svelte-icons';

	export let comment: IComment;
	export let onLoadRepliesClick: () => Promise<void>;
</script>

<article class="p-6 mt-2 mb-2 text-base bg-white rounded-lg dark:bg-gray-900">
	<h1 class="text-white">{comment.id}</h1>
	<div class="flex justify-between items-center mb-2">
		<div class="flex items-center">
			<p
				class="inline-flex space-x-2 items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold"
			>
				<Avatar
					src={comment.author.profilePictureUrl}
					alt={comment.authorId
						? `profile picture of ${comment.author.username}`
						: 'default user account'}
				/>
				<a href="/profile/{comment.author.username}">{comment.author.username}</a>
			</p>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				<time datetime={ymdFormat(comment.createdAt)} title={getFormalDateTitle(comment.createdAt)}
					>{formatDate(comment.createdAt)}</time
				>
			</p>
		</div>
	</div>

	<p class="text-gray-500 dark:text-gray-400">
		{comment.content}
	</p>

	<div class="flex items-center mt-4 space-x-3">
		<Button class="flex space-x-2" color="green">
			<MessagesSolid />
			<span>Reply</span>
		</Button>
		<Button on:click={onLoadRepliesClick} class="flex space-x-2" color="blue">
			<MessagesSolid />
			<span>Load replies</span>
		</Button>
	</div>
</article>
