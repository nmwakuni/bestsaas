# 🚀 Quick Start Guide - School Management System

Get your School Management System running in 5 minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 20+** installed ([Download](https://nodejs.org))
- ✅ **Git** installed
- ✅ **Neon account** created ([Sign up free](https://console.neon.tech))

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/nmwakuni/bestsaas.git
cd bestsaas

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The setup wizard will:
1. Create your `.env` file
2. Configure database connection (Neon)
3. Generate authentication secrets
4. Install dependencies
5. Set up database schema
6. Seed sample data (optional)

## Step 2: Get Your Neon Database URL

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project (free tier)
3. Copy your connection string:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste it when the setup wizard asks

## Step 3: Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Default Login Credentials

After seeding the database:

**Admin Login:**
- Email: `admin@school.com`
- Password: `changeme123`
- URL: `/login`

**Parent Login:**
- Phone: `254712345678`
- Password: `parent123`
- URL: `/parent/login`

⚠️ **Change these passwords immediately in production!**

## What's Next?

### 1. Explore the Dashboard

Navigate to different sections:
- 📊 **Dashboard** - Overview and statistics
- 👥 **Students** - Student management
- 💰 **Fees** - Fee management and payments
- 📝 **CBC Reports** - Report cards
- 📅 **Events** - School calendar
- 🎓 **Admissions** - Online applications

### 2. Configure M-Pesa (Optional)

For mobile payments integration:

1. Get credentials from [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Add to `.env`:
   ```env
   MPESA_ENVIRONMENT="sandbox"
   MPESA_CONSUMER_KEY="your_key"
   MPESA_CONSUMER_SECRET="your_secret"
   MPESA_PASSKEY="your_passkey"
   MPESA_BUSINESS_SHORT_CODE="174379"
   MPESA_CALLBACK_URL="https://yourdomain.com/api/mpesa/callback"
   ```

3. Test with M-Pesa sandbox

### 3. Configure SMS (Optional)

For SMS notifications:

1. Create account at [Africa's Talking](https://africastalking.com)
2. Add to `.env`:
   ```env
   AFRICAS_TALKING_API_KEY="your_api_key"
   AFRICAS_TALKING_USERNAME="sandbox"
   AFRICAS_TALKING_SENDER_ID="SCHOOL"
   ```

### 4. Database Management

View and edit your database with Prisma Studio:

```bash
npm run db:studio
```

Opens at: http://localhost:5555

## Common Tasks

### Add a New Student

1. Go to **Dashboard** → **Students**
2. Click "Add Student"
3. Fill in details
4. Parent account auto-created with credentials sent via SMS

### Process M-Pesa Payment

1. Go to **Fees** → **Payments**
2. Click "Request Payment"
3. Enter student and amount
4. Student/parent receives STK push on phone
5. Payment auto-reconciles

### Generate CBC Report Card

1. Go to **CBC Reports**
2. Select student and term
3. Add competency assessments
4. Generate PDF report card

### Create School Timetable

1. Go to **Timetable**
2. Add time slots
3. System auto-detects conflicts:
   - Teacher double-booking
   - Class overlaps
   - Room conflicts

### Bulk Import Students

1. Go to **Students** → **Import**
2. Download CSV template
3. Fill with student data
4. Upload file
5. System auto-generates admission numbers

## Development Workflow

### Run Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:ci

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Check TypeScript types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Run all checks
npm run validate
```

### Database Commands

```bash
# Push schema changes
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Deployment

### Deploy to Vercel (Easiest)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from `.env`
   - Deploy!

3. **Set environment variables in Vercel:**
   ```
   DATABASE_URL=your-neon-url
   BETTER_AUTH_SECRET=your-secret
   BETTER_AUTH_URL=https://yourdomain.vercel.app
   ```

### Deploy with Docker

```bash
# Build image
docker build -t school-management .

# Run container
docker-compose up -d
```

See [Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md) for details.

## Troubleshooting

### "Can't connect to database"

✅ **Check:**
1. `.env` file has correct DATABASE_URL
2. Neon database is not suspended (check console)
3. Connection string includes `?sslmode=require`

### "Authentication failed"

✅ **Check:**
1. BETTER_AUTH_SECRET is set and same everywhere
2. Database has user records (run seed script)
3. Password is correct (reset if needed)

### "Module not found"

✅ **Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Prisma Client not generated"

✅ **Fix:**
```bash
npx prisma generate
```

### Dev server crashes (Bus error)

✅ **Fix:**
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Get Help

- 📖 **Full Documentation:** Check `docs/` folder
- 🐛 **Report Issues:** [GitHub Issues](https://github.com/nmwakuni/bestsaas/issues)
- 💬 **Questions:** Create a GitHub Discussion

## Project Structure

```
bestsaas/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin pages
│   ├── (parent)/          # Parent portal
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # UI components
├── lib/                   # Utilities
│   ├── auth.ts           # Better Auth config
│   ├── db.ts             # Prisma client
│   ├── mpesa/            # M-Pesa integration
│   └── messaging/        # SMS/WhatsApp
├── prisma/                # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Seed script
├── docs/                  # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── NEON_SETUP.md
│   ├── BETTER_AUTH_SETUP.md
│   └── DEPLOYMENT_GUIDE.md
├── __tests__/             # Test files
├── .env.example           # Environment template
├── setup.sh               # Automated setup
└── README.md              # Main readme
```

## Key Features Checklist

After setup, verify these features work:

- [ ] Admin can log in
- [ ] View dashboard statistics
- [ ] Add/edit students
- [ ] Create fee records
- [ ] Process M-Pesa payment (if configured)
- [ ] Generate CBC report card
- [ ] View school calendar
- [ ] Parent can log in to portal
- [ ] Send SMS notification (if configured)
- [ ] Import students from CSV

## Next Steps

1. **Customize for your school:**
   - Update school details in database
   - Configure fee structures
   - Set up classes and streams
   - Add subjects

2. **Set up integrations:**
   - M-Pesa for payments
   - SMS for notifications
   - Email (optional)

3. **Deploy to production:**
   - Choose hosting (Vercel recommended)
   - Set up domain
   - Configure SSL
   - Enable monitoring

4. **Train staff:**
   - Create user accounts
   - Conduct training sessions
   - Provide documentation

## Resources

- [Neon Database Setup](./docs/NEON_SETUP.md)
- [Better Auth Configuration](./docs/BETTER_AUTH_SETUP.md)
- [M-Pesa Integration](./docs/API_DOCUMENTATION.md#mpesa)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Docker Guide](./docs/DOCKER_DEPLOYMENT.md)
- [CI/CD Guide](./docs/CI_CD_GUIDE.md)

---

**Ready to build something amazing? Let's go! 🚀**
