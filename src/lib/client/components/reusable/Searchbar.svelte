<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	type Props = {
		inputElementId?: string | null;
		required?: boolean;
		width?: string;
		isGlobal?: boolean;
		placeholder: string;
		autofocus?: boolean;
		name?: string | null;
		queryInputHandler?: ((query: string) => void) | null;
		queryChangeHandler?: ((query: string) => void) | null;
	};

	let {
		required = false,
		name = null,
		inputElementId = null,
		autofocus = false,
		width = '300px',
		isGlobal = false,
		placeholder,
		queryInputHandler = null,
		queryChangeHandler = null,
	}: Props = $props();

	const optionalProps: Record<string, string> = $state({});
	if (inputElementId) {
		optionalProps.id = inputElementId;
	}
	if (name) {
		optionalProps.name = name;
	}

	const handleOnInput = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		if (inputTarget.value.length > 0) {
			if (queryInputHandler) {
				queryInputHandler(inputTarget.value);
			}
		}
	};

	const handleOnChange = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		if (queryChangeHandler) {
			queryChangeHandler(inputTarget.value);
		}
	};
</script>

<div class="relative {!isGlobal && 'mr-4'}" style="width: {width}">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4" />
	</div>
	<Input
		{autofocus}
		{...optionalProps}
		on:input={handleOnInput}
		on:input={handleOnChange}
		class="ps-10"
		{placeholder}
		{required}
	/>
</div>
