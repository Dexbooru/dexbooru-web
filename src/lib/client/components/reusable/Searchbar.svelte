<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	export let inputElementId: string | null = null;
	export let width: string = '300px';
	export let isGlobal: boolean = false;
	export let placeholder: string;
	export let queryInputHandler: (query: string) => void;
	export let queryChangeHandler: ((query: string) => void) | null = null;

	const optionalProps: Record<string, string> = {};
	if (inputElementId) {
		optionalProps.id = inputElementId;
	}

	const handleOnInput = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		if (inputTarget.value.length > 0) {
			queryInputHandler(inputTarget.value);
		}
	};

	const handleOnChange = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		if (queryChangeHandler) {
			queryChangeHandler(inputTarget.value);
		}
	};
</script>

<div class="hidden relative md:block {!isGlobal && 'mr-4'}" style="width: {width}">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4" />
	</div>
	<Input
		{...optionalProps}
		on:input={handleOnInput}
		on:input={handleOnChange}
		class="ps-10"
		{placeholder}
	/>
</div>
