import { writable } from "svelte/store";
import type { TChatMessage } from "../types/core";
import type { IChatStoreData } from "../types/stores";

export const chatStore = writable<IChatStoreData>({
    rooms: [],
    friends: [],
    manager: null,
    messages: new Map<string, TChatMessage[]>(),
})