import aiohttp
import asyncio
import random
import os
import json

TOTAL_POSTS_TO_FETCH = 1000
DANBOORU_API_BASE_URL = "https://testbooru.donmai.us"
MIN_POST_ID, MAX_POST_ID = 1, 10_002
FORBIDDEN_TAG_CHARS = [';', ',', ':']
FORBIDDEN_TAGS = ['loli', 'shota', 'lolicon',
                  'shotacon', 'nigga', 'nigger', 'lowres', 'low_res']
MOCK_DATA_FOLDER = os.path.join("mock_data", "danbooru")
DEFAULT_POST_PICTURE_URL = "https://preview.redd.it/xcnycjjyvuz51.jpg?width=1050&format=pjpg&auto=webp&s=c801d1ad05e698d151ebf484d585ba1af1220c99"
MAXIMUM_TAG_LENGTH = 75


async def fetch_random_danbooru_post(client: aiohttp.ClientSession, post_id: int):
    random_post_api_endpoint_url = f"{DANBOORU_API_BASE_URL}/posts/{post_id}.json"
    response_data = None

    async with client.get(random_post_api_endpoint_url) as response:
        response_data = await response.json() if response.ok else None

    return response_data


def normalize_tags(raw_tags: list[str]) -> list[str]:
    normalized_tags: list[str] = []

    for raw_tag in raw_tags:
        normalized_tag = raw_tag.lower().strip()
        if normalized_tag in FORBIDDEN_TAGS:
            continue

        for forbidden_char in FORBIDDEN_TAG_CHARS:
            normalized_tag = normalized_tag.replace(forbidden_char, "")

        if len(normalized_tag) <= MAXIMUM_TAG_LENGTH:
            normalized_tags.append(normalized_tag)

    return normalized_tags


def process_raw_response_data(raw_data: dict) -> dict:
    is_nsfw = raw_data["rating"].lower().strip() == 'e'
    raw_tags = raw_data["tag_string"].split(" ")
    tags = normalize_tags(raw_tags)
    views = random.randint(1, int(raw_data["image_width"] + 10))
    likes = random.randint(1, int(raw_data["image_height"] + 10))

    return {
        "createdAt": raw_data["created_at"],
        "views": views,
        "likes": likes,
        "tags": tags,
        "isNsfw": is_nsfw,
        "imageUrl": raw_data["file_url"] if "file_url" in raw_data else DEFAULT_POST_PICTURE_URL,
    }


def generate_random_post_ids():
    post_id_set: set[int] = set()
    while len(post_id_set) != TOTAL_POSTS_TO_FETCH:
        post_id_set.add(random.randint(MIN_POST_ID, MAX_POST_ID))

    return list(post_id_set)


def save_posts(posts: list[dict]):
    filepath = os.path.join(MOCK_DATA_FOLDER, "dataset.json")
    with open(filepath, mode="w") as file:
        file.write(json.dumps(posts))


async def main():
    random_post_id_samples = generate_random_post_ids()
    processed_post_ids: set[int] = set()
    posts: list[dict] = []

    async with aiohttp.ClientSession() as session:
        for post_id in random_post_id_samples:
            if post_id in processed_post_ids:
                continue

            raw_data = await fetch_random_danbooru_post(session, post_id)
            if raw_data is not None:
                post = process_raw_response_data(raw_data)
                posts.append(post)
                processed_post_ids.add(post_id)

                print(f"Processed random post with id: {post_id}")
                print(f"Currently done {len(processed_post_ids)} posts!")
                print("\n"*2)

    save_posts(posts)

if __name__ == "__main__":
    asyncio.run(main())
