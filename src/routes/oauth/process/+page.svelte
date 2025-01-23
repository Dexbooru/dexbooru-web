<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { processOauthToken } from '$lib/client/api/oauth';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import { capitalize } from '$lib/shared/helpers/util';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { onMount } from 'svelte';

	let oauthProcessing = $state(true);

	const applicationName = page.url.searchParams.get('application') ?? '';

	onMount(() => {
		const oauthToken = page.url.searchParams.get(SESSION_ID_KEY);

		if (
			!oauthToken ||
			oauthToken.length === 0 ||
			!applicationName ||
			applicationName.length === 0
		) {
			goto('/login');
			return;
		}

		oauthProcessing = true;
		processOauthToken(oauthToken).then((response) => {
			oauthProcessing = false;
			if (response.ok) {
				window.location.href = '/posts';
			} else {
				goto('/login');
			}
		});
	});
</script>

<div class="flex items-center justify-center mt-40">
	<div class="p-6 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-900">
		<h1 class="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
			{#if oauthProcessing}
				Processing your third-party sign in from your {capitalize(applicationName)} account...
				<Spinner />
			{:else}
				Something went wrong
			{/if}
		</h1>
		{#if !oauthProcessing}
			<p class="text-sm text-center text-gray-600 dark:text-gray-400">
				Please try again. Redirecting you to the login page...
			</p>
		{/if}
	</div>
</div>
