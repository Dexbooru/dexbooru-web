<script lang="ts">
	import UserProfileCard from '$lib/client/components/auth/UserProfileCard.svelte';
	import type { TFriendStatus } from '$lib/shared/types/friends';
	import type { IUser } from '$lib/shared/types/users';
	import type { PageData } from './$types';

	export let data: PageData;

	let targetUser: IUser;
	let friendStatus: TFriendStatus;

	$: {
		targetUser = data.targetUser;
		friendStatus = data.friendStatus;
	}
</script>

<svelte:head>
	<title>Profile - {targetUser.username}</title>
</svelte:head>

<main class="grid place-items-center mt-24">
	<UserProfileCard {targetUser} {friendStatus} />
</main>
