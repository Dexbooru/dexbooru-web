<script lang="ts">
	import type { TComment } from '$lib/shared/types/comments';

	type Props = {
		comment: TComment;
		parentComment: TComment | null;
	};

	let { comment, parentComment }: Props = $props();
</script>

