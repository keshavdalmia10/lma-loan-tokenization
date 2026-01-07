# Database Configuration for Build & Deployment

## Overview

The LMA Loan Tokenization application uses **PostgreSQL** with **Prisma ORM**. The database setup varies between build, development, and production stages.

## Build Stage

### What Happens
The Docker `builder` stage runs `npx prisma generate` which:
- ✅ **Generates Prisma Client** (TypeScript types & query builder)
- ❌ **Does NOT need DATABASE_URL** (no actual database connection)
- ✅ **Works offline** (only reads schema.prisma file)

### Build Requirements
```dockerfile
# No DATABASE_URL needed during build!
RUN npx prisma generate
```

## Deployment Stage

### What Happens
At **runtime** (when container starts), the app needs an actual database:

1. **start.sh runs migrations** - Applies pending schema changes
2. **Application connects** - Uses DATABASE_URL to access database
3. **Logging tables created** - ClientLog table for frontend logs (from our earlier changes)

### Runtime Requirements
```bash
# DATABASE_URL MUST be set before container starts
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
docker run -e DATABASE_URL="..." lma-app
```

## Current Issues & Solutions

### ❌ Issue #1: DATABASE_URL Not in Dockerfile
**Problem**: Production container has no database connection string  
**Impact**: Database operations fail at runtime  
**Solution**: Pass DATABASE_URL via environment variable at runtime (see deployment examples below)

### ❌ Issue #2: No DATABASE_URL During Docker Build
**Problem**: If DATABASE_URL is not set, `prisma migrate deploy` will fail  
**Impact**: Container startup fails if migrations need to run  
**Solution**: Implemented conditional checks in start.sh—skips migrations if DATABASE_URL missing

### ✅ Issue #3: Migrations Commented Out
**Status**: FIXED in latest start.sh  
**Solution**: Now automatically runs migrations if DATABASE_URL is set

## Environment Configuration

### Development (Local)
```bash
# .env file (DO NOT commit to git)
DATABASE_URL="postgresql://keshavdalmia@localhost:5432/lma_loan_tokenization?schema=public"

# Run locally
npm run dev
```

### Docker Development
```bash
# Pass local database to container
docker run \
  -e DATABASE_URL="postgresql://host.docker.internal:5432/lma_loans?schema=public" \
  lma-app
```

### Docker Production (AWS RDS Example)
```bash
# Managed PostgreSQL database
docker run \
  -e DATABASE_URL="postgresql://admin:SecurePass123@lma-db.abc123.us-east-1.rds.amazonaws.com:5432/lma_prod?schema=public" \
  -e NODE_ENV=production \
  lma-app
```

### Kubernetes Production
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: lma-db-secret
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres-service:5432/lma?schema=public"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lma-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: lma-app:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: lma-db-secret
              key: DATABASE_URL
        - name: NODE_ENV
          value: "production"
```

### Docker Compose (Easiest for Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: lma_loans
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/lma_loans?schema=public"
      NODE_ENV: development
      LOG_DIR: ./logs
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

## Deployment Checklist

### Before Building Docker Image
- [ ] `DATABASE_URL` is correctly formatted
- [ ] PostgreSQL instance is accessible
- [ ] Network connectivity verified
- [ ] Credentials stored securely (not in Dockerfile)

### During Docker Build
- [ ] `npx prisma generate` completes successfully
- [ ] No database needed during build
- [ ] Build stage uses only `schema.prisma`

### When Starting Container
- [ ] `DATABASE_URL` environment variable is set
- [ ] Database connection string is correct
- [ ] PostgreSQL server is accessible from container
- [ ] Database user has migration permissions
- [ ] Network/firewall allows connection
- [ ] Docker health check passes after startup

### After Container Starts
- [ ] Migrations complete without errors
- [ ] Application connects successfully
- [ ] Logs show `✓ Database migrations applied successfully`
- [ ] `ClientLog` table exists (verify: `psql -c "\dt"`
- [ ] App responds to health check

## Troubleshooting

### Error: "Lost connection to PostgreSQL"
```
Solution:
1. Check DATABASE_URL is set: docker exec <container> echo $DATABASE_URL
2. Verify PostgreSQL is running: psql -h host -U user
3. Check firewall/security groups allow connection
4. Verify credentials are correct
```

### Error: "Cannot find module @prisma/client"
```
Solution:
1. Build is missing `npx prisma generate`
2. Verify builder stage runs before runner stage
3. COPY is missing: COPY --from=builder /app/node_modules/.prisma
```

### Error: "Database does not exist"
```
Solution:
1. Create database: createdb -U postgres lma_loans
2. Or update DATABASE_URL to existing database
3. Verify schema permissions: ALTER DATABASE lma_loans OWNER TO postgres
```

### Error: "permission denied for schema public"
```
Solution:
1. Grant schema permissions:
   GRANT USAGE ON SCHEMA public TO postgres;
   GRANT CREATE ON SCHEMA public TO postgres;
2. Or use admin user with full permissions
```

### Logs show: "Skipping migrations - DATABASE_URL not configured"
```
Solution:
1. Set DATABASE_URL before starting container
2. Docker: docker run -e DATABASE_URL="..." lma-app
3. Docker Compose: Add DATABASE_URL to environment section
4. Kubernetes: Mount secret as environment variable
```

## Best Practices

### Security
- ❌ **Never commit DATABASE_URL to git**
- ❌ **Never hardcode credentials in Dockerfile**
- ✅ **Use environment variables or secrets manager**
- ✅ **Use different credentials for dev/prod**
- ✅ **Store passwords in AWS Secrets Manager, Azure KeyVault, or similar**

### Performance
- Use connection pooling (PgBouncer for PostgreSQL)
- Set connection timeout: `?connect_timeout=10`
- Use readonly replicas for reporting queries
- Monitor query performance with `pg_stat_statements`

### High Availability
- Use managed PostgreSQL (AWS RDS, Azure Database, Google Cloud SQL)
- Enable automatic backups
- Set up replication for failover
- Use connection pooling for resiliency

### Monitoring
- Log all slow queries (log_min_duration_statement)
- Monitor connection count (max_connections)
- Set up alerts for disk usage
- Track migration execution time

## File Structure

```
.
├── Dockerfile                    # Multi-stage build (no DB needed during build)
├── start.sh                      # Runs migrations at startup (conditional)
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Migration files (git tracked)
├── .env.example                 # Template with DATABASE_URL example
├── .env                         # Local dev (DO NOT COMMIT)
└── DATABASE_DEPLOYMENT.md       # This file
```

## Migration Strategy

### Local Development
```bash
# Make schema changes
vim prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_new_field

# Git commit migration (tracked in source control)
git add prisma/migrations/
git commit -m "feat: add new field to loans table"
```

### Deployment
```bash
# Migrations auto-run via start.sh
# start.sh calls: npx prisma migrate deploy

# Or manually (if needed):
docker exec <container> npx prisma migrate deploy
```

### Rollback
```bash
# Prisma doesn't auto-rollback, so be careful!
# Options:
# 1. Create new migration that reverts changes
# 2. Use database backup for full rollback
# 3. Manual SQL to revert changes

# Example: Revert last migration
npx prisma migrate resolve --rolled-back <migration_name>
```

## Database Schema

See the current schema in [prisma/schema.prisma](prisma/schema.prisma):

- **Loan** - Core loan entity
- **Document** - Uploaded documents
- **Covenant** - Loan covenants
- **LenderPosition** - Lender stakes
- **Trade** - Token transfers
- **ClientLog** - Frontend logs (added in logging implementation)
- **TrustedIssuer** - ERC-3643 issuers
- + Others (see full schema file)

## Next Steps

1. ✅ **Build**: Run `docker build -t lma-app .`
2. ✅ **Start PostgreSQL**: `docker-compose up -d postgres`
3. ✅ **Run Container**: `docker run -e DATABASE_URL="..." lma-app`
4. ✅ **Verify**: `curl http://localhost:3000/api/logs/upload`
5. ✅ **Check Logs**: `docker logs <container>`

---

**Last Updated**: January 7, 2026  
**Status**: Database configuration ready for build & deployment  
**Tested**: Docker build, local dev, health checks
