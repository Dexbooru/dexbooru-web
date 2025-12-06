<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { LinkedUserAccount } from '$generated/prisma/browser';
	import { VALID_TAB_NAMES } from '$lib/client/constants/settings';
	import GridSolid from 'flowbite-svelte-icons/GridSolid.svelte';
	import LockSolid from 'flowbite-svelte-icons/LockSolid.svelte';
	import UserCircleSolid from 'flowbite-svelte-icons/UserCircleSolid.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import ChangePasswordForm from './ChangePasswordForm.svelte';
	import ChangeProfilePicture from './ChangeProfilePicture.svelte';
	import ChangeUsernameForm from './ChangeUsernameForm.svelte';
	import DeleteAccountForm from './DeleteAccountForm.svelte';
	import Enable2faForm from './Enable2faForm.svelte';
	import OauthConnectForm from './OauthConnectForm.svelte';
	import PostPreferencesForm from './PostPreferencesForm.svelte';
	import UserInterfacePreferenceForm from './UserInterfacePreferenceForm.svelte';

	type Props = {
		linkedAccounts: LinkedUserAccount[];
		oauthAuthorizationLinks: {
			discordAuthorizationUrl: string;
			githubAuthorizationUrl: string;
			googleAuthorizationUrl: string;
		};
	};

	let { oauthAuthorizationLinks, linkedAccounts }: Props = $props();

	let currentTab: string = $state('personal');

	const handleTabClick = (tabName: string) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const searchParams = page.url.searchParams;
	const tabName = searchParams.get('tab') as 'personal' | 'preferences' | 'security';
	if (tabName) {
		currentTab = VALID_TAB_NAMES.includes(tabName) ? tabName : 'personal';
	}
</script>

<Tabs style="pills" class="flex flex-wrap space-x-2 rtl:space-x-revers !p-3">
	<TabItem onclick={() => handleTabClick('personal')} open={currentTab === 'personal'}>
		{#snippet titleSlot()}
			<div class="flex items-center gap-2">
				<UserCircleSolid size="md" />
				Personal
			</div>
		{/snippet}
		<section class="flex flex-wrap gap-4 items-start">
			<ChangeUsernameForm />
			<ChangePasswordForm />
			<ChangeProfilePicture />
			<DeleteAccountForm />
		</section>
	</TabItem>
	<TabItem onclick={() => handleTabClick('preferences')} open={currentTab === 'preferences'}>
		{#snippet titleSlot()}
			<div slot="title" class="flex items-center gap-2">
				<GridSolid size="md" />
				Preferences
			</div>
		{/snippet}

		<section class="flex flex-wrap gap-4 items-start">
			<PostPreferencesForm />
			<UserInterfacePreferenceForm />
		</section>
	</TabItem>
	<TabItem open={currentTab === 'security'} onclick={() => handleTabClick('security')}>
		{#snippet titleSlot()}
			<div slot="title" class="flex items-center gap-2">
				<LockSolid size="md" />
				Security
			</div>
		{/snippet}

		<section class="flex flex-wrap gap-4 items-start">
			<Enable2faForm />
			<OauthConnectForm {linkedAccounts} {...oauthAuthorizationLinks} />
		</section>
	</TabItem>
</Tabs>
