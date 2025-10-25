# Database Setup Guide

This guide explains how to set up the PostgreSQL database for Streetwise.

## Quick Start

### 1. Create a Neon Database (Recommended)

Neon provides a generous free tier perfect for development and small deployments.

1. Go to [neon.tech](https://neon.tech)
2. Sign up / Log in
3. Create a new project
4. Copy the connection string

### 2. Set Environment Variable

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your database URL:

```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Migrations

Generate and run migrations:

```bash
# Generate migration from schema
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start the Server

```bash
npm run dev
```

The server will automatically use PostgreSQL if `DATABASE_URL` is set, otherwise it falls back to in-memory JSON storage.

## Storage Modes

### Development Mode (No Database)

Without `DATABASE_URL` set:
- Uses `MemStorage` (in-memory with JSON file persistence)
- Data saved to `streetwise-data.json`
- Perfect for local development
- No database setup required

### Production Mode (With Database)

With `DATABASE_URL` set:
- Uses `DbStorage` (PostgreSQL via Drizzle ORM)
- Full ACID transactions
- Proper foreign key constraints
- Better performance at scale
- Required for multi-instance deployments

## Migration Commands

```bash
# Generate migration SQL from schema changes
npm run db:generate

# Push schema directly to database (no migration files)
npm run db:push

# Drop all tables and recreate (DANGER!)
npm run db:drop
```

## Database Schema

See `shared/schema.ts` for the complete schema definition.

### Tables

- **organizations**: White-label org deployments
- **caseworkers**: Staff managing clients within orgs
- **users**: Individual clients (free-tier or org-affiliated)
- **sessions**: Collection periods with location tracking
- **transactions**: Donations and product sales

### Multi-Tenancy

All data is scoped by `orgId`:
- `orgId = null`: Free-tier users
- `orgId = <uuid>`: Organization users

See `MULTI_TENANCY.md` for full architecture details.

## Connection Pooling

The app uses Neon's serverless driver with connection pooling:

```typescript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
```

This works well for:
- Serverless deployments (Vercel, Netlify, etc.)
- GCP Cloud Run / App Engine
- Traditional VMs with multiple workers

## Environment Variables

### Required

```bash
DATABASE_URL=postgresql://...  # PostgreSQL connection string
```

### Optional

```bash
PORT=5000                      # Server port (default: 5000)
NODE_ENV=production            # Environment mode
SESSION_SECRET=xxx             # Session encryption key (future)
```

## Troubleshooting

### "DATABASE_URL is required" Error

**Problem**: Server crashes with database connection error.

**Solution**:
1. Check `.env` file exists and has valid `DATABASE_URL`
2. Verify connection string is correct
3. Test connection: `psql $DATABASE_URL`

### Migrations Not Applied

**Problem**: Tables don't exist or schema is outdated.

**Solution**:
```bash
npm run db:push
```

### "relation does not exist" Error

**Problem**: Accessing a table that doesn't exist.

**Solution**: Run migrations:
```bash
npm run db:push
```

### Development Mode vs Production

**Problem**: App behaves differently locally vs deployed.

**Check**:
```bash
# Should show "Using PostgreSQL database storage" if DATABASE_URL is set
# Should show "Using in-memory JSON file storage" otherwise
```

## GCP Deployment

### Cloud SQL (Managed PostgreSQL)

1. Create Cloud SQL instance
2. Create database
3. Add connection string to Secret Manager
4. Set DATABASE_URL in Cloud Run/Compute Engine

### Using Neon (Easier)

1. Keep Neon database
2. Set DATABASE_URL in GCP environment
3. No Cloud SQL costs
4. Neon free tier: 3GB storage, 0.5 CPU

## Backup & Restore

### Export Data

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Import Data

```bash
psql $DATABASE_URL < backup.sql
```

### Automated Backups (Neon)

Neon automatically backs up your database:
- Point-in-time recovery
- Free tier: 7 days retention
- Paid tier: 30 days retention

## Performance Tips

### Indexes

The schema includes indexes on:
- Foreign keys (orgId, userId, sessionId)
- Frequently queried fields (email, isActive)

### Connection Limits

Neon free tier: 100 concurrent connections

For high traffic:
- Use connection pooling (already configured)
- Consider paid tier (1000+ connections)
- Or use PgBouncer

### Query Optimization

The storage layer uses:
- Selective queries (only fetch needed columns)
- Proper indexing
- Batch operations where possible

## Testing

Run storage tests against real database:

```bash
# Set test database URL
export DATABASE_URL=postgresql://...test-db...

# Run tests
npm test
```

**Important**: Use a separate test database! Tests create and delete data.

## Next Steps

- [ ] Set up DATABASE_URL
- [ ] Run migrations (`npm run db:push`)
- [ ] Test connection (`npm run dev`)
- [ ] Set up CI/CD database (see below)
- [ ] Configure production database
- [ ] Set up automated backups

## CI/CD Database Setup

For GitHub Actions, use a test database or Neon's branching feature:

```yaml
env:
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

See `.github/workflows/ci.yml` for full CI setup.
