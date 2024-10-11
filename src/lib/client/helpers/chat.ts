import { DEXBOORU_CORE_API_CHAT_WS_URL } from '$lib/shared/constants/chat';
import { get } from 'svelte/store';
import { chatStore } from '../stores/chat';
import { authenticatedUserStore } from '../stores/users';
import type { TChatMessage, TEventHubMessage } from '../types/core';

const DEFAULT_PING_INTERVAL_MS = 25_000;
const DEFAULT_RECONNECT_INTERVAL_MS = 5000;

export class ChatManager {
	socket: WebSocket;
	socketPingIntervalMs: number;
	socketReconnectIntervalMs: number;
	socketPingIntervalId: NodeJS.Timeout | null;
	socketReconnectIntervalId: NodeJS.Timeout | null;

	constructor(
		pingIntervalMs: number = DEFAULT_PING_INTERVAL_MS,
		reconnectIntervalMs: number = DEFAULT_RECONNECT_INTERVAL_MS,
	) {
		this.socket = new WebSocket(DEXBOORU_CORE_API_CHAT_WS_URL);
		this.socketPingIntervalMs = pingIntervalMs;
		this.socketReconnectIntervalMs = reconnectIntervalMs;
		this.socketPingIntervalId = null;
		this.socketReconnectIntervalId = null;
	}

	sendMessage(roomId: string, content: string) {
		const authenticatedUser = get(authenticatedUserStore);
		if (!authenticatedUser) return;

		const { id: authorId } = authenticatedUser;
		const chatMessage: TChatMessage = {
			id: Date.now().toString(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
			content,
			roomId,
			authorId,
			reactions: [],
		};
		const eventMessage: TEventHubMessage<TChatMessage> = {
			type: 'chatMessage',
			data: chatMessage,
		};

		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(eventMessage));
		}
	}

	registerIntervals() {
		const socketPingIntervalId = setInterval(() => {
			const eventMessage: TEventHubMessage<string> = {
				type: 'ping',
				data: 'heartbeat',
			};
			if (this.socket.readyState === WebSocket.OPEN) {
				this.socket.send(JSON.stringify(eventMessage));
			}
		}, this.socketPingIntervalMs);

		const socketReconnectIntervalId = setInterval(() => {
			if (this.socket.readyState === WebSocket.CLOSED) {
				this.socket = new WebSocket(DEXBOORU_CORE_API_CHAT_WS_URL);
			}
		}, this.socketReconnectIntervalMs);

		this.socketPingIntervalId = socketPingIntervalId;
		this.socketReconnectIntervalId = socketReconnectIntervalId;
	}

	registerListeners() {
		this.socket.onmessage = (eventMessage) => {
			const incomingEventMessage = JSON.parse(eventMessage.data) as TEventHubMessage<unknown>;
			switch (incomingEventMessage.type) {
				case 'chatMessage':
					this.processIncomingChatMessage(incomingEventMessage as TEventHubMessage<TChatMessage>);
					break;
				case 'customMessage':
					break;
				default:
					break;
			}
		};
	}

	cleanup() {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.close();
		}

		if (this.socketPingIntervalId !== null) {
			clearInterval(this.socketPingIntervalId);
		}

		if (this.socketReconnectIntervalId !== null) {
			clearInterval(this.socketReconnectIntervalId);
		}
	}

	private processIncomingChatMessage(incomingEventMessage: TEventHubMessage<TChatMessage>) {
		const newChatMessage = incomingEventMessage.data as TChatMessage;
		chatStore.update((data) => {
			const { roomId } = newChatMessage;
			if (!data.messages.has(roomId)) {
				data.messages.set(roomId, []);
			}

			const messages = data.messages.get(roomId);
			messages?.push(newChatMessage);

			return data;
		});
	}
}
