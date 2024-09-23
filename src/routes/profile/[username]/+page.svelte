<script lang="ts">
	import UserProfileCard from '$lib/client/components/auth/UserProfileCard.svelte';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore
	} from '$lib/client/stores/posts';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import type { TFriendStatus } from '$lib/shared/types/friends';
	import type { IUser } from '$lib/shared/types/users';
	import type { PageData } from './$types';

	export let data: PageData;

	let targetUser: IUser;
	let friendStatus: TFriendStatus;

	$: {
		targetUser = data.targetUser;
		friendStatus = data.friendStatus;
		postPaginationStore.set(data);
		postsPageStore.set(data.posts);
		originalPostsPageStore.set(data.posts);
	}
</script>

<svelte:head>
	<title>Profile - {targetUser.username}</title>
	<meta property="og:title" content="Profile of {targetUser.username} on Dexbooru" />
	<meta
		property="og:description"
		content="Check out {targetUser.username}'s profile on Dexbooru. Explore their posts, friends, and more!"
	/>
	<meta property="og:image" content={targetUser.profilePictureUrl} />
	<meta property="profile:username" content={targetUser.username} />
</svelte:head>

<main class="grid place-items-center mt-24">
	<UserProfileCard {targetUser} {friendStatus} />
	{#if !$authenticatedUserStore || $authenticatedUserStore.id !== targetUser.id}
		<PostWrapper overrideTitle={false} postsSection="Posts created by {targetUser.username}" />
	{/if}
</main>
