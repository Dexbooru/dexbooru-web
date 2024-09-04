<script lang="ts">
	import { Button, Textarea } from 'flowbite-svelte';
</script>

<div
	class="absolute bottom-0 w-full p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
>
	<div class="flex space-x-4">
		<Textarea rows={1} class="resize-none" placeholder="Type a message..." />
		<Button color="primary">Send</Button>
	</div>
</div>
