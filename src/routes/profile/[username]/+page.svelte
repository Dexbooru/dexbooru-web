<script lang="ts">
	import type { LinkedUserAccount } from '$generated/prisma/browser';
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import UserProfileCard from '$lib/client/components/auth/UserProfileCard.svelte';
	import type { TFriendStatus } from '$lib/shared/types/friends';
	import type { TUser, TUserStatistics } from '$lib/shared/types/users';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let targetUser: TUser = $derived(data.targetUser);
	let friendStatus: TFriendStatus = $derived(data.friendStatus);
	let userStatistics: TUserStatistics = $derived(data.userStatistics);
	let linkedAccounts: LinkedUserAccount[] = $derived(data.linkedAccounts);
</script>

<svelte:head>
	<title>Profile - {targetUser.username}</title>
	<meta property="og:title" content="Profile of {targetUser.username} on Dexbooru" />
	<meta
		property="og:description"
		content="Check out {targetUser.username}'s profile on Dexbooru. Explore their posts, collections and linked accounts"
	/>
	<meta property="og:image" content={targetUser.profilePictureUrl ?? DefaultProfilePicture} />
	<meta property="profile:username" content={targetUser.username} />
</svelte:head>

<main class="grid place-items-center mt-5 mb-5">
	<UserProfileCard {targetUser} {friendStatus} {userStatistics} {linkedAccounts} />
</main>
