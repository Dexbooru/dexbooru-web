<script lang="ts">
	import { createChatRoom } from '$lib/client/api/coreApi';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import type { TChatFriend } from '$lib/shared/types/friends';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button, Listgroup, ListgroupItem, Popover } from 'flowbite-svelte';

	export let friends: TChatFriend[] = [];

	const onChatRoomCreateClick = async (event: MouseEvent, recieverUserId: string) => {
		const target = event.target as HTMLButtonElement;
		target.disabled = true;
		const response = await createChatRoom(recieverUserId);

		if (response.ok) {
			toast.push('Chat room created successfully', SUCCESS_TOAST_OPTIONS);
			friends = friends.filter((friend) => friend.id !== recieverUserId);
		} else {
			console.log("hello world");
			toast.push('Failed to create chat room', FAILURE_TOAST_OPTIONS);
			target.disabled = false;
		}
	};
</script>

<Popover
	offset={10}
	class="texts-sm w-80 h-80 overflow-y-auto"
	title="Start a DM with a friend"
	triggeredBy="#new-chat-btn"
	trigger="click"
>
	<Listgroup>
		{#each friends as friend (friend.id)}
			<ListgroupItem class="text-base font-semibold gap-2 flex justify-between">
				<div class="flex space-x-2">
					<Avatar src={friend.profilePictureUrl} size="sm" />
					<h2 class="mt-1">{friend.username}</h2>
				</div>
				<Button
					on:click={(event) => onChatRoomCreateClick(event, friend.id)}
					size="sm"
					color="green">Start new chat</Button
				>
			</ListgroupItem>
		{/each}
	</Listgroup>
</Popover>
