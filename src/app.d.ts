import type { TCollectionOrderByColumn, TPostCollection } from '$lib/shared/types/collections';
import type { TPost, TPostOrderByColumn } from '$lib/shared/types/posts';
import type { TUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';

declare global {
	namespace App {
		interface Locals {
			user: TUser;
		}
		interface PageData {
			user: TUser;
			userPreferences?: UserPreference;
			posts?: TPost[];
			collections?: TPostCollection[];
			orderBy?: TPostOrderByColumn | TCollectionOrderByColumn;
			ascending?: boolean;
			pageNumber?: number;
		}
	}
}

export { };

