<script lang="ts">
	import { SIDEBAR_WIDTH_STORAGE_KEY } from '$lib/client/helpers/chat';
	import type { TChatFriend } from '$lib/shared/types/friends';
	import { Button } from 'flowbite-svelte';
	import { PlusSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import CreateChatRoomContainer from './CreateChatRoomContainer.svelte';

	export let friends: TChatFriend[] = [];

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

<aside id="direct-messages-sidebar" class="col-span-3 bg-gray-800 text-white p-4 shadow-xl">
	<section class="flex justify-between mb-4">
		<h2 class="text-xl font-bold">Direct Messages</h2>
		<Button id="new-chat-btn" size="sm" color="green">
			<PlusSolid />
		</Button>
		<CreateChatRoomContainer {friends} />
	</section>
	<ul class="space-y-4">
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 1</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 2</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 3</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 1</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 2</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 3</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 1</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 2</li>
		<li class="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">Chat 3</li>
	</ul>
</aside>

<style>
	aside {
		opacity: 0.0;
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
