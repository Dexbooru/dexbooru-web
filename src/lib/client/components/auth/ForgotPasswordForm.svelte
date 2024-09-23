<script lang="ts">
	import { Button, Card, Input, Label } from 'flowbite-svelte';

	export let error: string | null = null;

	let email: string = '';
</script>

<Card class="w-full max-w-md mt-20">
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Account Recovery
	</h3>
	<div class="flex-col space-y-1 mb-3">
		<p class="text-sm text-left text-gray-600 dark:text-gray-400">
			Enter the email address associated with your Dexbooru account.
		</p>
		<p class="text-sm text-left text-gray-600 dark:text-gray-400">
			We will send a password recovery email to your inbox.
		</p>
	</div>

	<form method="POST" class="flex flex-col space-y-6">
		<Label class="space-y-2">
			<span>Email</span>
			<Input bind:value={email} type="email" name="email" placeholder="Your email" required />
		</Label>

		<Button disabled={email.length === 0} type="submit" class="w-full">Reset password</Button>
	</form>
</Card>
