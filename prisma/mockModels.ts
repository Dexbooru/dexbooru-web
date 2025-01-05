import { Faker, en, faker } from '@faker-js/faker';
import { Artist, Comment, Post, Tag, User } from '@prisma/client';
import { hashPassword } from '../src/lib/server/helpers/password';
import {
	MAXIMUM_EMAIL_LENGTH,
	MAXIMUM_USERNAME_LENGTH,
	MINIMUM_USERNAME_LENGTH
} from '../src/lib/shared/constants/auth';
import { MAXIMUM_CONTENT_LENGTH } from '../src/lib/shared/constants/comments';
import { MAXIMUM_IMAGES_PER_POST } from '../src/lib/shared/constants/images';
import CommentTree from '../src/lib/shared/helpers/comments';

export type IMockPost = Post & { tags: Tag[]; artists: Artist[] };

interface IMockModelSettings {
	numberOfUsers?: number;
	numberOfTags?: number;
	numberOfArtists?: number;
	numberOfPosts?: number;
	numberOfComments?: number;
}

interface IFakerMockGeneratorConfig {
	modelSettings: IMockModelSettings;
	seed: number;
}

interface ILabelData {
	id: string;
	name: string;
}

class FakerMockGenerator {
	private enFaker: Faker;
	private modelSettings: IMockModelSettings;

	constructor({ modelSettings, seed }: IFakerMockGeneratorConfig) {
		this.enFaker = new Faker({ locale: [en] });
		this.enFaker.seed(seed);
		this.modelSettings = modelSettings;
	}

	private randomUserId(mockUsers: Partial<User>[]): string {
		const index = this.enFaker.helpers.rangeToNumber({ min: 0, max: mockUsers.length - 1 });
		return mockUsers[index].id || '';
	}

	private randomPostId(mockPosts: Post[]): string {
		const index = this.enFaker.helpers.rangeToNumber({ min: 0, max: mockPosts.length - 1 });
		return mockPosts[index].id;
	}

	private randomParentCommentId(mockComments: Comment[], ignoreCommentId: string): string | null {
		const isTopLevel = this.enFaker.helpers.rangeToNumber({ min: 0, max: 1 }) === 0;
		if (isTopLevel) return null;

		let index = this.enFaker.helpers.rangeToNumber({ min: 0, max: mockComments.length - 1 });
		while (mockComments[index].id === ignoreCommentId) {
			index = this.enFaker.helpers.rangeToNumber({ min: 0, max: mockComments.length - 1 });
		}

		return mockComments[index].id;
	}

	private randomLabelSample(mockLabels: ILabelData[], sampleSize: number): ILabelData[] {
		const sampleLabels: ILabelData[] = [];

		while (sampleLabels.length < sampleSize) {
			const index = this.enFaker.helpers.rangeToNumber({ min: 0, max: mockLabels.length - 1 });
			const randomLabel = mockLabels[index];

			if (sampleLabels.find((label) => label.id === randomLabel.id)) continue;
			sampleLabels.push(randomLabel);
		}

		return sampleLabels;
	}

	private async buildDevPassword(): Promise<string> {
		const realPassword = 'root_password_12345';
		return await hashPassword(realPassword);
	}

	async generateMockUsers(n: number): Promise<Partial<User>[]> {
		const mockUsers: Partial<User>[] = [];

		for (let i = 0; i < n; i++) {
			const mockUser: Partial<User> = {
				id: this.enFaker.string.uuid(),
				email: this.enFaker.internet.email().slice(0, MAXIMUM_EMAIL_LENGTH),
				username: this.enFaker.string.alpha({
					length: faker.helpers.rangeToNumber({
						min: MINIMUM_USERNAME_LENGTH,
						max: MAXIMUM_USERNAME_LENGTH
					})
				}),
				password: await this.buildDevPassword(),
				profilePictureUrl: this.enFaker.image.avatar()
			};

			mockUsers.push(mockUser);
		}

		return mockUsers;
	}

	generateMockPosts(
		n: number,
		mockUsers: Partial<User>[],
		mockTags: Tag[],
		mockArtists: Artist[]
	): IMockPost[] {
		const mockPosts: IMockPost[] = [];

		for (let i = 0; i < n; i++) {
			const mockPost: IMockPost = {
				id: this.enFaker.string.uuid(),
				authorId: this.randomUserId(mockUsers),
				tags: this.randomLabelSample(
					mockTags,
					this.enFaker.helpers.rangeToNumber({ min: 1, max: 10 })
				),
				artists: this.randomLabelSample(
					mockArtists,
					this.enFaker.helpers.rangeToNumber({ min: 1, max: 3 })
				),
				createdAt: this.enFaker.date.past({ years: 5 }),
				likes: this.enFaker.helpers.rangeToNumber({ min: 0, max: 100_000 }),
				views: this.enFaker.helpers.rangeToNumber({ min: 0, max: 500_000 }),
				description: this.enFaker.lorem.paragraph(),
				imageUrls: Array(
					this.enFaker.helpers.rangeToNumber({ min: 1, max: MAXIMUM_IMAGES_PER_POST })
				)
					.fill(-1)
					.map((_) => this.enFaker.image.urlLoremFlickr({ width: 400, height: 400 }))
			};

			mockPosts.push(mockPost);
		}

		return mockPosts;
	}

	generateMockTags(n: number): Tag[] {
		const mockTags: Tag[] = [];
		const previouslyGeneratedTagNames = new Set<string>();

		for (let i = 0; i < n; i++) {
			let mockTag: Tag = {
				id: faker.string.uuid(),
				name: faker.word.noun()
			};

			while (previouslyGeneratedTagNames.has(mockTag.name)) {
				mockTag = {
					id: faker.string.uuid(),
					name: faker.word.noun()
				};
			}

			mockTags.push(mockTag);
			previouslyGeneratedTagNames.add(mockTag.name);
		}

		return mockTags;
	}

	generateMockArtists(n: number): Artist[] {
		const mockArtists: Artist[] = [];
		const previouslyGeneratedArtistNames = new Set<string>();

		for (let i = 0; i < n; i++) {
			let mockArtist: Artist = {
				id: this.enFaker.string.uuid(),
				name: this.enFaker.person.fullName()
			};

			while (previouslyGeneratedArtistNames.has(mockArtist.name)) {
				mockArtist = {
					id: faker.string.uuid(),
					name: faker.word.noun()
				};
			}

			mockArtists.push(mockArtist);
			previouslyGeneratedArtistNames.add(mockArtist.name);
		}

		return mockArtists;
	}

	generateMockComments(n: number, mockUsers: Partial<User>[], mockPosts: Post[]): IComment[] {
		const mockComments: IComment[] = [];

		for (let i = 0; i < n; i++) {
			const mockComment: Partial<IComment> = {
				id: this.enFaker.string.uuid(),
				createdAt: this.enFaker.date.past({ years: 5 }),
				content: this.enFaker.lorem.paragraph({ min: 1, max: 5 }).slice(0, MAXIMUM_CONTENT_LENGTH),
				postId: this.randomPostId(mockPosts),
				authorId: this.randomUserId(mockUsers),
				parentCommentId: null
			};

			mockComments.push(mockComment as IComment);
		}

		const mockCommentTree = new CommentTree();

		mockComments.forEach((mockComment) => {
			mockComment.parentCommentId = this.randomParentCommentId(mockComments, mockComment.id);
			mockCommentTree.addComment(mockComment);
		});

		return mockCommentTree.getLevelOrder();
	}

	async generateAllModels() {
		const mockUsers = await this.generateMockUsers(this.modelSettings.numberOfUsers || 0);
		const mockTags = this.generateMockTags(this.modelSettings.numberOfTags || 0);
		const mockArtists = this.generateMockArtists(this.modelSettings.numberOfArtists || 0);
		const mockPosts = this.generateMockPosts(
			this.modelSettings.numberOfPosts || 0,
			mockUsers,
			mockTags,
			mockArtists
		);
		const mockComments = this.generateMockComments(
			this.modelSettings.numberOfComments || 0,
			mockUsers,
			mockPosts
		);

		return {
			mockUsers,
			mockPosts,
			mockTags,
			mockArtists,
			mockComments
		};
	}
}

export default FakerMockGenerator;
