<script lang="ts">
	import { formatDate } from '$lib/shared/helpers/dates';
	import { Avatar } from 'flowbite-svelte';

	export let author: { id: string; username: string; profilePictureUrl: string } | null;
	export let createdAt: Date;
	const {
		id: authorId = null,
		profilePictureUrl: authorProfilePictureUrl,
		username: authorUsername
	} = author || {};
</script>

<p class="text-base dark:text-white">Uploader</p>
<div class="space-x-2 flex align-middle flex-wrap">
	<a class="inline-flex align-middle space-x-2" href={authorId && `/profile/${authorId}`}>
		<Avatar
			src={authorProfilePictureUrl}
			alt={authorId ? `profile picture of ${authorUsername}` : 'default user account'}
		/>
		<p class="mt-2">{authorId ? authorUsername : '[deleted-user]'}</p>
	</a>
	<p class="text-md mt-2 dark:text-white">
		&#8226;
		<span class="leading-none text-sm dark:text-gray-400">{formatDate(createdAt)}</span>
	</p>
</div>
