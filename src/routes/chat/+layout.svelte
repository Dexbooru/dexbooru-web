<script lang="ts">
	import DirectMessageSidebar from '$lib/client/components/chat/DirectMessageSidebar.svelte';
	import { ChatManager } from '$lib/client/helpers/chat';
	import { chatStore } from '$lib/client/stores/chat';
	import type { TChatMessage } from '$lib/client/types/core';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children?: import('svelte').Snippet;
	};

	let { data, children }: Props = $props();

	const { friends, chatRooms } = data;
	chatStore.set({
		friends,
		rooms: chatRooms,
		manager: new ChatManager(),
		messages: new Map<string, TChatMessage[]>(),
	});

	const recomputeChatContainerSize = () => {
		const appNavbar = document.getElementById('app-navbar');
		const appFooter = document.getElementById('app-footer');
		const chatContainer = document.getElementById('chat-container');

		if (appNavbar && appFooter && chatContainer) {
			chatContainer.style.height = `calc(100vh - ${
				appNavbar.clientHeight + appFooter.clientHeight
			}px)`;
		}
	};

	onMount(() => {
		const { manager } = get(chatStore);
		manager?.registerIntervals();
		manager?.registerListeners();

		recomputeChatContainerSize();
		window.addEventListener('resize', recomputeChatContainerSize);

		return () => {
			window.removeEventListener('resize', recomputeChatContainerSize);
			manager?.cleanup();
		};
	});
</script>

<div id="chat-container" class="flex">
	<DirectMessageSidebar />
	{@render children?.()}
</div>

<style>
	#chat-container {
		opacity: 1;
		transition: opacity 250ms;
	}
</style>
