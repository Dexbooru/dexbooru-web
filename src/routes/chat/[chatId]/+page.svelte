<script lang="ts">
	import ChatInput from "$lib/client/components/chat/ChatInput.svelte";
	import ChatMessageContainer from "$lib/client/components/chat/ChatMessageContainer.svelte";

    
</script>

<main class="col-span-9 flex flex-col bg-gray-600">
    <ChatMessageContainer />
    <ChatInput />
</main>