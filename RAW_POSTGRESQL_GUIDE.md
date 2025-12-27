# Raw PostgreSQL Implementation Guide

## Overview

This project has been refactored to use raw PostgreSQL queries instead of Sequelize ORM for better performance and control. The implementation uses the `pg` library for direct database connections.

## Key Changes Made

### 1. Removed Sequelize Dependencies
- **Files Modified**:
  - [src/app.module.ts](src/app.module.ts) - Removed SequelizeModule configuration
  - [src/ranking/ranking.module.ts](src/ranking/ranking.module.ts) - Removed Sequelize model imports
  - [src/ranking/ranking.service.ts](src/ranking/ranking.service.ts) - Complete rewrite with raw PostgreSQL queries

### 2. Fixed TRANCO API Configuration
- **Issue**: Environment variable was misspelled as `TRNACO_API_BASE`
- **Fix**: Corrected to `TRANCO_API_BASE`
- **Files Updated**: [.env](.env), [src/ranking/ranking.service.ts](src/ranking/ranking.service.ts)

### 3. Enhanced Error Handling
- Added proper HTTP status code checking for Tranco API responses
- More descriptive error messages for API failures
- Better connection cleanup with try/finally blocks

## Database Setup

### 1. Run the Schema Script
Execute the SQL schema to create the rankings table:

```bash
# Connect to your PostgreSQL database and run:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f src/database/schema.sql
```

Or manually create the table:
```sql
CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL,
    date DATE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rankings_domain ON rankings(domain);
CREATE INDEX IF NOT EXISTS idx_rankings_domain_date ON rankings(domain, date);
CREATE INDEX IF NOT EXISTS idx_rankings_updated_at ON rankings("updatedAt");
```

### 2. Environment Variables
Ensure your `.env` file has the correct TRANCO API URL:
```env
TRANCO_API_BASE=https://tranco-list.eu/api/ranks/domain
DB_HOST=your-neon-host
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database
```

## Performance Improvements

### Connection Management
- Uses PostgreSQL connection pooling via `pg.Pool`
- Proper connection cleanup with try/finally blocks
- Automatic pool termination on module destruction

### Query Optimization
- Direct SQL queries instead of ORM overhead
- Bulk insert operations for better performance
- Indexed database queries for fast lookups

### Caching Strategy
- 24-hour cache TTL using `updatedAt` timestamps
- Full data replacement instead of incremental updates
- Cache-first approach with API fallback

## API Usage

### Single Domain
```bash
GET /ranking/google.com
```

### Multiple Domains
```bash
GET /ranking?domains=google.com,facebook.com,github.com
```

### Create Ranking (for testing)
```bash
POST /ranking
{
  "domain": "example.com",
  "rank": 100,
  "date": "2025-12-27"  // optional, defaults to today
}
```

## Testing

The test suite has been updated to work with the new PostgreSQL implementation:

```bash
npm test                # Run all tests
npm run test:cov        # Run tests with coverage
npm run test:watch      # Watch mode for development
```

## Debugging

### Enable Query Logging
To see the actual SQL queries being executed, you can add logging to the service:

```typescript
// In ranking.service.ts, add before client.query():
console.log('Executing query:', query, values);
```

### Check Database Connection
Test your database connection:
```bash
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
```

## Migration Notes

If migrating from the previous Sequelize implementation:
1. The table schema remains the same
2. Existing data will continue to work
3. No data migration is required
4. Remove any Sequelize-related packages if desired:
   ```bash
   npm uninstall @nestjs/sequelize sequelize sequelize-typescript
   ```