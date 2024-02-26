# Dexbooru
Dexbooru is a modern image board, that allows for highly taggable image data, with content related to anime, manga and Japanese pop culture. Authenticated users can upload images, like posts, leave comments and chat with others. 🚀🤖

The tech stack for this project consists of 🍔:
- TypeScript
- NodeJS
- Sveltekit
- Prisma
- Tailwind
- Flowbite
- PostgreSQL
- Redis
- AWS S3
- AWS CloudFront
- Docker

# Prerequisites for local development
To run this project, it is highly recommended to do these tasks first, depending on your operating system:

For everyone:
- Install a modern version of Node (>= v15.0.0 is probably fine)
- Docker Desktop and `docker` and `docker-compose` CLI tools (https://www.docker.com/products/docker-desktop/)

For **Windows** users:
- Install WSL2 and configure it to your code editor or IDE (https://learn.microsoft.com/en-us/windows/wsl/install)

For **Mac** users:
- Install homebrew on your machine (https://brew.sh)

Make sure you have everything installed, by running these commands in your terminal:
```bash
node --version
docker --version
docker-compose --version
yarn --version
brew --version
```

# Local development setup
Firstly as with all projects, clone this repository on your machine:
```bash
git clone https://github.com/Dexbooru/dexbooru-web.git
cd dexbooru-rewrite
```

Install all the project dependencies from `package.json` by running either of the following two commands at the root level:
```bash
yarn
yarn install
```

Now let's configure your `.env.local` file. This environment variable file should be created at the root level of the project:
```bash
touch .env.local
```

Here is the general template for the values (the database ones for `Postgres` and `Redis` will be important for the upcoming step)
```
# Postgres and Redis dexbooru database credentials
DB_PORT="5432"
DB_NAME="dexbooru"
DB_USER="postgres"
DB_PASSWORD="root"
DB_SCHEMA="public"
DB_HOST="host.docker.internal"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}"
DB_REDIS_HOST="localhost"
DB_REDIS_PORT="6379"
DB_REDIS_USER="default"
DB_REDIS_PASSWORD="root"
DB_REDIS_URL="redis://${DB_REDIS_USER}:${DB_REDIS_PASSWORD}@${DB_REDIS_HOST}:${DB_REDIS_PORT}"

# AWS secrets, base urls and S3 bucket names
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_PROFILE_PICTURE_BUCKET=
AWS_POST_PICTURE_BUCKET=
AWS_CLOUDFRONT_PROFILE_PICTURE_BASE_URL=
AWS_CLOUDFRONT_POSTS_BASE_URL=
DEFAULT_PROFILE_PICTURE_URL=
```

Now let us configure your database containers and seed your database with mock model data, coming from the script running at `prisma/seed.ts`:
```bash
cd scripts
chmod +x setup-db.sh
./setup-db.sh                                                                         
```

If you open your Docker Desktop dashboard, you should see the containers for `postgres` and `redis` spun up from the latest images. In the future, you can just run the containers from here, instead of running the database setup bash script. 

If you ever want to reseed your database with unique values, you can run this:
```bash
yarn dbseed:dev
```

You can control the record counts of the mock data, by tampering with the command line arguments that are being passed to the seeding script. If you inspect  the scripts in the `package.json`, you can modify the seeding command that Prisma runs by changing this value:
```json
"dbseed:dev": "dotenv -e .env.local -- npx prisma db push --force-reset && npx prisma db seed -- --seed 69420 --user-count 20 --post-count 100 --tag-count 500 --artist-count 250 --comment-count 20000",
```

Now to finally run the entire application, have two terminals open and run one of each command in them:
```
yarn dev
yarn dbstudio:dev
```

# Sign in to mock accounts
You can sign into any of the mock accounts created after the seeding script has finished, by copying over any username from the database, along with this password `root_password_12345`.
This is a hardcoded string that is then hashed, when running the insertions in the `User` table, during the seeding script.
