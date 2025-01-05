
export const DEXBOORU_CORE_API_URL: string = import.meta.env.VITE_DEXBOORU_CORE_API_URL ?? '';

const wsProtocol = DEXBOORU_CORE_API_URL.toLocaleLowerCase().startsWith('https') ? 'wss' : 'ws';
const apiHost = DEXBOORU_CORE_API_URL.split('://')[1];

export const DEXBOORU_CORE_API_CHAT_WS_URL = `${wsProtocol}://${apiHost}/api/auth/chat/rooms/serve`;