<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let username: string = form ? form.username : '';
	let email: string = form ? form.email : '';
	let password: string;
	let confirmedPassword: string;
</script>

<h1>{form?.reason}</h1>
<form method="POST" class="flex flex-col space-y-2">
	<label for="email">Email</label>
	<input bind:value={email} name="email" type="email" placeholder="Enter your email!" />
	<label for="username">Username</label>
	<input bind:value={username} name="username" type="text" placeholder="Enter your username!" />
	<label for="password">Password</label>
	<input bind:value={password} name="password" type="password" placeholder="Enter your password!" />
	<label for="confirmedPassword">Confirm Password</label>
	<input
		bind:value={confirmedPassword}
		name="confirmedPassword"
		type="password"
		placeholder="Enter your password again!"
	/>
	<button type="submit">Register</button>
</form>
