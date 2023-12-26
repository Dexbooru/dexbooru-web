<script lang="ts">
	import { page } from '$app/stores';
	import { Dropdown, DropdownItem, Avatar, Button } from 'flowbite-svelte';
</script>

<Button color="light" id="navbar-profile-picture" class="!p-1">
	<Avatar
		src={$page.data.user?.profilePictureUrl}
		alt="profile picture of {$page.data.user?.username}"
		class="mr-2"
	/>
	{$page.data.user?.username}
</Button>
<Dropdown triggeredBy="#navbar-profile-picture">
	<div slot="header" class="px-4 py-2">
		<span class="block text-sm text-gray-900 dark:text-white">{$page.data.user?.username}</span>
		<span class="block truncate text-sm font-medium">{$page.data.user?.email}</span>
	</div>
	<DropdownItem href="/profile/details">Details</DropdownItem>
	<DropdownItem href="/profile/posts/uploaded">Uploaded Posts</DropdownItem>
	<DropdownItem href="/profile/settings">Settings</DropdownItem>
	<DropdownItem href="/profile/logout" slot="footer">Sign out</DropdownItem>
</Dropdown>
