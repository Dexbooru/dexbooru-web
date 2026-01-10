<script lang="ts">
	import { page } from '$app/state';
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { generateCommentWrapperMetatags } from '$lib/client/helpers/comments';
	import { getCommentPaginationData } from '$lib/client/helpers/context';
	import { groupBy } from '$lib/shared/helpers/util';
	import type { TComment, TCommentOrderByColumn } from '$lib/shared/types/comments';
	import Group from 'flowbite-svelte/Group.svelte';
	import GroupItem from 'flowbite-svelte/GroupItem.svelte';
	import ListPlaceholder from 'flowbite-svelte/ListPlaceholder.svelte';
	import { convert as parseHtmlString } from 'html-to-text';
	import { onMount } from 'svelte';
	import CommentPaginator from './CommentPaginator.svelte';

	const paginationData = getCommentPaginationData();

	const groupByCommentDate = (currentComment: TComment, _: number) => {
		const createdAt = currentComment.createdAt;
		return `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}-${createdAt.getDate()}`;
	};

	const getParsedCommentInfo = (comment: TComment) => {
		const parsedContent = parseHtmlString(comment.content);
		let parsedTitle = '';

		const authorHeading = page.url.pathname.includes('/comments/created')
			? 'You'
			: comment.author.username;

		if (comment.parentComment) {
			parsedTitle = `
            <span class="font-bold text-blue-600">${authorHeading}</span> 
            replied to 
            <span class="font-bold text-green-600">${comment.parentComment.author.username}</span>'s comment on 
            <a href="/posts/${comment.postId}" class="text-indigo-500 underline hover:text-indigo-700">this post</a>
        `;
		} else {
			parsedTitle = `
            <span class="font-bold text-blue-600">${authorHeading}</span> 
            commented on 
            <a href="/posts/${comment.postId}" class="text-indigo-500 underline hover:text-indigo-700">this post</a>
        `;
		}

		return {
			parsedContent,
			parsedTitle,
		};
	};

	let commentDateGroups = $derived(groupBy(page.data.comments ?? [], groupByCommentDate));
	let titleData = $derived(
		generateCommentWrapperMetatags(
			page.data.comments ?? [],
			(page.data.orderBy as TCommentOrderByColumn) ?? 'createdAt',
			page.data.pageNumber ?? 0,
			page.data.ascending ?? false,
		),
	);

	const paginationDataUnsubscribe = paginationData.subscribe((data) => {
		if (!data) return;

		const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
		images.forEach((image) => {
			if (image.alt.includes('profile of')) {
				image.onerror = () => {
					image.src = DefaultProfilePicture;
				};
			}
		});
	});

	onMount(() => {
		return () => {
			paginationDataUnsubscribe();
		};
	});
</script>

<svelte:head>
	<title>{titleData.title}</title>
	<meta property="og:title" content={titleData.title} />
	<meta property="og:description" content={titleData.description} />
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>

<main>
	{#if $paginationData}
		{#if page.data.comments?.length === 0}
			<h1 class="p-4 mt-5 text-xl text-center text-black dark:text-white">
				No comments found on page {(page.data.pageNumber ?? 0) + 1}
			</h1>
		{:else}
			<h1 class="text-4xl m-4 dark:text-white">{titleData.title}</h1>
			<CommentPaginator />
			{#each Object.entries(commentDateGroups) as [date, comments]}
				<Group
					divClass="p-4 mb-4 bg-gray-50 dark:bg-gray-800 comment-date-group space-y-4 border-none"
					date={`Comments made on: ${date}`}
				>
					<GroupItem
						timelines={comments.map((comment) => {
							const { parsedContent, parsedTitle } = getParsedCommentInfo(comment);

							return {
								title: parsedTitle,
								comment: parsedContent,
								src: comment.author.profilePictureUrl ?? DefaultProfilePicture,
								alt: `profile of ${comment.author.username}`,
								href: `/comments/${comment.id}`,
								isPrivate: false,
							};
						})}
					/>
				</Group>
			{/each}
		{/if}
	{:else}
		{#each Array(page.data.comments?.length ?? 0) as _}
			<ListPlaceholder
				class="p-4 h-60 space-y-4 w-full divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 dark:border-gray-700"
			/>
		{/each}
	{/if}
</main>
