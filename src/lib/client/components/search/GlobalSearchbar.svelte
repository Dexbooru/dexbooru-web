<script lang="ts">
	import { getGlobalSearchResults } from '$lib/client/api/search';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import type { IAppSearchResult } from '$lib/shared/types/search';
	import { toast } from '@zerodevx/svelte-toast';
	import { Input } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';

	let currentQuery: string;
	let currentSearchResults: IAppSearchResult[] = [];

	const handleSearchQueryChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		currentQuery = target.value;

		const response = await getGlobalSearchResults(currentQuery);
		if (response.ok) {
			currentSearchResults = (await response.json()) as IAppSearchResult[];
		} else {
			toast.push('An error occured while trying to process that query', FAILURE_TOAST_OPTIONS);
		}
	};
</script>

<div class="hidden relative md:block">
	<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
		<SearchOutline class="w-4 h-4" />
	</div>
	<Input class="ps-10" placeholder="Search..." />
</div>
