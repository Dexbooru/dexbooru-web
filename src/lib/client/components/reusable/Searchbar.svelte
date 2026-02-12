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

	const optionalProps = $derived({
		...(inputElementId ? { id: inputElementId } : {}),
		...(name ? { name: name } : {}),
	});

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
	<div class="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
		<SearchOutline class="z-30 h-5 w-4 text-gray-500 dark:text-gray-400" />
	</div>
	<Input
		{autofocus}
		{...optionalProps}
		oninput={handleOnInput}
		onchange={handleOnChange}
		class="ps-10"
		{placeholder}
		{required}
	/>
</div>
