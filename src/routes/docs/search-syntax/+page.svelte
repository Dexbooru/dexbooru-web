<script lang="ts">
	import Heading from 'flowbite-svelte/Heading.svelte';
	import Li from 'flowbite-svelte/Li.svelte';
	import List from 'flowbite-svelte/List.svelte';
	import P from 'flowbite-svelte/P.svelte';
	import Table from 'flowbite-svelte/Table.svelte';
	import TableBody from 'flowbite-svelte/TableBody.svelte';
	import TableBodyCell from 'flowbite-svelte/TableBodyCell.svelte';
	import TableBodyRow from 'flowbite-svelte/TableBodyRow.svelte';
	import TableHead from 'flowbite-svelte/TableHead.svelte';
	import TableHeadCell from 'flowbite-svelte/TableHeadCell.svelte';
</script>

<svelte:head>
	<title>Dexbooru - Search Syntax Guide</title>
	<meta property="og:title" content="Dexbooru - Search Syntax Guide" />
	<meta
		property="og:description"
		content="Learn how to use advanced search queries on Dexbooru to find the exact posts you are looking for."
	/>
</svelte:head>

<main class="container mx-auto max-w-4xl px-4 py-8">
	<Heading tag="h1" class="mb-4 text-3xl font-bold md:text-4xl">Search Syntax Guide</Heading>
	<P class="mb-6 text-lg text-gray-700 dark:text-gray-300">
		Dexbooru supports a powerful search syntax that allows you to filter posts by various
		properties, including tags, artists, uploader, statistics, and more. This guide will help you
		construct precise queries.
	</P>

	<section class="mb-10">
		<Heading tag="h2" class="mb-4 text-2xl font-semibold">Basic Search</Heading>
		<P class="mb-4 text-gray-600 dark:text-gray-400">
			The most common way to search is by using tags and artist names. Simply type them separated by
			spaces.
		</P>
		<div
			class="mb-4 rounded-lg bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-400"
		>
			naruto goku
		</div>
		<P class="text-sm text-gray-500 dark:text-gray-400">
			Finds posts that contain <strong>both</strong> the tag "naruto" <strong>AND</strong> "goku".
		</P>
	</section>

	<section class="mb-10">
		<Heading tag="h2" class="mb-4 text-2xl font-semibold">Advanced Filters (Prefixes)</Heading>
		<P class="mb-4 text-gray-600 dark:text-gray-400">
			You can filter by specific properties using the <code>prefix:value</code> syntax.
		</P>

		<Table hoverable={true} class="mb-6">
			<TableHead>
				<TableHeadCell>Prefix</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Example</TableHeadCell>
			</TableHead>
			<TableBody>
				<TableBodyRow>
					<TableBodyCell><code>uploader</code></TableBodyCell>
					<TableBodyCell>Filter by the user who uploaded the post (username or UUID).</TableBodyCell
					>
					<TableBodyCell><code>uploader:admin</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>views</code></TableBodyCell>
					<TableBodyCell>Filter by view count.</TableBodyCell>
					<TableBodyCell><code>views:&gt;1000</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>likes</code></TableBodyCell>
					<TableBodyCell>Filter by like count.</TableBodyCell>
					<TableBodyCell><code>likes:&gt;=50</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>moderationStatus</code></TableBodyCell>
					<TableBodyCell>Filter by status (PENDING, APPROVED, REJECTED).</TableBodyCell>
					<TableBodyCell><code>moderationStatus:APPROVED</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>sourceLink</code></TableBodyCell>
					<TableBodyCell>Filter by the exact source URL.</TableBodyCell>
					<TableBodyCell><code>sourceLink:https://example.com/image.png</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>sourceTitle</code></TableBodyCell>
					<TableBodyCell
						>Filter by the title of the source material (e.g., anime, game).</TableBodyCell
					>
					<TableBodyCell><code>sourceTitle:Naruto</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>characterName</code></TableBodyCell>
					<TableBodyCell
						>Filter by a specific character name associated with the source.</TableBodyCell
					>
					<TableBodyCell><code>characterName:Sasuke</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>id</code></TableBodyCell>
					<TableBodyCell>Filter by the exact Post UUID.</TableBodyCell>
					<TableBodyCell><code>id:123e4567-e89b-12d3-a456-426614174000</code></TableBodyCell>
				</TableBodyRow>
				<TableBodyRow>
					<TableBodyCell><code>createdAt</code></TableBodyCell>
					<TableBodyCell>Filter by creation date (YYYY-MM-DD).</TableBodyCell>
					<TableBodyCell><code>createdAt:&gt;2023-01-01</code></TableBodyCell>
				</TableBodyRow>
			</TableBody>
		</Table>
	</section>

	<section class="mb-10">
		<Heading tag="h2" class="mb-4 text-2xl font-semibold">Operators</Heading>
		<P class="mb-4 text-gray-600 dark:text-gray-400">
			Operators allow you to refine your search, especially for numerical values and dates.
		</P>
		<List tag="ul" class="mb-6 list-inside list-disc space-y-1 text-gray-500 dark:text-gray-400">
			<Li><code>=</code> : Equal to (default for strings)</Li>
			<Li><code>!=</code> : Not equal to</Li>
			<Li><code>&gt;</code> : Greater than</Li>
			<Li><code>&lt;</code> : Less than</Li>
			<Li><code>&gt;=</code> : Greater than or equal to</Li>
			<Li><code>&lt;=</code> : Less than or equal to</Li>
		</List>
	</section>

	<section class="mb-10">
		<Heading tag="h2" class="mb-4 text-2xl font-semibold">Negation</Heading>
		<P class="mb-4 text-gray-600 dark:text-gray-400">
			You can exclude results by prepending a minus sign (<code>-</code>) to any tag, artist, or
			prefix filter.
		</P>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="rounded border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
				<p class="mb-2 font-mono text-sm dark:text-gray-300">-tag_name</p>
				<p class="text-sm text-gray-500">Excludes posts with "tag_name"</p>
			</div>
			<div class="rounded border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
				<p class="mb-2 font-mono text-sm dark:text-gray-300">-uploader:banned_user</p>
				<p class="text-sm text-gray-500">Excludes posts uploaded by "banned_user"</p>
			</div>
			<div class="rounded border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
				<p class="mb-2 font-mono text-sm dark:text-gray-300">-sourceTitle:Bleach</p>
				<p class="text-sm text-gray-500">Excludes posts from the source "Bleach"</p>
			</div>
		</div>
	</section>

	<section>
		<Heading tag="h2" class="mb-4 text-2xl font-semibold">Complex Query Examples</Heading>
		<P class="mb-4 text-gray-600 dark:text-gray-400">
			Combine multiple filters to find exactly what you want.
		</P>
		<div class="space-y-4">
			<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
				<p class="mb-2 font-mono font-bold text-blue-600 dark:text-blue-400">
					landscape -portrait views:>5000
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Finds posts tagged "landscape" but NOT "portrait" that have more than 5000 views.
				</p>
			</div>
			<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
				<p class="mb-2 font-mono font-bold text-blue-600 dark:text-blue-400">
					uploader:tanny sourceTitle:Pokemon likes:>=100
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Finds Pokemon posts uploaded by "tanny" with 100 or more likes.
				</p>
			</div>
			<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
				<p class="mb-2 font-mono font-bold text-blue-600 dark:text-blue-400">
					characterName:Luffy -sourceTitle:One_Piece
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Finds posts with character "Luffy" that are NOT tagged with source title "One_Piece"
					(useful for crossovers).
				</p>
			</div>
		</div>
	</section>
</main>
