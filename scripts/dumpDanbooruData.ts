import { Faker, en } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import fs from "fs";

type DanbooruPost = {
    createdAt: string;
    isNsfw: boolean;
    tags: string[];
    imageUrl: string;
    views: number;
    likes: number;
};

type User = {
    id: string;
    username: string;
    createdAt: Date;
    email: string;
    profilePictureUrl: string;
    password: string;
}

const TOTAL_ARTISTS = 3000;

const BUFFER_SIZE = 20;

const getRandomArtists = (faker: Faker, artists: string[]) => {
    const artistSet = new Set<string>();
    const sampleSize = faker.number.int({ min: 1, max: 6 });

    while (artistSet.size < sampleSize) {
        const randomArtist = artists[Math.floor(Math.random() * artists.length)];
        artistSet.add(randomArtist);
    }

    return Array.from(artistSet);
}

const getRandomUser = (users: User[]) => {
    return users[Math.floor(Math.random() * users.length)];
}

const generatePostCreationPromise = (user: User, post: DanbooruPost, artists: string[], description: string, prismaClient: PrismaClient) => {
    return prismaClient.post.create({
        data: {
            authorId: user.id,
            description,
            isNsfw: post.isNsfw,
            views: post.views,
            likes: post.likes,
            imageUrls: [post.imageUrl],
            createdAt: new Date(post.createdAt),
            artists: {
                connectOrCreate: artists.map(artist => {
                    return {
                        where: { name: artist },
                        create: { name: artist }
                    }
                })
            },
            tags: {
                connectOrCreate: post.tags.map(tag => {
                    return {
                        where: { name: tag },
                        create: { name: tag },
                    }
                })
            }
        }
    });
}

async function main() {
    const prismaClient = new PrismaClient();

    try {
        const users = await prismaClient.user.findMany({ take: 20, skip: 0 });

        console.log('deleting existing posts, artists and tags from the database');
        await prismaClient.tag.deleteMany({});
        await prismaClient.artist.deleteMany({});
        await prismaClient.post.deleteMany({});
        console.log('deleted all data');

        const faker = new Faker({ locale: [en] });

        const artistSet = new Set<string>();
        while (artistSet.size < TOTAL_ARTISTS) {
            const randomArtist = faker.person.fullName().toLocaleLowerCase().trim();
            artistSet.add(randomArtist);
        }
        const artists = Array.from(artistSet);

        const posts = JSON.parse(fs.readFileSync('mock_data/danbooru/dataset.json', 'utf-8')) as DanbooruPost[];

        const tagSet = new Set<string>();
        posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
        const tags = Array.from(tagSet);

        console.log('adding artist and tag set to database');
        await prismaClient.tag.createMany({
            data: tags.map(tag => {
                return {
                    id: faker.string.uuid(),
                    name: tag,
                }
            })
        });
        await prismaClient.artist.createMany({
            data: artists.map(artist => {
                return {
                    id: faker.string.uuid(),
                    name: artist,
                }
            })
        });
        console.log('done adding tags and artists');

        let postsProcessed = 0;
        let currentPostBuffer: DanbooruPost[] = [];
        for (const post of posts) {
            currentPostBuffer.push(post);
            if (currentPostBuffer.length === BUFFER_SIZE) {
                const postCreationPromises = currentPostBuffer.map(post => generatePostCreationPromise(getRandomUser(users), post, getRandomArtists(faker, artists), faker.lorem.paragraph(), prismaClient))
                await Promise.allSettled(postCreationPromises);
                postsProcessed += currentPostBuffer.length;
                console.log(`processed ${postsProcessed} so far`);
                currentPostBuffer = [];
            }
        }

    } finally {
        prismaClient.$disconnect();
    }

}

main();