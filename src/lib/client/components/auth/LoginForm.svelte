<script lang="ts">
	import { Card, Button, Label, Input, Checkbox, Alert } from 'flowbite-svelte';
	import type { ActionData } from '../../../../routes/login/$types';
	import { EyeOutline,EyeSlashOutline} from 'flowbite-svelte-icons'; 
	let showPassword = false; 

	export let form: ActionData;

	const loginErrorReason: string | undefined = form?.reason;
	let username: string = form?.username || '';
	let password: string = '';
</script>

<Card class="w-full max-w-md mt-20">
	<form class="flex flex-col space-y-6" method="POST">
		<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">
			Login to Dexbooru!
		</h3>
		<Label class="space-y-2">
			<span>Username</span>
			<Input
				bind:value={username}
				type="text"
				name="username"
				placeholder="dexboorulover1234"
				required
			/>
		</Label>
		<Label class="space-y-2">
            <span>Your password</span>
            <div class="relative">
                <Input bind:value={password} type={showPassword ? 'text' : 'password'} name="password" placeholder="•••••" required />
                {#if showPassword}
                    <EyeSlashOutline class="absolute top-3 right-3 cursor-pointer text-gray-400 dark:text-gray-500" on:click={() => showPassword = false} />
                {:else}
                    <EyeOutline class="absolute top-3 right-3 cursor-pointer text-gray-400 dark:text-gray-500" on:click={() => showPassword = true} />
                {/if}
            </div>
        </Label>
		<div class="flex items-start">
			<Checkbox>Remember me</Checkbox>
			<a href="/" class="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500">
				Lost password?
			</a>
		</div>
		<Button type="submit" class="w-full">Log in</Button>
		{#if loginErrorReason}
			<Alert color="red">
				<span class="font-medium">Login error!</span>
				{loginErrorReason}
			</Alert>
		{/if}
		<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
			Not registered? <a
				href="/register"
				class="text-primary-700 hover:underline dark:text-primary-500"
			>
				Create account
			</a>
		</div>
	</form>
</Card>
