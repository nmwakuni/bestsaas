# CI/CD & Code Quality Guide

This guide covers the continuous integration, continuous deployment, linting, and formatting setup for the School Management System.

## Table of Contents

- [Code Quality Tools](#code-quality-tools)
- [Available Scripts](#available-scripts)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Code Standards](#code-standards)

## Code Quality Tools

### ESLint

ESLint is configured for Next.js 15 with TypeScript support.

**Configuration**: `eslint.config.mjs`

**Features**:

- Next.js recommended rules
- TypeScript-specific rules
- React hooks validation
- Prettier integration (no conflicts)

**Run ESLint**:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Prettier

Prettier ensures consistent code formatting across the codebase.

**Configuration**: `.prettierrc.json`

**Settings**:

- Semicolons: Yes
- Single quotes: No (double quotes)
- Tab width: 2 spaces
- Trailing commas: ES5
- Print width: 100
- Tailwind CSS class sorting enabled

**Run Prettier**:

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check
```

### TypeScript

Full type checking with strict mode enabled.

**Run type check**:

```bash
npm run type-check
```

## Available Scripts

### Development

```bash
# Start development server
npm run dev

# Run database migrations
npm run db:push

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Validate everything (type-check + lint + format + tests)
npm run validate

# Type check
npm run type-check

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## GitHub Actions Workflows

### Main CI/CD Pipeline

**File**: `.github/workflows/ci-cd.yml`

**Triggers**:

- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs**:

1. **Code Quality** (runs on all branches)

   - TypeScript type checking
   - ESLint validation
   - Prettier format checking

2. **Tests** (runs on all branches)

   - Jest unit tests
   - Test coverage generation
   - Upload coverage to Codecov (optional)

3. **Build Docker Image** (push events only)

   - Multi-platform build (amd64, arm64)
   - Push to GitHub Container Registry (GHCR)
   - Tag with branch name, commit SHA, and `latest`
   - Build caching for faster builds

4. **Security Scanning** (push events only)

   - Trivy vulnerability scanner
   - Upload results to GitHub Security

5. **Deploy** (main branch only)
   - Production deployment (customize per infrastructure)
   - Health check verification

### Pull Request Checks

**File**: `.github/workflows/pr-checks.yml`

**Features**:

- Runs all validation checks
- Checks for console.log statements
- Bundle size analysis
- Automatic PR comment with results

### Dependabot

**File**: `.github/dependabot.yml`

**Features**:

- Weekly npm dependency updates
- GitHub Actions updates
- Docker base image updates
- Automatic PR creation

## Pre-commit Hooks

To set up git hooks for automatic linting before commits:

### Install husky

```bash
npm install --save-dev husky lint-staged
npx husky install
```

### Configure package.json

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Create pre-commit hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

Now linting and formatting will run automatically before each commit.

## Code Standards

### TypeScript

- Use explicit types where beneficial
- Avoid `any` unless absolutely necessary
- Use interfaces for object shapes
- Enable strict mode

**Good**:

```typescript
interface Student {
  id: string;
  name: string;
  grade: number;
}

function getStudent(id: string): Promise<Student> {
  return db.student.findUnique({ where: { id } });
}
```

**Bad**:

```typescript
function getStudent(id: any): any {
  return db.student.findUnique({ where: { id } });
}
```

### React Components

- Use functional components
- Use TypeScript for props
- Destructure props
- Use proper hooks

**Good**:

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`StudentCard.tsx`)
- **Functions**: camelCase (`fetchStudents`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_STUDENTS`)
- **Types/Interfaces**: PascalCase (`StudentData`)
- **Files**: kebab-case or PascalCase (`student-card.tsx` or `StudentCard.tsx`)

### Import Order

1. External dependencies
2. Internal modules
3. Components
4. Types
5. Styles

```typescript
// External
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Internal
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

// Components
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Types
import type { Student } from "@/types";
```

### Comments

- Use JSDoc for functions and complex logic
- Explain "why", not "what"
- Keep comments up to date

```typescript
/**
 * Calculates student fees including late payment penalties
 * @param baseAmount - Original fee amount
 * @param daysLate - Number of days past due date
 * @returns Total amount including penalties
 */
function calculateFees(baseAmount: number, daysLate: number): number {
  // Apply 5% penalty per week late (Kenya standard)
  const weeksLate = Math.ceil(daysLate / 7);
  const penalty = baseAmount * 0.05 * weeksLate;
  return baseAmount + penalty;
}
```

### Error Handling

- Use try-catch for async operations
- Provide meaningful error messages
- Log errors appropriately

```typescript
try {
  const student = await db.student.findUnique({ where: { id } });
  if (!student) {
    throw new Error(`Student not found: ${id}`);
  }
  return student;
} catch (error) {
  console.error("Failed to fetch student:", error);
  throw error;
}
```

## Docker Best Practices

### Multi-stage Builds

The Dockerfile uses multi-stage builds for:

- Smaller final image size
- Better caching
- Security (no dev dependencies in production)

### Layer Caching

Optimize build times by:

- Copying package files first
- Installing dependencies before copying source
- Using `.dockerignore` to exclude unnecessary files

### Security

- Run as non-root user (configured)
- Use official Node.js Alpine images
- Scan for vulnerabilities (Trivy in CI/CD)
- Keep base images updated (Dependabot)

## Monitoring Build Status

### GitHub Actions Status

Check build status:

1. Go to GitHub repository
2. Click "Actions" tab
3. View workflow runs

### Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/nmwakuni/bestsaas/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://github.com/nmwakuni/bestsaas/workflows/Tests/badge.svg)
```

## Troubleshooting

### Linting Fails

```bash
# See what's wrong
npm run lint

# Auto-fix issues
npm run lint:fix

# If issues persist, check specific file
npx eslint path/to/file.ts
```

### Formatting Issues

```bash
# Check what's wrong
npm run format:check

# Auto-fix all files
npm run format

# Format specific file
npx prettier --write path/to/file.ts
```

### Type Errors

```bash
# Run type check
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### CI/CD Failures

1. Check workflow logs in GitHub Actions
2. Run the same command locally:
   ```bash
   npm run validate
   ```
3. Fix issues and push again

### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t app:latest .

# Check for syntax errors
docker build --progress=plain -t app:latest .
```

## Additional Resources

- [Next.js ESLint Docs](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Prettier Docs](https://prettier.io/docs/en/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For questions or issues:

- GitHub Issues: https://github.com/nmwakuni/bestsaas/issues
- Documentation: https://github.com/nmwakuni/bestsaas/docs
