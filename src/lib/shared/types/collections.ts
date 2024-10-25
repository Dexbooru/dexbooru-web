import type { PostCollection } from "@prisma/client";

export type TCollectionPaginationData = {
	collections: PostCollection[];
	pageNumber: number;
};
