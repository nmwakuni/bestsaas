# Better Auth Setup Guide

This guide explains how Better Auth is configured in the School Management System and how to customize it.

## What is Better Auth?

Better Auth is a modern authentication library for Next.js with:
- ✅ Built-in session management
- ✅ Multiple authentication providers
- ✅ Type-safe API
- ✅ Edge runtime compatible
- ✅ Database session storage

## Current Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-super-secret-key-minimum-32-characters-long"

# Your application URL
BETTER_AUTH_URL="http://localhost:3000"
```

### 2. Auth Configuration

Located in `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: {
    provider: "pg", // PostgreSQL (Neon)
    url: process.env.DATABASE_URL!,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  // Add providers and options here
});
```

### 3. Client Configuration

Located in `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
```

## User Roles

The system supports three user roles:

1. **Admin** - Full system access
2. **Teacher** - Class and student management
3. **Parent** - View child's information

### Database Schema

Users table in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed
  name      String?
  role      UserRole @default(ADMIN)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  TEACHER
  PARENT
}
```

## Authentication Flow

### Admin Login

1. **Navigate to `/login`**
2. **Enter credentials:**
   - Email: admin@school.com
   - Password: (set during setup)
3. **Redirect to:** `/dashboard`

### Teacher Login

1. **Navigate to `/login`**
2. **Enter teacher credentials**
3. **Redirect to:** `/dashboard` (limited access)

### Parent Login

1. **Navigate to `/parent/login`**
2. **Enter credentials:**
   - Phone number or email
   - Password
3. **Redirect to:** `/parent/portal`

## API Routes

Better Auth automatically creates these routes:

- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up (if enabled)
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password` - Password reset

### Protected Routes

Use middleware to protect routes:

```typescript
// middleware.ts
import { authClient } from "@/lib/auth-client";

export async function middleware(request: NextRequest) {
  const session = await authClient.getSession();
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect parent routes
  if (request.nextUrl.pathname.startsWith('/parent')) {
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/parent/:path*', '/dashboard/:path*']
};
```

## Creating Your First Admin User

### Method 1: Database Seed Script

Run the seed script (already configured):

```bash
npm run db:seed
```

This creates:
- Admin user: admin@school.com
- Password: changeme123 (change immediately!)

### Method 2: Prisma Studio

1. **Open Prisma Studio:**
   ```bash
   npm run db:studio
   ```

2. **Navigate to User table**

3. **Add new user:**
   - email: youremail@school.com
   - password: (hash with bcrypt)
   - role: ADMIN
   - schoolId: (your school ID)

4. **Hash password:**
   ```typescript
   // Use Node.js REPL
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash('yourpassword', 10);
   console.log(hash);
   ```

### Method 3: API Call

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "securepassword",
    "name": "System Administrator",
    "role": "ADMIN"
  }'
```

## Customization

### Add Email/Password Authentication

Already configured! Email/password is the default.

### Add OAuth Providers (Google, GitHub, etc.)

Update `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  database: {
    provider: "pg",
    url: process.env.DATABASE_URL!,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

Add to `.env`:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Add Two-Factor Authentication

```typescript
export const auth = betterAuth({
  // ... existing config
  plugins: [
    twoFactor({
      issuer: "School Management System",
    }),
  ],
});
```

### Custom Session Duration

```typescript
export const auth = betterAuth({
  // ... existing config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
});
```

## Using Auth in Components

### Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session) setUser(session.user);
    });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### API Routes

```typescript
// app/api/students/route.ts
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Only admins can view all students
  if (session.user.role !== 'ADMIN') {
    return new Response("Forbidden", { status: 403 });
  }

  // Fetch students...
  return Response.json({ students });
}
```

## Password Reset Flow

### 1. Request Reset

```typescript
'use client';

import { authClient } from "@/lib/auth-client";

export function ForgotPassword() {
  const handleReset = async (email: string) => {
    await authClient.forgetPassword({
      email,
      redirectTo: "/reset-password",
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleReset(e.currentTarget.email.value);
    }}>
      <input name="email" type="email" required />
      <button type="submit">Reset Password</button>
    </form>
  );
}
```

### 2. Reset Password Page

```typescript
// app/reset-password/page.tsx
'use client';

import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleReset = async (password: string) => {
    await authClient.resetPassword({
      newPassword: password,
      token,
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleReset(e.currentTarget.password.value);
    }}>
      <input name="password" type="password" required />
      <button type="submit">Set New Password</button>
    </form>
  );
}
```

## Security Best Practices

### 1. Strong Secrets

```bash
# Generate cryptographically secure secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Environment-Specific Secrets

```env
# Development
BETTER_AUTH_SECRET="dev-secret-change-in-production"

# Production (different secret!)
BETTER_AUTH_SECRET="prod-secret-keep-this-secure"
```

### 3. HTTPS in Production

```env
# Production must use HTTPS
BETTER_AUTH_URL="https://yourdomain.com"
```

### 4. Rate Limiting

Add rate limiting to auth routes:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }
  }
  
  return NextResponse.next();
}
```

## Troubleshooting

### "Invalid session" errors

**Cause:** Session expired or invalid secret

**Solution:**
1. Check `BETTER_AUTH_SECRET` is set correctly
2. Clear browser cookies
3. Restart development server

### "Database connection failed"

**Cause:** Database URL incorrect or Neon suspended

**Solution:**
1. Verify `DATABASE_URL` in `.env`
2. Check Neon dashboard (database may be suspended)
3. Ensure `?sslmode=require` in connection string

### Users can't log in

**Cause:** Incorrect credentials or database issues

**Solution:**
1. Verify user exists in database (Prisma Studio)
2. Check password is hashed correctly
3. Check user role matches route access
4. Review auth logs in console

### Session not persisting

**Cause:** Cookie settings or HTTPS issues

**Solution:**
1. In production, ensure `BETTER_AUTH_URL` uses HTTPS
2. Check browser cookie settings
3. Verify `secret` is same across deployments

## Testing Authentication

### Manual Testing

1. **Sign Up:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/sign-up \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

2. **Sign In:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/sign-in \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

3. **Get Session:**
   ```bash
   curl http://localhost:3000/api/auth/session \
     -H "Cookie: session=<session-cookie>"
   ```

### Automated Tests

```typescript
// __tests__/auth.test.ts
import { authClient } from '@/lib/auth-client';

describe('Authentication', () => {
  it('should sign in user', async () => {
    const result = await authClient.signIn({
      email: 'test@test.com',
      password: 'password123',
    });
    
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
  });
  
  it('should reject invalid credentials', async () => {
    await expect(
      authClient.signIn({
        email: 'test@test.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow();
  });
});
```

## Resources

- **Better Auth Docs:** https://better-auth.com/docs
- **Prisma Session Adapter:** https://better-auth.com/docs/adapters/prisma
- **Next.js Integration:** https://better-auth.com/docs/integrations/nextjs

## Next Steps

- [Neon Database Setup](./NEON_SETUP.md)
- [M-Pesa Integration](./API_DOCUMENTATION.md#mpesa)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
