<script lang="ts">
	import ModerationTabs from '$lib/client/components/moderation/ModerationTabs.svelte';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { onMount } from 'svelte';

	const moderationData = getModerationPaginationData();

	onMount(() => {
		moderationData.set({
			postCollectionReportPageNumber: 0,
			postReportPageNumber: 0,
			userReportPageNumber: 0,
			postCollectionReports: [],
			postReports: [],
			userReports: [],
			moderators: [],
		});
	});
</script>

<main>
	<ModerationTabs />
</main>
