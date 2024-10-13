import type { IAuthFieldRequirements } from '$lib/shared/types/auth';
import type { TChatFriend } from '$lib/shared/types/friends';
import type { ChatManager } from '../helpers/chat';
import type { TChatMessage, TChatRoom } from './core';

export interface IFooterStoreData {
	height: number;
	bottom: number;
	element: HTMLElement | null;
}

export interface IModalStoreData {
	isOpen: boolean;
	focusedModalName: string | null;
	modalData?: unknown;
}

export interface IChatStoreData {
	rooms: TChatRoom[];
	friends: TChatFriend[];
	manager: ChatManager | null;
	messages: Map<string, TChatMessage[]>;
}

export interface IAuthFormRequirementData {
	username?: IAuthFieldRequirements;
	password?: IAuthFieldRequirements;
	confirmedPassword?: boolean;
	email?: IAuthFieldRequirements;
}
