import type { TPostCollection } from '$lib/shared/types/collections';
import type { TPost } from '$lib/shared/types/posts';
import type { TUser } from '$lib/shared/types/users';
import type { Prisma, UserPreference } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export type TUserSelector = Prisma.UserSelect<DefaultArgs>;

export type TUserExportData = { 
    user: TUser;
    friends?: TUser[];
    uploadedPosts?: TPost[];
    likedPosts?: TPost[];
    createdPostCollections?: TPostCollection[]; 
    preferences?: UserPreference;
}