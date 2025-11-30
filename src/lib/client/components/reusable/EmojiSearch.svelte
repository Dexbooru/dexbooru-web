<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import DropdownHeader from 'flowbite-svelte/DropdownHeader.svelte';
	import Popover from 'flowbite-svelte/Popover.svelte';
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
	let emojiEntries = $state<[string, string][]>([]);
	let searchQuery = $state('');

	const CHUNK_SIZE = 6;

	function chunkArray<T>(array: T[], size: number): T[][] {
		const result = [];
		for (let i = 0; i < array.length; i += size) {
			result.push(array.slice(i, i + size));
		}
		return result;
	}

	let filteredEmojiChunks = $derived(
		chunkArray(
			emojiEntries.filter(([name]) => name.toLocaleLowerCase().includes(searchQuery)),
			CHUNK_SIZE,
		),
	);

	const loadEmojis = async () => {
		if (emojiEntries.length > 0 || loadingEmojis) return;
		loadingEmojis = true;
		try {
			const module = await import('$lib/client/assets/emoji-set.json');
			const emojiData = module.default || module;
			emojiEntries = Object.entries(emojiData).filter(
				([key]) => key !== 'default',
			) as [string, string][];
		} catch (error) {
			console.error('Failed to load emojis:', error);
		} finally {
			loadingEmojis = false;
		}
	};

	const handleEmojiButtonClick = () => {
		dropdownOpen = true;
		loadEmojis();
	};

	const handleOnInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value.toLowerCase();
	};

	const handleEmojiClick = (name: string) => {
		handleEmoji(`:${name}:`);
		dropdownOpen = false;
	};

	// Helper to generate safe IDs for Popover triggers
	const getEmojiId = (name: string) => `emoji-${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
</script>

<Button
	color="alternative"
	class="align-middle"
	onmouseenter={loadEmojis}
	onclick={handleEmojiButtonClick}
>
	<FaceGrinSolid class="h-4 w-4" />
</Button>

<Dropdown
	bind:open={dropdownOpen}
	placement="bottom"
	classContainer="ml-3 text-sm !h-80 sm:w-3/4 md:w-1/2 lg:w-1/3 bg-gray-100 dark:bg-gray-900"
>
	<DropdownHeader class="sticky top-0 bg-gray-100 dark:bg-gray-900">
		<Search size="md" on:input={handleOnInput} />
	</DropdownHeader>

	{#if loadingEmojis}
		<div class="flex justify-center p-4">
			<Spinner size="6" />
		</div>
	{:else}
		<VirtualizedList listHeight={240} data={filteredEmojiChunks}>
			{#snippet children(chunk)}
				<div class="flex justify-between px-2 py-1">
					{#each chunk as [name, emoji]}
						{@const emojiId = getEmojiId(name)}
						<button
							id={emojiId}
							class="rounded p-2 text-2xl hover:bg-gray-200 dark:hover:bg-gray-700"
							onclick={() => handleEmojiClick(name)}
						>
							{emoji}
						</button>
						<Popover triggeredBy="#{emojiId}" class="w-auto text-sm font-light z-50">
							{name}
						</Popover>
					{/each}
					{#if chunk.length < CHUNK_SIZE}
						{#each Array(CHUNK_SIZE - chunk.length) as _}
							<div class="w-[40px]"></div>
						{/each}
					{/if}
				</div>
			{/snippet}
		</VirtualizedList>
	{/if}
</Dropdown>