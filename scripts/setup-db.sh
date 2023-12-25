#!/bin/bash

cd ../docker/postgres
echo "Composing dexbooru database container from Docker Postgres image\n\n"
docker-compose --env-file "../../.env.local" up -d

cd ../redis
echo "Composing dexbooru redis container from Docker Redis image"
docker-compose --env-file "../../.env.local" up -d

cd ../../
cd "Seeding the database with local testing data"
yarn dbseed:dev