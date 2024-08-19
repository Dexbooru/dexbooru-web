<script lang="ts">
	import DirectMessageSidebar from '$lib/client/components/chat/DirectMessageSidebar.svelte';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const { friends } = data;

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
		recomputeChatContainerSize();
		window.addEventListener('resize', recomputeChatContainerSize);

		return () => {
			window.removeEventListener('resize', recomputeChatContainerSize);
		};
	});
</script>

<div id="chat-container" class="flex flex-wrap">
	<DirectMessageSidebar {friends} />
	<slot />
</div>
