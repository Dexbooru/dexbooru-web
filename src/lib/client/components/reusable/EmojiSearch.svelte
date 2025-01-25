<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import DropdownHeader from 'flowbite-svelte/DropdownHeader.svelte';
	import Search from 'flowbite-svelte/Search.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import FaceGrinSolid from 'flowbite-svelte-icons/FaceGrinSolid.svelte';
	import VirtualizedList from './VirtualizedList.svelte';

	type Props = {
		handleEmoji: (targetEmoji: string) => void;
	};

	let { handleEmoji }: Props = $props();

	let dropdownOpen = $state(false);
	let loadingEmojis = $state(false);
	let emojiEntries: [string, string][] = [];
	let filteredEmojiEntries = $state(emojiEntries);

	const handleEmojiButtonClick = async () => {
		dropdownOpen = true;

		if (emojiEntries.length > 0) return;
		loadingEmojis = true;
		emojiEntries = Object.entries(await import('$lib/client/assets/emoji-set.json')).filter(
			(item) => item[0] !== 'default',
		) as [string, string][];
		loadingEmojis = false;
		filteredEmojiEntries = emojiEntries;
	};

	const handleEmojiClick = (event: Event) => {
		const target = event.target as HTMLLIElement;
		handleEmoji(`:${target?.textContent?.split('-')[1].trim()}:`);
		dropdownOpen = false;
	};

	const handleOnInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		filteredEmojiEntries = emojiEntries.filter(([name]) =>
			name.toLocaleLowerCase().includes(target.value.toLowerCase()),
		);
	};

	const transformEmojiListItem = (item: unknown) =>
		`${(item as [string, string])[1]} - ${(item as [string, string])[0]}`;
</script>

<Button color="alternative" class="align-middle" on:click={handleEmojiButtonClick}>
	<FaceGrinSolid class="w-4 h-4" />
</Button>

<Dropdown
	open={dropdownOpen}
	placement="bottom"
	classContainer="ml-3 text-sm !h-40 sm:w-3/4 md:w-1/2 lg:w-1/3 bg-gray-100 dark:bg-gray-900"
>
	<DropdownHeader class="bg-gray-100 dark:bg-gray-900 sticky top-0">
		<Search size="md" on:input={handleOnInput} />
	</DropdownHeader>

	{#if loadingEmojis}
		<Spinner class="ml-2 mt-2" />
	{/if}

	<VirtualizedList
		listHeight={85}
		data={filteredEmojiEntries}
		handleListItemClick={handleEmojiClick}
		listItemFn={transformEmojiListItem}
		listItemClass="rounded hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 align-middle"
	/>
</Dropdown>
