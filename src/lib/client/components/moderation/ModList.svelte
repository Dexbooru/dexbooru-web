<script lang="ts">
	import { PROMOTE_USER_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getModerationPaginationData,
	} from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { formatDate } from '$lib/shared/helpers/dates';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { TUser } from '$lib/shared/types/users';
	import type { UserRole } from '@prisma/client';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Listgroup from 'flowbite-svelte/Listgroup.svelte';
	import ListgroupItem from 'flowbite-svelte/ListgroupItem.svelte';
	import Select from 'flowbite-svelte/Select.svelte';
	import { onMount } from 'svelte';
	import Searchbar from '../reusable/Searchbar.svelte';

	type Props = {
		containerId: string;
	};

	let { containerId }: Props = $props();

	let moderators = $state<TUser[]>([]);
	let filterRole = $state<UserRole | ''>('');
	let sortingCriteria = $state<'username' | 'promotionDate' | ''>('');

	const activeModal = getActiveModal();
	const moderationData = getModerationPaginationData();
	const user = getAuthenticatedUser();

	const setSelectInitialValues = () => {
		const roleSelector = document.getElementById(
			'moderation-list-role-selector',
		) as HTMLSelectElement;
		const sortingSelector = document.getElementById(
			'moderation-list-sorting-selector',
		) as HTMLSelectElement;

		if (roleSelector) {
			roleSelector.childNodes.item(0).textContent = 'Filter by role';
		}

		if (sortingSelector) {
			sortingSelector.childNodes.item(0).textContent = 'Sort by';
		}
	};

	const resetFilters = () => {
		filterRole = '';
		sortingCriteria = '';
		setSelectInitialValues();

		moderators = $moderationData?.moderators ?? [];
	};

	const handleRoleChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		const filterByRole = target.value;

		moderators = ($moderationData?.moderators ?? []).filter(
			(moderator) => moderator.role === filterByRole,
		);
	};

	const handleSortingCriteriaChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		const sortingBy = target.value;

		if (sortingBy === 'username') {
			moderators = moderators.sort((a, b) => a.username.localeCompare(b.username));
		} else {
			moderators = moderators.sort((a, b) => {
				if (a.superRolePromotionAt === null) return 1;
				if (b.superRolePromotionAt === null) return -1;

				return a.superRolePromotionAt.getTime() - b.superRolePromotionAt.getTime();
			});
		}
	};

	const handleQueryChange = (query: string) => {
		const processedQuery = query.trim().toLocaleLowerCase();
		if (processedQuery.length === 0) {
			moderators = $moderationData?.moderators ?? [];
			return;
		}

		moderators = moderators.filter((moderator) => {
			const username = moderator.username.toLocaleLowerCase();
			const id = moderator.id.toLocaleLowerCase();
			const role = moderator.role.toLocaleLowerCase();

			return (
				username.includes(processedQuery) ||
				id.includes(processedQuery) ||
				role.includes(processedQuery)
			);
		});
	};

	const moderationDataUnsubscribe = moderationData.subscribe((data) => {
		if (data) {
			const moderatorListSearchbar = document.getElementById(
				'moderator-list-searchbar',
			) as HTMLInputElement;
			if (moderatorListSearchbar) {
				moderatorListSearchbar.value = '';
			}

			resetFilters();

			const owner = data.moderators.find((moderator) => moderator.role === 'OWNER');
			moderators = owner
				? [owner].concat(data.moderators.filter((moderator) => moderator.role !== 'OWNER'))
				: data.moderators;
		}
	});

	onMount(() => {
		setSelectInitialValues();

		return () => {
			moderationDataUnsubscribe();
		};
	});
</script>

{#if $moderationData}
	<section id={containerId}>
		<div class="flex flex-wrap space-x-5 mb-5">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1">
				{formatNumberWithCommas(moderators.length)} moderators
				{#if filterRole !== '' || sortingCriteria !== ''}
					-
					{#if filterRole !== ''}
						{capitalize(filterRole)} role
					{/if}
					{#if filterRole !== '' && sortingCriteria !== ''}
						,
					{/if}
					{#if sortingCriteria !== ''}
						Sorted by {sortingCriteria === 'username' ? 'username' : 'promotion date'}
					{/if}
				{/if}
			</h2>
			{#if $user && $user.role === 'OWNER'}
				<Button
					onclick={() =>
						activeModal.set({ isOpen: true, focusedModalName: PROMOTE_USER_MODAL_NAME })}
					color="green">Update user roles</Button
				>
			{/if}
		</div>

		<div class="flex flex-wrap mb-5 space-x-2">
			<Searchbar
				queryChangeHandler={handleQueryChange}
				width="35%"
				customClass="!mr-0"
				inputElementId="moderator-list-searchbar"
				placeholder="Search a moderator by id, username or role"
			/>
			<Select
				id="moderation-list-role-selector"
				class="w-100"
				onchange={handleRoleChange}
				bind:value={filterRole}
				oninput={(event) => console.log(event)}
				items={[
					{ name: 'Owner', value: 'OWNER' },
					{ name: 'Moderator', value: 'MODERATOR' },
				]}
			/>
			<Select
				id="moderation-list-sorting-selector"
				class="w-100"
				onchange={handleSortingCriteriaChange}
				bind:value={sortingCriteria}
				items={[
					{ name: 'Username', value: 'username' },
					{ name: 'Promotion Date', value: 'promotionDate' },
				]}
			/>
			<Button onclick={resetFilters}>Reset list</Button>
		</div>

		{#if moderators.length > 0}
			<Listgroup>
				{#each moderators as moderator (moderator.id)}
					<ListgroupItem
						key={moderator.id}
						class="text-base font-semibold gap-4 flex items-center py-3 hover:bg-gray-100 dark:hover:bg-gray-700 justify-between"
					>
						<div class="flex items-center gap-3">
							<Avatar
								src={moderator.profilePictureUrl}
								size="sm"
								alt={`${moderator.username}'s profile picture`}
							/>
							<div>
								<p>{moderator.username}</p>
								<p class="ml-2 text-sm text-gray-500 dark:text-gray-400">ID: {moderator.id}</p>
								<p class="ml-2 text-sm text-gray-500 dark:text-gray-400">
									Role: {capitalize(moderator.role)}
								</p>
								{#if moderator.superRolePromotionAt !== null}
									<p class="ml-2 text-sm text-gray-500 dark:text-gray-400">
										Promoted At: {formatDate(new Date(moderator.superRolePromotionAt))}
									</p>
								{/if}
							</div>
						</div>
						<a href={`/profile/${moderator.username}`}>
							<Button color="blue" size="sm">View Profile</Button>
						</a>
					</ListgroupItem>
				{/each}
			</Listgroup>
		{:else}
			<p class="p-2 text-center text-gray-500 dark:text-gray-400">No moderators found</p>
		{/if}
	</section>
{/if}
