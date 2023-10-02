<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let oldPassword: string;
	let newPassword: string;
	let confirmedNewPassword: string;
</script>

<h1>Settings</h1>
<h2>{form && form.reason}</h2>

<form method="POST" action="?/password" class="flex flex-col space-y-2">
	<label for="oldPassword">Old password</label>
	<input
		bind:value={oldPassword}
		name="oldPassword"
		type="password"
		placeholder="Enter your old password!"
	/>

	<label for="newPassword">New password</label>
	<input
		bind:value={newPassword}
		name="newPassword"
		type="password"
		placeholder="Enter your new password!"
	/>

	<label for="confirmedNewPassword">New password confirmed</label>
	<input
		bind:value={confirmedNewPassword}
		name="confirmedNewPassword"
		type="password"
		placeholder="Enter your new password again!"
	/>

	<button type="submit">Change password</button>
</form>

<form method="POST" action="?/username" class="flex flex-col space-y-2">
	<label for="newUsername">New username</label>
	<input type="text" name="newUsername" placeholder="Enter the new username!" />

	<button type="submit">Change username</button>
</form>
