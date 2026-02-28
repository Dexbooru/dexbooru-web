import type { TAuthFieldRequirements } from '$lib/shared/types/auth';

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

export type TAuthFormRequirementData = {
	username?: TAuthFieldRequirements;
	password?: TAuthFieldRequirements;
	confirmedPassword?: boolean;
	email?: TAuthFieldRequirements;
};
