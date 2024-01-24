<script lang="ts">
	import UserProfileCard from '$lib/client/components/auth/UserProfileCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { targetUser, viewingSelf } = data;
</script>

<svelte:head>
	<title>Profile - {targetUser.username}</title>
</svelte:head>

<main class="grid place-items-center mt-24">
	<UserProfileCard {targetUser} {viewingSelf} />
</main>
