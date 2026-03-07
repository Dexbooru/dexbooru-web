import type { TRealtimeNotification, TNotificationType } from '$lib/shared/types/notifcations';

export enum ConnectionState {
	Disconnected = 'disconnected',
	Connecting = 'connecting',
	Connected = 'connected',
}

export type NotificationEventHandler = (notification: TRealtimeNotification) => void;
export type ConnectionStateHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Event) => void;

export class NotificationWebSocketClient {
	private static readonly INITIAL_RECONNECT_DELAY_MS = 1000;
	private static readonly MAX_RECONNECT_DELAY_MS = 30000;
	private static readonly RECONNECT_BACKOFF_MULTIPLIER = 2;

	private readonly baseUrl: string;
	private socket: WebSocket | null = null;
	private reconnectDelay: number = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalClose = false;

	private _connectionState: ConnectionState = ConnectionState.Disconnected;
	private onMessageHandler: NotificationEventHandler | null;
	private onStateChangeHandler: ConnectionStateHandler | null;
	private onErrorHandler: ErrorHandler | null;

	constructor(
		baseUrl: string,
		options?: {
			onMessage?: NotificationEventHandler;
			onStateChange?: ConnectionStateHandler;
			onError?: ErrorHandler;
		},
	) {
		this.baseUrl = baseUrl.replace(/^http/, 'ws');
		this.onMessageHandler = options?.onMessage ?? null;
		this.onStateChangeHandler = options?.onStateChange ?? null;
		this.onErrorHandler = options?.onError ?? null;
	}

	get connectionState(): ConnectionState {
		return this._connectionState;
	}

	private setConnectionState(state: ConnectionState): void {
		this._connectionState = state;
		this.onStateChangeHandler?.(state);
	}

	public connect(): void {
		if (
			this.socket?.readyState === WebSocket.OPEN ||
			this._connectionState === ConnectionState.Connecting
		) {
			return;
		}

		this.intentionalClose = false;
		this.setConnectionState(ConnectionState.Connecting);

		const wsUrl = `${this.baseUrl}/events`;
		this.socket = new WebSocket(wsUrl);

		this.socket.onopen = this.handleOpen.bind(this);
		this.socket.onclose = this.handleClose.bind(this);
		this.socket.onerror = this.handleError.bind(this);
		this.socket.onmessage = this.handleMessage.bind(this);
	}

	public disconnect(): void {
		this.intentionalClose = true;
		this.clearReconnectTimer();

		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}

		this.setConnectionState(ConnectionState.Disconnected);
	}

	public reconnect(): void {
		this.disconnect();
		this.intentionalClose = false;
		this.reconnectDelay = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
		this.connect();
	}

	public isConnected(): boolean {
		return this._connectionState === ConnectionState.Connected;
	}

	private handleOpen(): void {
		this.reconnectDelay = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
		this.setConnectionState(ConnectionState.Connected);
	}

	private handleClose(): void {
		this.socket = null;
		this.setConnectionState(ConnectionState.Disconnected);

		if (!this.intentionalClose) {
			this.scheduleReconnect();
		}
	}

	private handleError(event: Event): void {
		this.onErrorHandler?.(event);
	}

	private handleMessage(event: MessageEvent): void {
		try {
			const raw = JSON.parse(event.data as string) as Record<string, unknown>;
			const notification = this.parseNotification(raw);
			if (notification) {
				this.onMessageHandler?.(notification);
			}
		} catch {
			// Malformed message; ignore
		}
	}

	private parseNotification(raw: Record<string, unknown>): TRealtimeNotification | null {
		const type = this.inferNotificationType(raw);
		if (!type) return null;

		return { ...raw, type } as unknown as TRealtimeNotification;
	}

	private inferNotificationType(payload: Record<string, unknown>): TNotificationType | null {
		if ('likerUserId' in payload && 'postId' in payload && 'totalLikes' in payload) {
			return 'new_post_like';
		}
		if ('commentAuthorId' in payload && 'commentContent' in payload) {
			return 'new_post_comment';
		}
		if ('senderUserId' in payload && 'receiverUserId' in payload && 'status' in payload) {
			return 'friend_invite';
		}
		return null;
	}

	private scheduleReconnect(): void {
		this.clearReconnectTimer();

		this.reconnectTimer = setTimeout(() => {
			this.connect();
		}, this.reconnectDelay);

		this.reconnectDelay = Math.min(
			this.reconnectDelay * NotificationWebSocketClient.RECONNECT_BACKOFF_MULTIPLIER,
			NotificationWebSocketClient.MAX_RECONNECT_DELAY_MS,
		);
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
}
