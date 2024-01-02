#!/bin/bash

cd ../docker/postgres
echo "Composing dexbooru database container from Docker Postgres image"
docker-compose --env-file "../../.env.local" up -d

cd ../redis
echo "Composing dexbooru redis container from Docker Redis image"
docker-compose --env-file "../../.env.local" up -d

cd ../../
echo "Migrating schemas and Seeding the database with mock data"
yarn dbmigrate:dev

