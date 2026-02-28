<script lang="ts">
	import { NONEXISTENT_USER_ID } from '$lib/shared/constants/auth';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import EnvelopeSolid from 'flowbite-svelte-icons/EnvelopeSolid.svelte';

	type Props = {
		emailVerified: boolean;
		userId: string;
	};

	let { emailVerified, userId }: Props = $props();

	const shouldShow = $derived(!emailVerified && userId !== NONEXISTENT_USER_ID);
</script>

{#if shouldShow}
	<Alert color="yellow" class="rounded-none border-x-0">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<EnvelopeSolid class="h-5 w-5 shrink-0" />
				<span>
					Please verify your email address. Check your inbox for the verification link.
					<a href="/profile/settings?tab=personal" class="font-medium underline hover:no-underline">
						Resend from Settings
					</a>
				</span>
			</div>
		</div>
	</Alert>
{/if}
