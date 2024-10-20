import type { TAuthFieldRequirements } from '$lib/shared/types/auth';
import type { TChatFriend } from '$lib/shared/types/friends';
import type { ChatManager } from '../helpers/chat';
import type { TChatMessage, TChatRoom } from './core';

export type TFooterStoreData = {
	height: number;
	bottom: number;
	element: HTMLElement | null;
};

export type TModalStoreData = {
	isOpen: boolean;
	focusedModalName: string | null;
	modalData?: unknown;
};

export type TChatStoreData = {
	rooms: TChatRoom[];
	friends: TChatFriend[];
	manager: ChatManager | null;
	messages: Map<string, TChatMessage[]>;
};

export type TAuthFormRequirementData = {
	username?: TAuthFieldRequirements;
	password?: TAuthFieldRequirements;
	confirmedPassword?: boolean;
	email?: TAuthFieldRequirements;
};
