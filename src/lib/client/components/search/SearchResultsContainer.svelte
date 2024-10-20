<script lang="ts">
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';
	import LabelTable from '../tables/LabelTable.svelte';
	import PostTable from '../tables/PostTable.svelte';
	import UserTable from '../tables/UserTable.svelte';

	export let results: TAppSearchResult;
	let { posts, artists, tags, users } = results;

	$: {
		posts = results.posts;
		artists = results.artists;
		tags = results.tags;
		users = results.users;
	}
</script>

<div in:slide out:slide>
	<Tabs style="underline">
		<TabItem open title="Tags">
			{#if tags && tags.length > 0}
				<LabelTable labels={tags} labelType="tag" />
			{:else}
				<p>No tags were found matching that query</p>
			{/if}
		</TabItem>
		<TabItem title="Artists">
			{#if artists && artists.length > 0}
				<LabelTable labels={artists} labelType="artist" />
			{:else}
				<p>No artists were found matching that query</p>
			{/if}
		</TabItem>
		<TabItem title="Posts">
			{#if posts && posts.length > 0}
				<PostTable {posts} />
			{:else}
				<p>No posts were found matching that query</p>
			{/if}
		</TabItem>
		<TabItem title="Users">
			{#if users && users.length > 0}
				<UserTable {users} />
			{:else}
				<p>No users were found matching that query</p>
			{/if}
		</TabItem>
	</Tabs>
</div>
