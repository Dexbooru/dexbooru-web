<script lang="ts">
	import { onMount } from 'svelte';
	import { NONEXISTENT_USER_ID } from '$lib/shared/constants/auth';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import EnvelopeSolid from 'flowbite-svelte-icons/EnvelopeSolid.svelte';
	import CloseOutline from 'flowbite-svelte-icons/CloseOutline.svelte';

	type Props = {
		emailVerified: boolean;
		userId: string;
	};

	let { emailVerified, userId }: Props = $props();

	const DISMISS_KEY = 'email-verification-banner-dismissed';
	let dismissed = $state(false);

	const getDismissKey = () =>
		userId === NONEXISTENT_USER_ID ? DISMISS_KEY : `${DISMISS_KEY}-${userId}`;

	const shouldShow = $derived(!emailVerified && userId !== NONEXISTENT_USER_ID && !dismissed);

	function dismiss() {
		dismissed = true;
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem(getDismissKey(), 'true');
		}
	}

	onMount(() => {
		if (
			typeof sessionStorage !== 'undefined' &&
			sessionStorage.getItem(getDismissKey()) === 'true'
		) {
			dismissed = true;
		}
	});
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
			<button
				type="button"
				onclick={dismiss}
				aria-label="Dismiss"
				class="shrink-0 rounded p-1 hover:bg-amber-200 dark:hover:bg-amber-800"
			>
				<CloseOutline class="h-5 w-5" />
			</button>
		</div>
	</Alert>
{/if}
