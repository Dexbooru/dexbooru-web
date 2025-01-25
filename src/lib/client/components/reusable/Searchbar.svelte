<script lang="ts">
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import Input from 'flowbite-svelte/Input.svelte';

	type Props = {
		inputElementId?: string | null;
		required?: boolean;
		width?: string;
		isGlobal?: boolean;
		placeholder: string;
		autofocus?: boolean;
		name?: string | null;
		customClass?: string | null;
		queryInputHandler?: ((query: string) => void) | null;
		queryChangeHandler?: ((query: string) => void) | null;
		queryInputClear?: (() => void) | null;
		queryChangeClear?: (() => void) | null;
	};

	let {
		required = false,
		name = null,
		inputElementId = null,
		autofocus = false,
		width = '300px',
		isGlobal = false,
		customClass = '',
		placeholder,
		queryInputHandler = null,
		queryChangeHandler = null,
		queryInputClear = null,
		queryChangeClear = null,
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
		} else {
			if (queryInputClear) {
				queryInputClear();
			}
		}
	};

	const handleOnChange = (event: Event) => {
		const inputTarget = event.target as HTMLInputElement;
		if (queryChangeHandler) {
			queryChangeHandler(inputTarget.value);
		} else {
			if (queryChangeClear) {
				queryChangeClear();
			}
		}
	};
</script>

<div class="relative {!isGlobal && 'mr-4'} {customClass} " style="width: {width}">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4 " />
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
