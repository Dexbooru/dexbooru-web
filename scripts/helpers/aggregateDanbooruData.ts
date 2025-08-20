import fs from 'node:fs/promises';
import path from 'node:path';
import winston from 'winston';
import buildLogger, { TLogLevel } from './logger';

type Fetch = (
	_input: string,
	_init?: unknown,
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
const fetchFn: Fetch = globalThis.fetch.bind(globalThis);

export type TDanbooruPost = {
	createdAt: string;
	isNsfw: boolean;
	tags: string[];
	imageUrl: string;
	views: number;
	likes: number;
};

type TDanbooruApiResponse = {
	created_at: string;
	rating: string;
	tag_string: string;
	image_width: number | null;
	image_height: number | null;
	file_url: string | null;
};

export type TAggregateOptions = {
	amount?: number;
	batchSize?: number;
	blacklistedTags?: string;
	outputDir?: string;
	batchDelay?: number;
	postDelay?: number;
	clean?: boolean;
	logLevel?: TLogLevel;
};

const DANBOORU_API_BASE_URL = 'https://testbooru.donmai.us';
const MIN_POST_ID = 1;
const MAX_POST_ID = 10002;
const FORBIDDEN_TAG_CHARS = [';', ',', ':'];
const MAXIMUM_TAG_LENGTH = 75;

// default options
const DEFAULT_FORBIDDEN_TAGS = [
	'loli',
	'shota',
	'lolicon',
	'shotacon',
	'nigga',
	'nigger',
	'lowres',
	'low_res',
];
const DEFAULT_POST_PICTURE_URL =
	'https://preview.redd.it/xcnycjjyvuz51.jpg?width=1050&format=pjpg&auto=webp&s=c801d1ad05e698d151ebf484d585ba1af1220c99';
const DEFAULT_OUTPUT_DIR = path.join('../', 'mock_data', 'danbooru');
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_DELAY = 1500;
const DEFAULT_POST_DELAY = 100;
const DEFAULT_AMOUNT = 100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const ensureDir = async (dir: string) => {
	await fs.mkdir(dir, { recursive: true });
};

const cleanOutputDir = async (
	outputDir: string,
	prefix: string,
	suffix: string,
	logger: winston.Logger,
) => {
	try {
		const entries = await fs.readdir(outputDir, { withFileTypes: true });
		const toDelete = entries
			.filter((e) => e.isFile() && e.name.startsWith(prefix) && e.name.endsWith(suffix))
			.map((e) => path.join(outputDir, e.name));
		for (const f of toDelete) {
			try {
				await fs.unlink(f);
			} catch (err) {
				logger.error(`failed to delete ${f}: ${err?.message ?? String(err)}`);
			}
		}
		return toDelete.length;
	} catch {
		return 0;
	}
};

const writeJsonl = async (filePath: string, posts: TDanbooruPost[]) => {
	const lines = posts.map((p) => JSON.stringify(p));
	await fs.writeFile(filePath, lines.join('\n') + '\n', 'utf-8');
};

const normalizeTags = (rawTags: string[], forbidden: Set<string>) => {
	const out: string[] = [];
	for (const raw of rawTags) {
		let t = String(raw).toLowerCase().trim();
		if (forbidden.has(t)) continue;
		for (const ch of FORBIDDEN_TAG_CHARS) t = t.split(ch).join('');
		if (t.length > 0 && t.length <= MAXIMUM_TAG_LENGTH) out.push(t);
	}
	return out;
};

const processRawResponseData = (
	raw: TDanbooruApiResponse,
	forbidden: Set<string>,
): TDanbooruPost => {
	const isNsfw =
		String(raw.rating ?? '')
			.toLowerCase()
			.trim() === 'e';
	const rawTags = String(raw.tag_string ?? '').split(' ');
	const tags = normalizeTags(rawTags, forbidden);
	const imageWidth = Number(raw.image_width ?? 0) || 0;
	const imageHeight = Number(raw.image_height ?? 0) || 0;
	const views = randInt(1, Math.max(imageWidth + 10, 10));
	const likes = randInt(1, Math.max(imageHeight + 10, 10));

	return {
		createdAt: raw.created_at,
		views,
		likes,
		tags,
		isNsfw,
		imageUrl: raw.file_url || DEFAULT_POST_PICTURE_URL,
	};
};

const fetchPost = async (postId: number, postDelay: number, logger: winston.Logger) => {
	const url = `${DANBOORU_API_BASE_URL}/posts/${postId}.json`;
	try {
		const r = await fetchFn(url);
		if (r.ok) {
			const data = (await r.json()) as TDanbooruApiResponse;
			await sleep(postDelay);
			return data;
		}
	} catch (e) {
		logger.error(`request failed for ${postId}: ${e?.message ?? String(e)}`);
	}
	await sleep(postDelay);
	return null;
};

const generateRandomPostIdsExcluding = (k: number, seen: Set<number>) => {
	const s = new Set<number>();
	while (s.size < k) {
		const candidate = randInt(MIN_POST_ID, MAX_POST_ID);
		if (seen.has(candidate) || s.has(candidate)) continue;
		s.add(candidate);
	}
	return Array.from(s);
};

const processBatchUntilFilled = async (
	targetCount: number,
	batchSize: number,
	forbiddenTags: Set<string>,
	seenIds: Set<number>,
	postDelay: number,
	batchDelay: number,
	logger: winston.Logger,
) => {
	const collected: TDanbooruPost[] = [];
	while (collected.length < targetCount) {
		const need = Math.min(batchSize, targetCount - collected.length);
		const ids = generateRandomPostIdsExcluding(need, seenIds);
		ids.forEach((i) => seenIds.add(i));
		const tasks = ids.map((i) => fetchPost(i, postDelay, logger));
		const results = await Promise.allSettled(tasks);
		for (const r of results) {
			if (r.status === 'fulfilled' && r.value && typeof r.value === 'object') {
				collected.push(processRawResponseData(r.value as TDanbooruApiResponse, forbiddenTags));
			}
		}
		if (collected.length < targetCount) await sleep(batchDelay);
	}
	return collected;
};

async function aggregateDanbooruPosts(options: TAggregateOptions = {}) {
	const {
		amount = DEFAULT_AMOUNT,
		batchSize: rawBatchSize = DEFAULT_BATCH_SIZE,
		blacklistedTags = '',
		outputDir = DEFAULT_OUTPUT_DIR,
		batchDelay = DEFAULT_BATCH_DELAY,
		postDelay = DEFAULT_POST_DELAY,
		clean = true,
		logLevel = 'info',
	} = options;

	const logger = buildLogger(logLevel);

	const total = Math.max(1, Number(amount) || 1);
	const batchSize = Math.max(1, Math.min(Number(rawBatchSize) || 1, total));
	const userForbidden = blacklistedTags
		? String(blacklistedTags)
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.filter((t) => t.length > 0)
		: [];
	const forbiddenTags = new Set<string>([...DEFAULT_FORBIDDEN_TAGS, ...userForbidden]);

	await ensureDir(outputDir);
	if (clean) {
		const deleted = await cleanOutputDir(outputDir, 'dataset_', '.jsonl', logger);
		if (deleted > 0)
			logger.info(`cleaned output directory '${outputDir}': deleted ${deleted} existing files`);
		else logger.info(`output directory '${outputDir}' was already clean`);
	}

	const ts = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, 15) + 'Z';
	let processed = 0;
	let batchIndex = 0;
	const seenIds = new Set<number>();

	while (processed < total) {
		const need = Math.min(batchSize, total - processed);
		batchIndex += 1;
		const posts = await processBatchUntilFilled(
			need,
			batchSize,
			forbiddenTags,
			seenIds,
			postDelay,
			batchDelay,
			logger,
		);

		if (posts.length > 0) {
			const fname = `dataset_${ts}_batch_${String(batchIndex).padStart(4, '0')}.jsonl`;
			const filePath = path.join(outputDir, fname);
			await writeJsonl(filePath, posts);
			processed += posts.length;
			logger.info(`wrote ${posts.length} posts to ${fname} (total ${processed}/${total})`);
		}
	}

	return { totalWritten: processed, outputDir };
}

export default aggregateDanbooruPosts;
