export interface ICoreApiResponse<T = unknown> {
	type?: string;
	reason?: string;
	data?: T;
}

export type TChatRoom = {
	id: string;
	createdAt: number;
	updatedAt: number;
	participants: string[];
};

export type TEventHubMessageType = 'chatMessage' | 'customMessage' | 'ping';
export type TUserStatusType = 'online' | 'offline' | 'do-not-disturb';

export type TChatMessage = {
	id: string;
	roomId: string;
	content: string;
	authorId: string;
	createdAt: number;
	updatedAt: number;
	reactions: string[];
};

export type TCustomStatusMessage = {
	userId: string;
	status: string;
};

export type TEventHubMessage<T> = {
	type: TEventHubMessageType;
	data: T;
};
