export interface IFooterStoreData {
	height: number;
	bottom: number;
	element: HTMLElement | null;
}

export interface IModalStoreData {
	isOpen: boolean;
	focusedModalName: string | null;
}
