<script lang="ts">
	import ChatInput from '$lib/client/components/chat/ChatInput.svelte';
	import ChatMessageContainer from '$lib/client/components/chat/ChatMessageContainer.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let { friend, roomId } = data;

	$: {
		friend = data.friend;
		roomId = data.roomId;
	}
</script>

<svelte:head>
	<title>Chatting with {friend.username}</title>
</svelte:head>

<section class="w-full h-full relative flex flex-col dark:bg-gray-700">
	<ChatMessageContainer {roomId} />
	<ChatInput {roomId} {friend} />
</section>
