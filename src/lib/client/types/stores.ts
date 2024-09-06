import type { TChatFriend } from "$lib/shared/types/friends";
import type { TChatRoom } from "./core";

export interface IFooterStoreData {
	height: number;
	bottom: number;
	element: HTMLElement | null;
}

export interface IModalStoreData {
	isOpen: boolean;
	focusedModalName: string | null;
}


export interface IChatStoreData {
	rooms: TChatRoom[];
	friends: TChatFriend[];
}