# Domain Ranking Backend

A simple NestJS API that fetches domain popularity rankings from the Tranco API and caches them in PostgreSQL for better performance.

## 🚀 What This Does

- **Fetches domain rankings** from [Tranco List API](https://tranco-list.eu)
- **Caches results** in PostgreSQL for 24 hours to reduce API calls
- **Supports multiple domains** in a single request
- **Returns chart-ready data** with dates and ranking numbers

## 📋 API Endpoints

### Get Single Domain Ranking
```bash
GET http://localhost:3006/ranking/google.com
```

### Get Multiple Domains
```bash
GET http://localhost:3006/ranking?domains=google.com,facebook.com,github.com
```

### Response Format
```json
{
  "domain": "google.com",
  "labels": ["2025-12-26", "2025-12-27"],
  "ranks": [1, 1]
}
```

## 🛠️ Tech Stack

- **NestJS** - Node.js framework
- **PostgreSQL** - Database for caching
- **Raw SQL** - Direct database queries (no ORM)
- **Tranco API** - Domain ranking data source

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

#### Option A: Local PostgreSQL
1. Make sure PostgreSQL is running locally
2. Create a database:
   ```sql
   CREATE DATABASE domain_ranking;
   ```
3. Run the schema:
   ```bash
   psql -d domain_ranking -f src/database/schema.sql
   ```

#### Option B: Neon Cloud Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection details

### 3. Configure Environment
Create a `.env` file:

#### For Local PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=domain_ranking

TRANCO_API_BASE=https://tranco-list.eu/api/ranks/domain
FRONTEND_URL=http://localhost:5173
PORT=3006
```

#### For Neon PostgreSQL:
```env
DB_HOST=your-neon-endpoint.aws.neon.tech
DB_PORT=5432
DB_USER=your_neon_user
DB_PASSWORD=your_neon_password
DB_NAME=your_database_name

TRANCO_API_BASE=https://tranco-list.eu/api/ranks/domain
FRONTEND_URL=http://localhost:5173
PORT=3006
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run start:dev
```

The API will be available at `http://localhost:3006`

## 🔧 How It Works

1. **First Request**: API calls Tranco, stores data in database, returns results
2. **Subsequent Requests**:
   - If data is less than 24 hours old → serve from cache
   - If data is older → fetch fresh data from Tranco API
3. **Multi-domain**: Processes multiple domains in parallel for faster responses

## 💡 Example Usage

### Test the API
```bash
# Get Google's ranking
curl http://localhost:3006/ranking/google.com

# Get multiple domains
curl "http://localhost:3006/ranking?domains=google.com,facebook.com"

# Check if server is running
curl http://localhost:3006
```
