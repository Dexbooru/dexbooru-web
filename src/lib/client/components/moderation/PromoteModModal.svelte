<script lang="ts">
	import { UserRole } from '$generated/prisma/browser';
	import { updateUserRole } from '$lib/client/api/users';
	import { PROMOTE_USER_MODAL_NAME } from '$lib/client/constants/layout';
	import { MODERATION_NAME_MAP } from '$lib/client/constants/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getModerationPaginationData,
	} from '$lib/client/helpers/context';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Select from 'flowbite-svelte/Select.svelte';

	const user = getAuthenticatedUser();
	const activeModal = getActiveModal();
	const moderationData = getModerationPaginationData();

	let promotionUsername = $state('');
	let selectedNewRole = $state<UserRole | ''>('');
	let updatingUserRole = $state(false);
	let updateRoleButtonDisabled = $derived.by(() => {
		const promotionExists = $moderationData?.moderators.some(
			(moderator) =>
				(moderator.username === promotionUsername || moderator.id === promotionUsername) &&
				moderator.role === selectedNewRole,
		);

		return (
			promotionUsername.length === 0 ||
			selectedNewRole.length === 0 ||
			($user &&
				($user.username || $user.id) === promotionUsername &&
				selectedNewRole === 'OWNER') ||
			($user && ($user.username || $user.id) === promotionUsername && $user.role === 'OWNER') ||
			promotionExists ||
			updatingUserRole
		);
	});

	const resetStates = () => {
		promotionUsername = '';
		selectedNewRole = '';
	};

	const handleModalClose = () => {
		resetStates();
		activeModal.set({ isOpen: false, focusedModalName: null });
	};

	const handleUpdateUserRole = async () => {
		if (promotionUsername === '' || selectedNewRole === '') return;

		updatingUserRole = true;

		const response = await updateUserRole(promotionUsername, selectedNewRole);
		if (response.ok) {
			const responseData: TApiResponse<TUser> = await response.json();
			const updatedUser = responseData.data;

			moderationData.update((data) => {
				if (data) {
					if (updatedUser.role === 'USER') {
						data.moderators = data.moderators.filter(
							(moderator) => moderator.id !== updatedUser.id,
						);
					} else if (data.moderators.some((moderator) => moderator.id === updatedUser.id)) {
						data.moderators = data.moderators.map((moderator) =>
							moderator.id === updatedUser.id ? updatedUser : moderator,
						);
					} else {
						data.moderators.push(updatedUser);
					}
				}

				return data;
			});

			activeModal.set({ isOpen: false, focusedModalName: null });
			toast.push(`The user's role was successfully updated`, SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push(
				'An unexpected error occured while updating the user role!',
				FAILURE_TOAST_OPTIONS,
			);
		}

		updatingUserRole = false;
	};
</script>

<Modal
	outsideclose
	open={$activeModal.isOpen && $activeModal.focusedModalName === PROMOTE_USER_MODAL_NAME}
	onclose={handleModalClose}
	title="Promote/Demote a user for moderation"
>
	<Label class="mb-1" for="promotion-username">
		Please enter the username or user id of who you want to promote:</Label
	>
	<Input
		id="promotion-username"
		type="url"
		bind:value={promotionUsername}
		name="promotionUsername"
		placeholder="Enter the username or user id"
		required
		class="w-full rounded-md border border-gray-300 p-2"
	/>

	<Label class="mb-1" for="new-role">Select the updated role:</Label>
	<Select
		name="new-role"
		items={[
			{ value: 'OWNER', name: MODERATION_NAME_MAP.OWNER },
			{ value: 'MODERATOR', name: MODERATION_NAME_MAP.MODERATOR },
			{ value: 'USER', name: MODERATION_NAME_MAP.USER },
		]}
		bind:value={selectedNewRole}
	/>

	<Button disabled={updateRoleButtonDisabled} onclick={handleUpdateUserRole}>Update role</Button>

	{#if selectedNewRole === 'OWNER' && promotionUsername.length > 0 && $user && $user.username !== promotionUsername}
		<Alert color="red">
			<span class="font-medium">Dangerous move!</span>
			<br />
			You will lose ownership of this instance of Dexbooru, and it will be handed over to the user called:
			{promotionUsername}.
			<br />
			You will get demoted to a role of: {MODERATION_NAME_MAP.MODERATOR}
		</Alert>
	{/if}

	{#if $user && $user.username === promotionUsername && $user.role === 'OWNER'}
		<Alert color="red"
			>You cannot update your own role, as Dexbooru needs a single active owner every time</Alert
		>
	{/if}
</Modal>
