<script lang="ts">
	import { Button } from "flowbite-svelte";
	import { Input } from "postcss";

    
</script>

<div class="p-4 bg-white border-t">
    <div class="flex space-x-4">
        <Input placeholder="Type a message..." class="flex-grow" />
        <Button color="primary">Send</Button>
    </div>
</div>