<script lang="ts">
	import { PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
</script>

<div class="flex space-x-3 justify-center">
	<PaginationItem large class="flex items-center">
		<ArrowLeftSolid class="mr-2 w-5 h-5" />
		Previous
	</PaginationItem>
	<PaginationItem large class="flex items-center">
		Next
		<ArrowRightSolid class="ml-2 w-5 h-5" />
	</PaginationItem>
</div>
