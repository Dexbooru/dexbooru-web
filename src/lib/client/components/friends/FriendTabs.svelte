<script lang="ts">
	import { getFriendData } from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import FriendList from './FriendList.svelte';

	const friendData = getFriendData();
</script>

{#if $friendData}
	<Tabs style="underline">
		<TabItem
			open
			title="Friends ({formatNumberWithCommas($friendData.friends.length)})"
			class="focus:ring-0"
		>
			<FriendList listType="friend" />
		</TabItem>

		<TabItem
			title="Sent Friend Requests ({formatNumberWithCommas($friendData.sentFriendRequests.length)})"
			class="focus:ring-0"
		>
			<FriendList listType="sent-request" />
		</TabItem>

		<TabItem
			title="Received Friend Requests ({formatNumberWithCommas(
				$friendData.receivedFriendRequests.length,
			)})"
			class="focus:ring-0"
		>
			<FriendList listType="received-request" />
		</TabItem>
	</Tabs>
{/if}
