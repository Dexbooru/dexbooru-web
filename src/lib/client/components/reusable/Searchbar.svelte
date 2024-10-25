<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	interface Props {
		inputElementId?: string | null;
		width?: string;
		isGlobal?: boolean;
		placeholder: string;
		queryInputHandler: (query: string) => void;
		queryChangeHandler?: ((query: string) => void) | null;
	}

	let {
		inputElementId = null,
		width = '300px',
		isGlobal = false,
		placeholder,
		queryInputHandler,
		queryChangeHandler = null
	}: Props = $props();

	const optionalProps: Record<string, string> = $state({});
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
