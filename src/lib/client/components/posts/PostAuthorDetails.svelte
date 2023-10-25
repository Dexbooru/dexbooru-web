<script lang="ts">
	import { Avatar } from 'flowbite-svelte';
	import { formatPostDate } from '$lib/shared/helpers/dates';

	export let author: { id: string; username: string; profilePictureUrl: string } | null;
	export let createdAt: Date;
	const {
		id: authorId = null,
		profilePictureUrl: authorProfilePictureUrl,
		username: authorUsername
	} = author || {};
</script>

<p class="text-base dark:text-white">Uploader</p>
<div class="space-x-2 flex align-middle">
	<a class="inline-flex space-x-2" href={authorId && `/profile/${authorId}`}>
		<Avatar
			src={authorProfilePictureUrl}
			alt={authorId ? `profile picture of ${authorUsername}` : 'default user account'}
		/>
		<p class="text-md mt-2 dark:text-white">
			{authorId ? authorUsername : '[deleted-user]'}
			&#8226;
			<span class="leading-none text-sm dark:text-gray-400">{formatPostDate(createdAt)}</span>
		</p>
	</a>
</div>
