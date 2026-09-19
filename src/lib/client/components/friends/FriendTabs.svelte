<script lang="ts">
	import { getFriendData } from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import FriendList from './FriendList.svelte';

	const friendData = getFriendData();
</script>

{#if $friendData}
	<Tabs style="underline" class="flex flex-wrap gap-y-2 overflow-x-auto">
		<TabItem open class="focus:ring-0">
			{#snippet titleSlot()}
				<span class="whitespace-nowrap"
					>Friends ({formatNumberWithCommas($friendData.friends.length)})</span
				>
			{/snippet}
			<FriendList listType="friend" />
		</TabItem>

		<TabItem class="focus:ring-0">
			{#snippet titleSlot()}
				<span class="whitespace-nowrap"
					>Sent ({formatNumberWithCommas($friendData.sentFriendRequests.length)})</span
				>
			{/snippet}
			<FriendList listType="sent-request" />
		</TabItem>

		<TabItem class="focus:ring-0">
			{#snippet titleSlot()}
				<span class="whitespace-nowrap"
					>Received ({formatNumberWithCommas($friendData.receivedFriendRequests.length)})</span
				>
			{/snippet}
			<FriendList listType="received-request" />
		</TabItem>
	</Tabs>
{/if}
