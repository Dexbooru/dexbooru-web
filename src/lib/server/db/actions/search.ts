import type {
	IAppSearchResult,
	TPostSearchResults,
	TUserSearchResults
} from '$lib/shared/types/search';
import { Prisma, type Artist, type Tag } from '@prisma/client';
import prisma from '../prisma';

export async function searchForTags(query: string, limit: number): Promise<IAppSearchResult> {
	const searchStatement = Prisma.sql`
      SELECT
          t."id", t."name"
      FROM 
          "Tag" t
      WHERE
          t."searchable" @@ phraseto_tsquery('english', ${Prisma.raw(`'${query}'`)}) OR
          LOWER(t."name") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(t."id") ILIKE ${Prisma.raw(`'%${query}%'`)}
      LIMIT 
          ${Prisma.raw(limit.toString())}
    `;

	const results = (await prisma.$queryRaw(searchStatement)) as Tag[];
	return { tags: results };
}

export async function searchForArtists(query: string, limit: number): Promise<IAppSearchResult> {
	const searchStatement = Prisma.sql`
      SELECT
          a."id", a."name"
      FROM 
          "Artist" a
      WHERE
          a."searchable" @@ phraseto_tsquery('english', ${Prisma.raw(`'${query}'`)}) OR
          LOWER(a."name") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(a."id") ILIKE ${Prisma.raw(`'%${query}%'`)}
      LIMIT 
          ${Prisma.raw(limit.toString())}
    `;

	const results = (await prisma.$queryRaw(searchStatement)) as Artist[];
	return { artists: results };
}

export async function searchForPosts(query: string, limit: number): Promise<IAppSearchResult> {
	const searchStatement = Prisma.sql`
      SELECT
          p."id", 
          p."description", 
          p."createdAt", 
          u."username" AS "uploaderName",
          u."profilePictureUrl" AS "uploaderProfilePictureUrl"
      FROM 
          "Post" p
      INNER JOIN 
        "User" u
      ON
        p."authorId" = u."id"
      WHERE
          p."searchable" @@ phraseto_tsquery('english', ${Prisma.raw(`'${query}'`)}) OR
          LOWER(p."id") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(p."description") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(u."username") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(u."id") ILIKE ${Prisma.raw(`'%${query}%'`)}
      LIMIT 
          ${Prisma.raw(limit.toString())}
    `;

	const results = (await prisma.$queryRaw(searchStatement)) as TPostSearchResults;
	return { posts: results };
}

export async function searchForUsers(query: string, limit: number): Promise<IAppSearchResult> {
	const searchStatement = Prisma.sql`
     SELECT
        u."id", u."username", u."profilePictureUrl", u."createdAt" 
     FROM 
        "User" u
     WHERE
        u."searchable" @@ phraseto_tsquery('english', ${Prisma.raw(`'${query}'`)}) OR
        LOWER(u."id") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
        LOWER(u."username") ILIKE ${Prisma.raw(`'%${query}%'`)}
     LIMIT 
        ${Prisma.raw(limit.toString())}
    `;

	const results = (await prisma.$queryRaw(searchStatement)) as TUserSearchResults;
	return { users: results };
}

export async function searchAllSections(query: string, limit: number): Promise<IAppSearchResult> {
	const [usersResult, postsResult, tagsResult, artistsResult] = await Promise.all([
		searchForUsers(query, limit),
		searchForPosts(query, limit),
		searchForTags(query, limit),
		searchForArtists(query, limit)
	]);

	return {
		posts: postsResult.posts,
		users: usersResult.users,
		tags: tagsResult.tags,
		artists: artistsResult.artists
	};
}
