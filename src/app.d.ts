import type { IUser } from '$lib/shared/types/users';
import type { User } from '@prisma/client';

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
