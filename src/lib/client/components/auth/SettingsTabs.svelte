<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { GridSolid, LockSolid, UserCircleSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import ChangePasswordForm from './ChangePasswordForm.svelte';
	import ChangeProfilePicture from './ChangeProfilePicture.svelte';
	import ChangeUsernameForm from './ChangeUsernameForm.svelte';
	import DeleteAccountForm from './DeleteAccountForm.svelte';
	import Enable2faForm from './Enable2faForm.svelte';
	import PostPreferencesForm from './PostPreferencesForm.svelte';
	import UserInterfacePreferenceForm from './UserInterfacePreferenceForm.svelte';

	const validTabNames = ['personal', 'preferences', 'security'] as const;

	let currentTab: string = $state('personal');

	const handleTabClick = (tabName: string) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const pageUnsubscribe = page.subscribe((data) => {
		const searchParams = data.url.searchParams;

		const tabName = searchParams.get('tab') as 'personal' | 'preferences' | 'security';
		if (tabName) {
			currentTab = validTabNames.includes(tabName) ? tabName : 'personal';
		}
	});

	onMount(() => {
		return () => {
			pageUnsubscribe();
		};
	});
</script>

<Tabs defaultClass="flex flex-wrap space-x-2 rtl:space-x-revers !p-3" style="underline">
	<TabItem on:click={() => handleTabClick('personal')} open={currentTab === 'personal'}>
		{#snippet title()}
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
	<TabItem on:click={() => handleTabClick('preferences')} open={currentTab === 'preferences'}>
		{#snippet title()}
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
	<TabItem open={currentTab === 'security'} on:click={() => handleTabClick('security')}>
		{#snippet title()}
			<div slot="title" class="flex items-center gap-2">
				<LockSolid size="md" />
				Security
			</div>
		{/snippet}

		<section class="flex flex-wrap gap-4 items-start">
			<Enable2faForm />
		</section>
	</TabItem>
</Tabs>
