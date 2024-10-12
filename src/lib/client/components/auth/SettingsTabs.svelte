<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { GridSolid, UserCircleSolid } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';
	import type { ActionData } from '../../../../routes/profile/settings/$types';
	import ChangePasswordForm from './ChangePasswordForm.svelte';
	import ChangeProfilePicture from './ChangeProfilePicture.svelte';
	import ChangeUsernameForm from './ChangeUsernameForm.svelte';
	import DeleteAccountForm from './DeleteAccountForm.svelte';
	import Enable2faForm from './Enable2faForm.svelte';
	import PostPreferencesForm from './PostPreferencesForm.svelte';
	import UserInterfacePreferenceForm from './UserInterfacePreferenceForm.svelte';

	export let form: ActionData;

	const errorReason = form ? form.reason : null;
	const errorType = form ? form.type : null;

	const validTabNames = ['personal', 'preferences', 'security'] as const;
	let currentTab: string = 'personal';

	const handleTabClick = (tabName: string) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const pageSubscribe = page.subscribe((data) => {
		const searchParams = data.url.searchParams;
		const tabName = searchParams.get('tab') as 'personal' | 'preferences';
		if (tabName) {
			currentTab = validTabNames.includes(tabName) ? tabName : 'personal';
		}
	});

	onDestroy(() => {
		pageSubscribe();
	});
</script>

<Tabs style="underline">
	<TabItem on:click={() => handleTabClick('personal')} open={currentTab === 'personal'}>
		<div slot="title" class="flex items-center gap-2">
			<UserCircleSolid size="md" />
			Personal
		</div>
		<section class="flex flex-wrap gap-4 items-start">
			<ChangeUsernameForm error={errorReason} {errorType} />
			<ChangePasswordForm error={errorReason} {errorType} />
			<ChangeProfilePicture error={errorReason} {errorType} />
			<DeleteAccountForm error={errorReason} {errorType} />
		</section>
	</TabItem>
	<TabItem
		on:click={() => handleTabClick('preferences')}
		title="Preferences"
		open={currentTab === 'preferences'}
	>
		<div slot="title" class="flex items-center gap-2">
			<GridSolid size="md" />
			Preferences
		</div>
		<section class="flex flex-wrap gap-4 items-start">
			<PostPreferencesForm error={errorReason} {errorType} />
			<UserInterfacePreferenceForm error={errorReason} {errorType} />
		</section>
	</TabItem>
	<TabItem
		open={currentTab === 'security'}
		on:click={() => handleTabClick('security')}
		title="Security"
	>
		<section class="flex flex-wrap gap-4 items-start">
			<Enable2faForm error={errorReason} {errorType} />
		</section>
	</TabItem>
</Tabs>
