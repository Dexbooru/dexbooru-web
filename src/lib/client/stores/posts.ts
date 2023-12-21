import type { IPost } from "$lib/shared/types/posts";
import { writable } from "svelte/store";

export const postsPageStore = writable<IPost[]>([]);