<script lang="ts">
	import CommentWrapper from '$lib/client/components/comments/CommentWrapper.svelte';
	import { getCommentPaginationData, getCommentsPage } from '$lib/client/helpers/context';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	const commentsPage = getCommentsPage();
	const paginationData = getCommentPaginationData();

	let { data }: Props = $props();

	$effect(() => {
		commentsPage.set(data.comments);
		paginationData.set({
			comments: data.comments,
			pageNumber: data.pageNumber,
			ascending: data.ascending,
			orderBy: data.orderBy,
		});
	});
</script>

<CommentWrapper />
