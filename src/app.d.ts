import type { TUser } from '$lib/shared/types/users';

declare global {
	namespace App {
		interface Locals {
			user: TUser;
		}
		interface PageData {
			user: TUser;
		}
	}
}

export {};
