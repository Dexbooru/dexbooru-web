import type { TNotificationType, TRealtimeNotification } from '$lib/shared/types/notifcations';

export enum ConnectionState {
	Disconnected = 'disconnected',
	Connecting = 'connecting',
	Connected = 'connected',
}

export type NotificationEventHandler = (notification: TRealtimeNotification) => void;
export type ConnectionStateHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Event) => void;
export type AuthenticationFailedHandler = () => void;

/** Close codes that indicate auth failure; no reconnect. */
const AUTH_FAILURE_CLOSE_CODES = new Set([
	1008, // Policy violation (often used for auth rejection)
	4001,
	4003, // Private use: Unauthorized, Forbidden
	4401,
	4403, // Private use: Unauthorized, Forbidden
]);

/** RFC 6455 1011: server error; treat like HTTP 5xx — no reconnect. */
const SERVER_ERROR_CLOSE_CODE = 1011;

export class NotificationWebSocketClient {
	private static readonly INITIAL_RECONNECT_DELAY_MS = 1000;
	private static readonly MAX_RECONNECT_DELAY_MS = 30000;
	private static readonly RECONNECT_BACKOFF_MULTIPLIER = 2;
	private static readonly MAX_CONSECUTIVE_FAILURES_WITHOUT_OPEN = 3;

	private readonly baseUrl: string;
	private socket: WebSocket | null = null;
	private reconnectDelay: number = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalClose = false;
	/** True once onopen fired for the current socket (distinguishes handshake/timeout failures). */
	private socketOpenedThisConnection = false;
	private consecutiveFailuresWithoutOpen = 0;
	/** Stops auto-reconnect until the next explicit connect() or reconnect(). */
	private reconnectDisabled = false;

	private _connectionState: ConnectionState = ConnectionState.Disconnected;
	private onMessageHandler: NotificationEventHandler | null;
	private onStateChangeHandler: ConnectionStateHandler | null;
	private onErrorHandler: ErrorHandler | null;
	private onAuthenticationFailedHandler: AuthenticationFailedHandler | null;

	constructor(
		baseUrl: string,
		options?: {
			onMessage?: NotificationEventHandler;
			onStateChange?: ConnectionStateHandler;
			onError?: ErrorHandler;
			onAuthenticationFailed?: AuthenticationFailedHandler;
		},
	) {
		this.baseUrl = baseUrl.replace(/^http/, 'ws');
		this.onMessageHandler = options?.onMessage ?? null;
		this.onStateChangeHandler = options?.onStateChange ?? null;
		this.onErrorHandler = options?.onError ?? null;
		this.onAuthenticationFailedHandler = options?.onAuthenticationFailed ?? null;
	}

	get connectionState(): ConnectionState {
		return this._connectionState;
	}

	private setConnectionState(state: ConnectionState): void {
		this._connectionState = state;
		this.onStateChangeHandler?.(state);
	}

	public connect(): void {
		this.reconnectDisabled = false;
		this.consecutiveFailuresWithoutOpen = 0;
		this.connectInternal();
	}

	private connectInternal(): void {
		if (
			this.socket?.readyState === WebSocket.OPEN ||
			this._connectionState === ConnectionState.Connecting
		) {
			return;
		}

		if (this.reconnectDisabled) {
			return;
		}

		this.intentionalClose = false;
		this.socketOpenedThisConnection = false;
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
		this.reconnectDisabled = false;
		this.consecutiveFailuresWithoutOpen = 0;
		this.reconnectDelay = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
		this.connectInternal();
	}

	public isConnected(): boolean {
		return this._connectionState === ConnectionState.Connected;
	}

	private handleOpen(): void {
		this.socketOpenedThisConnection = true;
		this.consecutiveFailuresWithoutOpen = 0;
		this.reconnectDelay = NotificationWebSocketClient.INITIAL_RECONNECT_DELAY_MS;
		this.setConnectionState(ConnectionState.Connected);
	}

	private isAuthFailureClose(event: CloseEvent): boolean {
		if (AUTH_FAILURE_CLOSE_CODES.has(event.code)) return true;
		const r = (event.reason ?? '').trim();
		if (!r) return false;
		if (/\b401\b/.test(r)) return true;
		if (/\b403\b/.test(r)) return true;
		return /unauthorized|forbidden/i.test(r);
	}

	private isServerErrorClose(event: CloseEvent): boolean {
		if (event.code === SERVER_ERROR_CLOSE_CODE) return true;
		const r = (event.reason ?? '').trim();
		if (!r) return false;
		return /\b5\d{2}\b/.test(r);
	}

	private handleClose(event: CloseEvent): void {
		// Ignore stale closes after disconnect() or when a new socket replaced this one.
		if (this.socket !== null && event.target !== this.socket) {
			return;
		}

		const opened = this.socketOpenedThisConnection;
		this.socketOpenedThisConnection = false;
		this.socket = null;
		this.setConnectionState(ConnectionState.Disconnected);

		if (this.intentionalClose) {
			return;
		}

		if (this.isAuthFailureClose(event)) {
			this.onAuthenticationFailedHandler?.();
			return;
		}

		if (this.isServerErrorClose(event)) {
			return;
		}

		if (!opened) {
			this.consecutiveFailuresWithoutOpen++;
			if (
				this.consecutiveFailuresWithoutOpen >=
				NotificationWebSocketClient.MAX_CONSECUTIVE_FAILURES_WITHOUT_OPEN
			) {
				this.reconnectDisabled = true;
				return;
			}
		}

		this.scheduleReconnect();
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
		if (this.reconnectDisabled) {
			return;
		}

		this.clearReconnectTimer();

		this.reconnectTimer = setTimeout(() => {
			this.connectInternal();
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
