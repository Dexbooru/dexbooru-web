<script lang="ts">
	import Button from 'flowbite-svelte/Button.svelte';
	import DiscordSolid from 'flowbite-svelte-icons/DiscordSolid.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';
	import GoogleSolid from 'flowbite-svelte-icons/GoogleSolid.svelte';

	type Props = {
		discordAuthorizationUrl?: string;
		githubAuthorizationUrl?: string;
		googleAuthorizationUrl?: string;
	};

	let { discordAuthorizationUrl, githubAuthorizationUrl, googleAuthorizationUrl }: Props = $props();
</script>

<div class="flex flex-col space-y-2 justify-center">
	{#if discordAuthorizationUrl && discordAuthorizationUrl.length > 0}
		<Button class="flex space-x-2" color="alternative" href={discordAuthorizationUrl}>
			<DiscordSolid class="w-6 h-6" /> <span>Sign in with Discord</span>
		</Button>
	{/if}

	{#if githubAuthorizationUrl && githubAuthorizationUrl.length > 0}
		<Button class="flex space-x-2" color="alternative" href={githubAuthorizationUrl}>
			<GithubSolid class="w-6 h-6" /> <span>Sign in with Github</span>
		</Button>
	{/if}

	{#if googleAuthorizationUrl && googleAuthorizationUrl.length > 0}
		<Button class="flex space-x-2" color="alternative" href={googleAuthorizationUrl}>
			<GoogleSolid class="w-6 h-6" /> <span>Sign in with Google</span>
		</Button>
	{/if}
</div>
