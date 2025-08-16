import { faker } from '@faker-js/faker';
import type {
	Artist,
	Comment,
	Post,
	PostCollection,
	PostModerationStatus,
	Tag,
	User,
	UserRole,
} from '@prisma/client';

const userFactory = (overrides: Partial<User> = {}): User => {
	return {
		id: faker.string.uuid(),
		username: faker.internet.userName().substring(0, 12),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		email: faker.internet.email(),
		profilePictureUrl: faker.image.avatar(),
		password: faker.internet.password(),
		role: 'USER' as UserRole,
		superRolePromotionAt: null,
		...overrides,
	};
};

const commentFactory = (overrides: Partial<Comment> = {}): Comment => {
	return {
		id: faker.string.uuid(),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		content: faker.lorem.sentence(),
		replyCount: 0,
		postId: faker.string.uuid(),
		parentCommentId: null,
		authorId: faker.string.uuid(),
		...overrides,
	};
};

const postFactory = (overrides: Partial<Post> = {}): Post => {
	return {
		id: faker.string.uuid(),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		description: faker.lorem.sentence(),
		sourceLink: faker.internet.url(),
		isNsfw: faker.datatype.boolean(),
		likes: faker.number.int(1000),
		views: faker.number.int(10000),
		moderationStatus: 'PENDING' as PostModerationStatus,
		imageUrls: [faker.image.url()],
		imageWidths: [faker.number.int({ min: 200, max: 1200 })],
		imageHeights: [faker.number.int({ min: 200, max: 1200 })],
		commentCount: 0,
		tagString: '',
		artistString: '',
		authorId: faker.string.uuid(),
		...overrides,
	};
};

const postCollectionFactory = (overrides: Partial<PostCollection> = {}): PostCollection => {
	return {
		id: faker.string.uuid(),
		title: faker.lorem.words(3),
		description: faker.lorem.sentence(),
		isNsfw: faker.datatype.boolean(),
		thumbnailImageUrls: [faker.image.imageUrl()],
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		authorId: faker.string.uuid(),
		...overrides,
	};
};

const tagFactory = (overrides: Partial<Tag> = {}): Tag => {
	return {
		id: faker.string.uuid(),
		name: faker.lorem.word(),
		description: faker.lorem.sentence(),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		postCount: 0,
		...overrides,
	};
};

const artistFactory = (overrides: Partial<Artist> = {}): Artist => {
	return {
		id: faker.string.uuid(),
		name: faker.person.fullName(),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		socialMediaLinks: [faker.internet.url()],
		description: faker.lorem.sentence(),
		postCount: 0,
		...overrides,
	};
};

const user = Object.assign(userFactory, {
	createMany: (count: number, overrides: Partial<User> = {}): User[] => {
		return Array.from({ length: count }, () => userFactory(overrides));
	},
});

const comment = Object.assign(commentFactory, {
	createMany: (count: number, overrides: Partial<Comment> = {}): Comment[] => {
		return Array.from({ length: count }, () => commentFactory(overrides));
	},
});

const post = Object.assign(postFactory, {
	createMany: (count: number, overrides: Partial<Post> = {}): Post[] => {
		return Array.from({ length: count }, () => postFactory(overrides));
	},
});

const postCollection = Object.assign(postCollectionFactory, {
	createMany: (count: number, overrides: Partial<PostCollection> = {}): PostCollection[] => {
		return Array.from({ length: count }, () => postCollectionFactory(overrides));
	},
});

const tag = Object.assign(tagFactory, {
	createMany: (count: number, overrides: Partial<Tag> = {}): Tag[] => {
		return Array.from({ length: count }, () => tagFactory(overrides));
	},
});

const artist = Object.assign(artistFactory, {
	createMany: (count: number, overrides: Partial<Artist> = {}): Artist[] => {
		return Array.from({ length: count }, () => artistFactory(overrides));
	},
});

export default { artist, comment, post, postCollection, tag, user };
