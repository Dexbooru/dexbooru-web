<script lang="ts">
	export let roomId: string | null = null;
</script>

<div class="w-full p-6 space-y-4 overflow-y-auto">
	{#if roomId === null}
		<p class="text-center text-gray-300">Open a chat to start messaging</p>
	{:else}
		<div class="flex justify-start">
			<div class="bg-white p-4 rounded-lg shadow-md">
				<p class="text-sm">Hello! How can I help you today?</p>
			</div>
		</div>
		<div class="flex justify-end">
			<div class="bg-blue-500 text-white p-4 rounded-lg shadow-md">
				<p class="text-sm">I have a question about my order.</p>
			</div>
		</div>
	{/if}
</div>
