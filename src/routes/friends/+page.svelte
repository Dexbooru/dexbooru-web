<script lang="ts">
	import FriendTabs from '$lib/client/components/friends/FriendTabs.svelte';
	import { getFriendData } from '$lib/client/helpers/context';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const friendData = getFriendData();

	$effect(() => {
		friendData.set({
			friends: data.friends,
			sentFriendRequests: data.sentFriendRequests,
			receivedFriendRequests: data.receivedFriendRequests,
		});
	});
</script>

<svelte:head>
	<title>Your Friends</title>
</svelte:head>

<main>
	<h1 class="text-4xl m-4 dark:text-white">Friendships</h1>
	<FriendTabs />
</main>
