# Domain Ranking Backend - AI Agent Instructions

## Project Overview
This is a NestJS backend that serves domain popularity rankings by integrating the Tranco API with PostgreSQL caching. The architecture prioritizes performance through intelligent cache invalidation (24-hour TTL) and supports multi-domain batch requests.

## Architecture Patterns

### Module Structure
- **Feature-first organization**: Core logic in `src/ranking/` with dedicated controller, service, model, and tests
- **Sequelize ORM**: Uses `sequelize-typescript` decorators - see [ranking.model.ts](src/ranking/ranking.model.ts) for UUID primary keys and DATEONLY fields
- **Environment-driven config**: Database connection and API URLs via `.env` with SSL configuration for Neon PostgreSQL

### Data Flow & Caching Strategy
The core business logic in [ranking.service.ts](src/ranking/ranking.service.ts#L18-L52) implements:
1. **Cache-first approach**: Query database before external API
2. **Time-based invalidation**: 24-hour TTL using `updatedAt` timestamps
3. **Full replacement strategy**: `destroy()` + `bulkCreate()` for fresh data
4. **Multi-domain support**: Promise.all for parallel processing

### API Design
- **Path-based single domain**: `GET /ranking/:domain`
- **Query-based multi-domain**: `GET /ranking?domains=google.com,facebook.com`
- **Chart-ready response format**: `{ domain: { labels: [], ranks: [] }}`

## Development Workflows

### Testing Patterns
- **Service mocking**: Mock Sequelize models using `getModelToken(Ranking)` - see [ranking.service.spec.ts](src/ranking/_tests_/ranking.service.spec.ts#L14-L21)
- **Test structure**: `_tests_/` subdirectories within feature modules
- **Jest configuration**: Separate e2e config in `test/jest-e2e.json`

### Key Commands
```bash
npm run start:dev    # Watch mode development
npm run test:cov     # Coverage reports
npm run lint         # ESLint with TypeScript project service
```

### Environment Requirements
Required `.env` variables:
- `DB_*` - Neon PostgreSQL connection (SSL enabled)
- `TRNACO_API_BASE` - External API base URL
- `FRONTEND_URL` - CORS origin
- `PORT` - Server port (defaults to 3000)

## Code Conventions

### Error Handling
- Throw descriptive errors for invalid API responses
- Log cache hits with domain information
- Use try/catch in controllers for graceful degradation

### Database Patterns
- UUID primary keys with `DataType.UUIDV4` defaults
- Explicit field mapping: `field: 'database_column'`
- Order by date ASC for chronological data
- Bulk operations for performance

### TypeScript Configuration
- Strict type checking with `recommendedTypeChecked`
- Allow `@typescript-eslint/no-explicit-any` for flexibility
- `declare` properties in Sequelize models for proper typing

## Integration Points
- **External API**: Tranco ranking service (`https://tranco-list.eu/api/ranks/domain/{domain}`)
- **Database**: Neon serverless PostgreSQL with SSL
- **Frontend**: CORS-enabled for specified origin
- **Hosting**: Configured for Koyeb deployment with `0.0.0.0` binding