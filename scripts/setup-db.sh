#!/bin/bash

ENV_LOCAL_FILE_PATH="../.env.local"
ENV_LOCAL_FILE_PATH_DOCKER="../../.env.local"

echo "Reading .env.local variables into script environment"
export $(egrep -v '^#' $ENV_LOCAL_FILE_PATH | xargs)

cd ../docker/postgres
echo "Composing dexbooru database container from Docker Postgres image"
docker-compose --env-file $ENV_LOCAL_FILE_PATH_DOCKER up -d

cd ../redis
echo "Composing dexbooru redis container from Docker Redis image"
docker-compose --env-file $ENV_LOCAL_FILE_PATH_DOCKER up -d

echo "Configuring permissions for the user called $DB_USER on the database called $DB_NAME"
docker exec -it dexbooru-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "ALTER USER ${DB_USER} WITH SUPERUSER;"
docker exec -it dexbooru-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
docker exec -it dexbooru-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${DB_SCHEMA} TO ${DB_USER};"

cd ../../
echo "Migrating schemas and Seeding the database with mock data"
yarn dbreset:dev



