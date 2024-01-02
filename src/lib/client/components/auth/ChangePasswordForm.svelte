<script lang="ts">
	let oldPassword: string = '';
	let newPassword: string = '';
	let confirmedNewPassword: string = '';
</script>

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
