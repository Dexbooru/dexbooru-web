import type { IUser } from '$lib/shared/types/users';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: IUser | null | undefined;
		}
		interface PageData {
			user: IUser | null | undefined;
		}
		// interface Platform {}
	}
}

export {};
