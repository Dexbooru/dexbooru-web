<script lang="ts">
	import { SIDEBAR_WIDTH_STORAGE_KEY } from '$lib/client/helpers/chat';
	import type { TChatRoom } from '$lib/client/types/core';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TChatFriend } from '$lib/shared/types/friends';
	import { Avatar, Button } from 'flowbite-svelte';
	import { PlusSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import CreateChatRoomContainer from './CreateChatRoomContainer.svelte';

	export let friends: TChatFriend[] = [];
	export let chatRooms: TChatRoom[] = [];

	const filteredFriends = friends.filter(
		(friend) => !chatRooms.some((chatRoom) => chatRoom.participants.includes(friend.id))
	);
	const processedRooms = chatRooms.map((chatRoom) => {
		const friend = friends.find((friend) => chatRoom.participants.includes(friend.id));
		return { ...friend, ...chatRoom, friendId: friend?.id, chatRoomId: chatRoom.id };
	});

	const persistSidebarWidth = (sidebarElement: HTMLElement | null) => {
		if (sidebarElement) {
			localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, sidebarElement.style.width);
		}
	};

	onMount(() => {
		const directMessagesSidebar = document.getElementById('direct-messages-sidebar');
		const mouseListener = () => {
			persistSidebarWidth(directMessagesSidebar);
		};

		if (directMessagesSidebar) {
			directMessagesSidebar.style.width = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY) || '25%';
			directMessagesSidebar.style.opacity = '1.0';
			directMessagesSidebar.addEventListener('mouseup', mouseListener);
		}

		return () => {
			if (directMessagesSidebar) {
				directMessagesSidebar.removeEventListener('mouseup', mouseListener);
			}
		};
	});
</script>

<aside
	id="direct-messages-sidebar"
	class="col-span-3 bg-white dark:bg-gray-800 text-black dark:text-white p-4 shadow-xl"
>
	<section class="flex justify-between mb-4">
		<h2 class="text-xl font-bold">Direct Messages</h2>
		<Button id="new-chat-btn" size="sm" color="green">
			<PlusSolid />
		</Button>
		<CreateChatRoomContainer friends={filteredFriends} />
	</section>
	<hr class="border-gray-300 dark:border-gray-700 mt-2 mb-2" />
	<ul class="space-y-4">
		{#each processedRooms as chatRoom (chatRoom.chatRoomId)}
			<a
				href="/chat/{chatRoom.chatRoomId}"
				class="flex flex-wrap justify-between items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
			>
				<div class="flex items-center space-x-3">
					<Avatar
						src={chatRoom.profilePictureUrl}
						alt={chatRoom.username}
						size="md"
					/>
					<h3>{chatRoom.username}</h3>
				</div>

				<span class="text-sm text-gray-500 dark:text-gray-400">
					{formatDate(new Date(chatRoom?.createdAt))}
				</span>
			</a>
		{/each}
	</ul>
</aside>

<style>
	aside {
		opacity: 0;
		resize: horizontal;
		overflow: auto;
		height: 100%;
		width: 25%;
		min-width: 250px;
		max-width: 35%;
		-ms-overflow-style: none; /* Internet Explorer 10+ */
		scrollbar-width: none; /* Firefox */
		transition: opacity 250ms;
	}
</style>
