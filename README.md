# Dexbooru - Anime/Manga Imageboard

<img src="docs/posts-page.png">
<img src="docs/post-preview.png">
<img src="docs/tag-index.png">
<img src="docs/comments.png">
<img src="docs/profile.png">

## Project Overview:

Dexbooru is a modern image board, that allows for highly taggable image data, with content related to anime, manga and Japanese pop culture.

Authenticated users can upload images, like posts, leave comments on posts, make friendships with other users, and create post collections to store their favourite media!

This project was created to replicate similar functionality to popular image boards like [Danbooru](https://github.com/danbooru/danbooru), while going for a modern UI.

The tech stack 🍔 for this project consists of:

- TypeScript for consistent type-safety
- Node as the server-runtime
- Sveltekit with Svelte5 as the SSR and UI framework
- Prisma ORM for database interaction
- Zod for runtime schema validation of objects
- Sharp for image processing operations
- Tailwind as the CSS class manager
- Flowbite as the UI library
- PostgreSQL as the primary relational datastore
- Redis as the secondary caching datastore
- AWS S3 to store application media
- AWS CloudFront to serve application media over a fast CDN 🚀
- Docker so things run smoothly on everyones machine

## Prerequisites for local development

To run this project, it is highly recommended to do these tasks first, depending on your operating system:

For everyone:

- Install the correct version of Node (>= >=18.0.0 according to the specification in the `package.json` file)
- Docker Desktop and `docker` and `docker-compose` CLI tools (https://www.docker.com/products/docker-desktop/)

For **Windows** users:

- Install WSL2 and configure it to your code editor or IDE (https://learn.microsoft.com/en-us/windows/wsl/install)

For **Mac** users:

- Install homebrew on your machine (https://brew.sh)

For **Linux** users:

- Use your distro's package manager to install everything. This should be relatively hassle free!
- I use Arch Linux btw!

Package manager:

- The required package manager is `pnpm`, which can be installed here: https://pnpm.io/installation

Python (optional):

- A script that pulls data from Danbooru to get more realistic mock data is written in Python, so make sure you have a modern version of Python 3+ installed for that.

Make sure you have everything installed, by running these commands in your terminal:

```bash
node --version
docker --version
docker-compose --version
pnpm --version
brew --version
```

## Local development setup

### Project and dependency installation:

Firstly as with all projects, clone this repository on your machine:

```bash
git clone https://github.com/t-shah02/dexbooru-rewrite.git
cd dexbooru-rewrite
```

Install all the project dependencies from `package.json` by running the following command at the root level of the project:

```bash
pnpm install
```

### Environment variables:

Now let's configure your `.env` file. This environment variable file should be created at the root level of the project:

```bash
touch .env
```

Here is the general template for the values:

```
# Postgres and Redis dexbooru database credentials

## Postgres (the last variable is read in by Prisma)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=dexbooru
DB_PASSWORD=root
DATABASE_URL=postgres://postgres:root@localhost:5432/dexbooru

## Redis
DB_REDIS_PASSWORD=root
DB_REDIS_PORT=6379
DB_REDIS_HOST=localhost

# AWS

## Local AWS values, via Localstack
AWS_DEFAULT_REGION=us-west-2
AWS_CLOUDFRONT_ENDPOINT=http://localhost:4566

## AWS Secrets associated to a live account
AWS_ACCESS_KEY_ID=<for production>
AWS_SECRET_ACCESS_KEY=<for production>
AWS_CLOUDFRONT_PROFILE_PICTURE_BASE_URL=<for production>
AWS_CLOUDFRONT_POSTS_BASE_URL=<for production>
AWS_CLOUDFRONT_COLLECTION_PICTURE_BASE_URL=<for production>
##

# Microservice API urls
DEXBOORU_ML_API_URL=http://localhost:8000
VITE_DEXBOORU_ML_API_URL=http://localhost:8000
VITE_DEXBOORU_CORE_API_URL=http://localhost:8000

# Application specific values
APP_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173
JWT_PRIVATE_KEY=<generate yourself>
OTP_PRIVATE_KEY=<generate yourself>
NODE_ENV=development

# Node server (if you build the project locally)
PORT=5173
ORIGIN=http://localhost:5173
```

For other values, please refer to `.env.example` located in the root of the project and fill in the variables as needed from your selected providers.

### Local database configuration:

Now let us configure your database (Postgres and Redis) containers and seed your database with mock model data, coming from the script running at `prisma/seed.ts`:

```bash
cd scripts
chmod +x setup-db.sh
./setup-db.sh
```

If you open your Docker Desktop dashboard, you should see the containers for `postgres` and `redis` spun up from the latest images. In the future, you can just run the containers from here, instead of running the database setup bash script.

### Seeding script control:

If you ever want to reseed your database with unique values, you can run this:

```bash
pnpm dbseed:dev
```

You can control the record counts of the mock data, by tampering with the command line arguments that are being passed to the seeding script. If you inspect the scripts in the `package.json`, you can modify the seeding command that Prisma runs by changing this value:

```json
"dbseed:dev": "dotenv -e .env.local -- npx prisma db push --force-reset && npx prisma db seed -- --seed 69420 --user-count 20 --post-count 100 --tag-count 500 --artist-count 250 --comment-count 20000",
```

#### Danbooru data (optional)

To seed the database with more relevant content, there is 2 scripts in the following paths: `scripts/dumpDanbooruData.ts` and `scripts/preprocess_danbooru_data.py`, which are responsible for talking to the Danbooru testing API, fetching random posts, performing some normalization tasks on the post JSON data, persisting it inside `scripts/mock_data/danbooru`, and finally loading it into the Postgres database you have running locally:

```bash
cd scripts
python -m venv venv
pip install -r requirements.txt

python preprocess_danbooru_data.py # extract and transform
npx tsx dumpDanbooruData.ts # load into database
```

The python script should store the dataset of normalized posts it fetched under `mock_data/danbooru/dataset.json`, in which the dump script will load from into the Postgres database you have running locally.

### Localstack setup (AWS S3 in Docker)

Since the project uses AWS S3 to store application media (typically images), you can use the Localstack docker image to run it locally, using the following commands:

```bash
cd scripts
chmod +x setup-aws-resources.sh
./setup-aws-resources.sh
```

This should create 6 different buckets for both the development and production server (if you choose to build the project). The output of the command should be similar to the following:

```bash
make_bucket: dexbooru-dev-pfps
make_bucket: dexbooru-dev-posts
make_bucket: dexbooru-dev-collections
make_bucket: dexbooru-prd-pfps
make_bucket: dexbooru-prd-posts
make_bucket: dexbooru-prd-collections

Spun up localstack S3 container and created required application buckets
2025-01-04 13:20:44 dexbooru-dev-pfps
2025-01-04 13:20:44 dexbooru-dev-posts
2025-01-04 13:20:45 dexbooru-dev-collections
2025-01-04 13:20:45 dexbooru-prd-pfps
2025-01-04 13:20:46 dexbooru-prd-posts
2025-01-04 13:20:46 dexbooru-prd-collections
```

### Running the application in development mode

Now you can run the application in development mode using the following command:

```
pnpm dev
```

It should start the server on `PORT=5173` by default, but you should be able to change this easily by passing the environment variable, so that Vite can configure it properly prior to launching.

If you want a web view of the database tables, without using a CLI utility like `psql` or GUI software (ex: `DBeaver`), Prisma provides a utility to do this, which can be launched with the following command in a seperate terminal:

```
pnpm dbstudio:dev
```

Visit the specified port in the output of the command in your browser, and Prisma will take care of the rest of the work!

### Building the project

Run the following command to build the project, and it should emit the files in the `build` folder at the root level (it is already gitignored):

```bash
pnpm run-build
```

Once that completes generating the chunks, run the server at using the following command:

```bash
PORT=5173 node build/index.js
```

If you don't pass the `PORT` environment variable before running the server, it will use 3000 by default, so you can change it if you would like to.

## Sign in to seeded accounts

You can sign into any of the mock accounts created after the seeding script has finished, by copying over any username from the database, along with this password `root_password_12345`.
This is a hardcoded string that is then hashed, when running the insertions in the `User` table, during the seeding script.

## Features in Progress

### Application level

- The user chat system between friends
- Realtime notifications for post likes, view counts and friend requests.
- A reporting system for posts
- A moderation promotion system for users, where appropriate users can manage post and user profile reports accordingly.
- A recommendation engine for similar posts relative to one another
- 3rd party authentication for users (Google and GitHub)

### Development level

- Logging on the Sveltekit API endpoints
- Swagger API docs
- OpenAPI specification per endpoint
- Unit tests for UI components
- E2E tests for API endpoints
- Automated Testing CI/CD pipeline on PRs and deployments using Github actions

## Contribution

- Feel free to contribute to this project by forking and making a pull request!
- Raise an issue for bugs and featrue requests:
  https://github.com/Dexbooru/dexbooru-web/issues
