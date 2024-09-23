import type { IUser } from '$lib/shared/types/users';

declare global {
	namespace App {
		interface Locals {
			user: IUser;
		}
		interface PageData {
			user: IUser;
		}
	}
}

export { };

