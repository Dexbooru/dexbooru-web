<script lang="ts">
	import { chatStore } from '$lib/client/stores/chat';
	import type { TChatFriend } from '$lib/shared/types/friends';
	import { Button, Input } from 'flowbite-svelte';
	import { PapperPlaneSolid } from 'flowbite-svelte-icons';
	import { get } from 'svelte/store';

	export let roomId: string;
	export let friend: TChatFriend;

	let content: string = '';

	const sendMessageViaSocket = (overridenContent: string | null = null) => {
		const { manager } = get(chatStore);
		const finalMessageContent = overridenContent ?? content;
		if (manager && finalMessageContent.length > 0) {
			manager.sendMessage(roomId, finalMessageContent);

			const chatInput = document.getElementById('chat-message-input') as HTMLInputElement;
			const messageContainer = document.getElementById('messages-container') as HTMLDivElement;
			if (chatInput) {
				chatInput.value = '';
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}
		}
	};

	const onChatInputKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			const target = event.target as HTMLInputElement;
			sendMessageViaSocket(target.value);
		}
	};

	const onSendMessageClick = () => {
		sendMessageViaSocket();
	};
</script>

<div
	class="absolute bottom-0 w-full p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
>
	<div class="flex space-x-4">
		<Input
			id="chat-message-input"
			bind:value={content}
			on:keydown={onChatInputKeydown}
			class="resize-none"
			placeholder="Send a message to {friend.username}"
		/>
		<Button on:click={onSendMessageClick} color="primary">
			<PapperPlaneSolid class="rotate-90" />
		</Button>
	</div>
</div>
