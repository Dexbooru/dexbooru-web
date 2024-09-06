import { writable } from "svelte/store";
import type { IChatStoreData } from "../types/stores";

export const chatStore = writable<IChatStoreData>({
    rooms: [],
    friends: [],
})