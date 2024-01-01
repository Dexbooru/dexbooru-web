<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	export let placeholder: string;
	export let queryHandler: (query: string) => void;

	const onInput = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		queryHandler(inputTarget.value);
	};
</script>

<div class="hidden relative md:block mr-4 searchbar-container">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4" />
	</div>
	<Input on:input={onInput} class="ps-10" {placeholder} />
</div>

<style>
	.searchbar-container {
		width: 300px;
	}
</style>