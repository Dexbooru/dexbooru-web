#!/bin/bash

cd ../docker/postgres
echo "Composing dexbooru database container from Docker Postgres image\n\n"
docker-compose --env-file "../../.env.local" up

cd ../redis
echo "Composing dexbooru redis container from Docker Redis image"
docker-compose --env-file "../../.env.local" up