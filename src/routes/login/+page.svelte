<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let username: string = form ? form.username : '';
	//let password: string;
</script>

<form method="POST">
	<label for="username">Username</label>
	<input bind:value={username} name="username" type="text" placeholder="Enter your username" />
	<label for="password">Password</label>
	<input name="password" type="password" placeholder="Enter your password" />
	<button type="submit">Log in</button>
</form>
