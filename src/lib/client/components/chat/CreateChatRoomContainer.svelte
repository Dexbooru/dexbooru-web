<script lang="ts">
	import { createChatRoom } from '$lib/client/api/coreApi';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { chatStore } from '$lib/client/stores/chat';
	import type { ICoreApiResponse, TChatRoom } from '$lib/client/types/core';
	import type { TChatFriend } from '$lib/shared/types/friends';
	import { toast } from '@zerodevx/svelte-toast';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Listgroup from 'flowbite-svelte/Listgroup.svelte';
	import ListgroupItem from 'flowbite-svelte/ListgroupItem.svelte';
	import Popover from 'flowbite-svelte/Popover.svelte';

	type Props = {
		friends?: TChatFriend[];
	};

	let { friends = $bindable([]) }: Props = $props();

	const onChatRoomCreateClick = async (event: MouseEvent, recieverUserId: string) => {
		const target = event.target as HTMLButtonElement;
		target.disabled = true;
		const response = await createChatRoom(recieverUserId);

		if (response.ok) {
			toast.push('Chat room created successfully', SUCCESS_TOAST_OPTIONS);
			friends = friends.filter((friend) => friend.id !== recieverUserId);

			const responseData: ICoreApiResponse<TChatRoom> = await response.json();
			const { data: newRoom } = responseData;

			chatStore.update((data) => {
				if (!newRoom) return data;

				return {
					...data,
					rooms: [...data.rooms, newRoom],
				};
			});
		} else {
			toast.push('Failed to create chat room', FAILURE_TOAST_OPTIONS);
			target.disabled = false;
		}
	};
</script>

<Popover
	offset={10}
	class="texts-sm w-80 h-80 overflow-y-auto z-50"
	title="Start a DM with a friend"
	triggeredBy="#new-chat-btn"
	trigger="click"
>
	{#if friends.length === 0}
		<h1 class="text-center text-2xl">:((</h1>
		<p class="text-center mt-3">No friends to create a chat room for currently!</p>
	{:else}
		<Listgroup>
			{#each friends as friend (friend.id)}
				<ListgroupItem class="text-base font-semibold gap-2 flex justify-between">
					<div class="flex space-x-2">
						<Avatar src={friend.profilePictureUrl} size="sm" />
						<h2 class="mt-1">{friend.username}</h2>
					</div>
					<Button
						onclick={(event) => onChatRoomCreateClick(event, friend.id)}
						size="sm"
						color="green">Start new chat</Button
					>
				</ListgroupItem>
			{/each}
		</Listgroup>
	{/if}
</Popover>
