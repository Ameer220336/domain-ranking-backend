## Description

NestJS backend that fetches domain popularity rankings using the Tranco Ranking API, stores results in a PostgreSQL (Neon) database, and serves cached ranking data to optimize performance and reduce API calls.

## Features

- Fetch Real-time Domain Rankings
  Queries domain rank history from the public Tranco API:

```bash
https://tranco-list.eu/api/ranks/domain/<domain>
```

- Caching in PostgreSQL
  When a domain is queried:
  - If cached data exists and was updated within the last 24 hours, results are served instantly without calling Tranco again.
  - Otherwise, fresh data is fetched and stored.

- Support Multi-Domain Comparison
  A user can request multiple domains at once using commas and backend returns chart ready ranking datasets for each domain
  ```bash
  GET /ranking/google.com,facebook.com,github.com
  ```
- Sequelize + Neon Hosting
  Uses Sequelize Models with automatic migration and connects to Neon Severless Postgres.

## API Endpoints

- Single Domain
  ```bash
  GET /ranking/google.com
  ```
- Multiple Domain
  ```bash
  GET /ranking/google.com,facebook.com
  ```
- Response Structure

```bash
{
  "google.com": {
    "domain": "google.com",
    "labels": ["2025-01-01", "2025-01-02"],
    "ranks": [1, 1]
  },
  "facebook.com": {
    "domain": "facebook.com",
    "labels": [...],
    "ranks": [...]
  }
}
```

## Tech Stack

- NestJS
- Sequelize
- Neon PostgreSQL
- Koyeb Hosting (free tier)

## Project setup

Create a .env file:

```bash
DB_HOST=<your-neon-host>
DB_PORT=5432
DB_USER=<neon-user>
DB_PASSWORD=<neon-password>
DB_NAME=<database-name>

TRNACO_API_BASE=https://tranco-list.eu/api/ranks/domain
FRONTEND_URL=http://localhost:5173
PORT=3000
```

For Development

```bash
# development
$ npm install
$ npm run start:dev

For Testing
# testing
$ npm test
```
