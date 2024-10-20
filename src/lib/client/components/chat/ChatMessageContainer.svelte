<script lang="ts">
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import { chatStore } from '$lib/client/stores/chat';
	import type { TChatMessage } from '$lib/client/types/core';
	import { onDestroy } from 'svelte';

	export let roomId: string | null = null;

	let messages: TChatMessage[] = [];
	$: {
		const currentMessages = $chatStore.messages.get(roomId ?? '') ?? [];
		messages = currentMessages;
	}

	const user = getAuthenticatedUser();

	const chatStoreUnsubsribe = chatStore.subscribe((data) => {
		if (!roomId) return;

		const currentMessages = data.messages.get(roomId) ?? [];
		messages = currentMessages;
	});

	onDestroy(() => {
		chatStoreUnsubsribe();
	});
</script>

<div
	id="messages-container"
	class="w-full p-6 space-y-4 overflow-y-auto {roomId === null ? 'grid place-items-center' : ''}"
>
	{#if roomId === null}
		<p class="text-center text-xl text-gray-300">Open a chat to start messaging</p>
	{:else}
		{#each messages as message (message.id)}
			{#if message.senderId === $user?.id}
				<div class="flex justify-end">
					<div class="bg-blue-500 text-white p-4 rounded-lg shadow-md">
						<p class="text-sm">{message.content}</p>
					</div>
				</div>
			{:else}
				<div class="flex justify-start">
					<div class="bg-white p-4 rounded-lg shadow-md">
						<p class="text-sm">{message.content}</p>
					</div>
				</div>
			{/if}
		{/each}
	{/if}
</div>
