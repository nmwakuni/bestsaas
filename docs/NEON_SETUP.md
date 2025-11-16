# Neon Database Setup Guide

This guide shows you how to set up your School Management System with Neon serverless PostgreSQL database.

## Why Neon?

- ✅ **Serverless PostgreSQL** - Auto-scaling, pay-per-use
- ✅ **Built-in Branching** - Database branches for development/staging
- ✅ **Auto-suspend** - Reduces costs when inactive
- ✅ **Built-in Connection Pooling** - Perfect for serverless/edge functions
- ✅ **Free Tier** - 0.5GB storage, 3 projects
- ✅ **No Connection Limits** - With connection pooling

## Quick Start

### 1. Create Neon Account

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up (free tier available)
3. Create a new project

### 2. Get Connection String

After creating a project:

1. Go to your project dashboard
2. Click on **"Connection Details"**
3. You'll see two connection strings:

   **Direct Connection** (for migrations):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

   **Pooled Connection** (for application):
   ```
   postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Use the DIRECT connection string for Prisma migrations
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Use the POOLED connection string for the application (optional but recommended)
DATABASE_URL_POOLED="postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Push Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Neon
npx prisma db push

# Seed database (optional)
npm run db:seed
```

### 5. Start Development

```bash
npm run dev
```

Your app is now connected to Neon! 🎉

## Automated Setup

Use our setup script for guided configuration:

```bash
chmod +x setup.sh
./setup.sh
```

## Neon Features

### Database Branching

Create separate databases for development, staging, and production:

```bash
# In Neon Console:
# 1. Go to "Branches"
# 2. Click "Create Branch"
# 3. Choose: main → development
# 4. Get the new connection string
```

Use in `.env.development`:
```env
DATABASE_URL="postgresql://...@ep-dev-xxx.neon.tech/neondb?sslmode=require"
```

### Connection Pooling

Neon provides PgBouncer connection pooling automatically.

**When to use pooled connection:**
- Serverless functions (Vercel, AWS Lambda)
- Edge runtime
- High concurrency applications

**When to use direct connection:**
- Prisma migrations (`prisma db push`, `prisma migrate`)
- Database introspection
- Long-running processes

**Configure in Prisma:**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Auto-Suspend

Neon automatically suspends your database after 5 minutes of inactivity (configurable).

**Benefits:**
- Saves costs on free tier
- Instant wake-up (<1 second)
- No configuration needed

**Limitations:**
- First query after suspend may be slightly slower
- Not suitable for real-time applications requiring instant response

**Disable auto-suspend (paid plans):**
1. Go to project settings
2. Under "Compute" → "Auto-suspend"
3. Set to "Never"

## Prisma Configuration

Your `schema.prisma` is already configured for Neon:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

No special configuration needed! ✅

## Production Deployment

### Vercel Deployment

1. **Add Environment Variables in Vercel:**
   ```
   DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
   BETTER_AUTH_SECRET=your-secret
   BETTER_AUTH_URL=https://yourdomain.vercel.app
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Run Migrations on Deploy:**
   Vercel automatically runs `prisma generate` during build.

### Docker Deployment

1. **Update `docker-compose.yml`:**
   ```yaml
   services:
     app:
       environment:
         DATABASE_URL: ${DATABASE_URL}
         # Remove local PostgreSQL service
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Environment Variables

For all platforms, set:

```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="your-production-secret"
BETTER_AUTH_URL="https://yourdomain.com"
MPESA_ENVIRONMENT="production"
MPESA_CONSUMER_KEY="your-production-key"
# ... other production credentials
```

## Database Management

### Prisma Studio

View and edit your Neon database with a GUI:

```bash
npm run db:studio
```

Opens at: http://localhost:5555

### Migrations

```bash
# Apply schema changes
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate dev --name add_new_feature
npx prisma migrate deploy  # Production
```

### Backups

Neon provides:
- **Point-in-time restore** (paid plans)
- **Manual backups** via pg_dump:

```bash
# Export database
pg_dump "postgresql://...@neon.tech/neondb?sslmode=require" > backup.sql

# Restore
psql "postgresql://...@neon.tech/neondb?sslmode=require" < backup.sql
```

### Monitoring

1. **Neon Console Dashboard:**
   - Connection count
   - Query performance
   - Storage usage
   - Compute time

2. **Prisma Logs:**
   ```typescript
   // lib/db.ts
   const db = new PrismaClient({
     log: ['query', 'info', 'warn', 'error']
   })
   ```

## Troubleshooting

### Connection Issues

**Error: "Can't reach database server"**

✅ **Solutions:**
1. Check connection string is correct
2. Ensure `?sslmode=require` is in URL
3. Verify Neon project is not suspended
4. Check firewall/VPN settings

**Error: "Too many connections"**

✅ **Solutions:**
1. Use pooled connection string
2. Reduce `connection_limit` in Prisma:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Enable connection pooling in Neon console

### Migration Issues

**Error: "Migration failed to apply"**

✅ **Solutions:**
1. Use direct connection (not pooled) for migrations
2. Ensure you have write permissions
3. Check schema is valid: `npx prisma validate`

### Performance Issues

**Slow queries after inactivity**

This is normal - Neon auto-suspends after inactivity. First query wakes it up.

✅ **Solutions:**
1. Disable auto-suspend (paid plans)
2. Implement connection warming
3. Use Vercel Cron to keep alive:
   ```typescript
   // app/api/cron/warmup/route.ts
   export async function GET() {
     await db.$queryRaw`SELECT 1`
     return new Response('OK')
   }
   ```

## Cost Optimization

### Free Tier Limits

- **Storage:** 0.5 GB per project
- **Projects:** 3 projects
- **Branches:** 10 branches per project
- **Compute:** 100 hours/month active time

### Tips to Stay Within Free Tier

1. **Enable Auto-suspend:** Reduces compute hours
2. **Use Branches Wisely:** Delete unused branches
3. **Optimize Queries:** Reduce compute time
4. **Monitor Usage:** Check dashboard regularly

### Upgrade Path

When you need more:
- **Pro Plan ($19/month):** More storage, compute, branches
- **Custom Plans:** For enterprise needs

## Security Best Practices

1. **Never commit `.env` to git:**
   ```bash
   # Already in .gitignore
   .env
   .env.*
   ```

2. **Use different credentials per environment:**
   - Development branch
   - Staging branch
   - Production database

3. **Rotate secrets regularly:**
   - Better Auth secret
   - Database password (Neon console)

4. **Enable IP restrictions (paid plans):**
   - Limit database access to specific IPs
   - Neon Console → Settings → IP Allow List

5. **Use SSL/TLS:**
   - Always use `?sslmode=require` in connection string

## Advanced Configuration

### Read Replicas (Coming Soon)

Neon is adding read replicas for scaling reads:
```typescript
const readReplica = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_REPLICA_URL }
  }
})
```

### Database Extensions

Enable PostgreSQL extensions in Neon:

```sql
-- In Prisma Studio or psql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

Supported extensions:
- uuid-ossp
- pg_trgm (fuzzy search)
- pgcrypto
- And more...

## Resources

- **Neon Documentation:** https://neon.tech/docs
- **Prisma with Neon:** https://www.prisma.io/docs/guides/database/neon
- **Neon Discord:** https://discord.gg/neon
- **Status Page:** https://status.neon.tech

## Support

### Neon Issues
- Check Neon status: https://status.neon.tech
- Neon support: support@neon.tech
- Community: https://discord.gg/neon

### Application Issues
- GitHub Issues: https://github.com/nmwakuni/bestsaas/issues
- Documentation: Check other guides in `docs/`

---

**Next Steps:**
- [Better Auth Setup](./BETTER_AUTH_SETUP.md)
- [M-Pesa Integration](./API_DOCUMENTATION.md#mpesa)
- [Production Deployment](./DEPLOYMENT_GUIDE.md)
