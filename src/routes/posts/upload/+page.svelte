<script lang="ts">
	import UploadForm from '$lib/client/components/posts/UploadForm.svelte';
	import type { ActionData } from './$types';

	type Props = {
		form: ActionData;
	};

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Upload a post</title>
</svelte:head>

<UploadForm {form} />
