# Setup Guide for School Management System

This guide will walk you through setting up the School Management System from scratch.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] Terminal/command line access

## Step 1: Create Accounts

### 1.1 Neon Database (Free)

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" (can use GitHub)
3. Create a new project:
   - Project name: `school-management`
   - Region: Choose closest to you
4. Copy the connection string (looks like: `postgresql://...`)
5. Save it - you'll need it later

### 1.2 Safaricom Daraja API (M-Pesa)

**For Testing (Sandbox):**

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
2. Click "Sign Up" and create account
3. Verify your email
4. Login and go to "My Apps"
5. Click "Add a new app"
   - App name: `School Management System`
   - Select "Lipa Na M-Pesa Online"
6. Click on your app to get credentials:
   - Copy **Consumer Key**
   - Copy **Consumer Secret**
7. Go to "Lipa Na M-Pesa Online" > "Test Credentials"
   - Copy **Business Short Code**: `174379`
   - Copy **Passkey**: (long string)

**For Production:**
- Contact Safaricom to get production credentials
- Fill out their forms and wait for approval

### 1.3 Africa's Talking (SMS/WhatsApp)

1. Go to [africastalking.com](https://africastalking.com)
2. Sign up for an account
3. Verify your email and phone
4. Login and go to "Settings" > "API Key"
5. Copy your **API Key**
6. For production:
   - Apply for a sender ID
   - Add credits to your account

## Step 2: Project Setup

### 2.1 Clone or Download the Project

If you have the code:
```bash
cd school-management-system
```

If starting fresh, the code is already set up in this repository.

### 2.2 Install Dependencies

```bash
npm install
```

This will install all required packages (Next.js, Prisma, etc.)

### 2.3 Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` in your code editor

3. Fill in your credentials:

```env
# 1. Database (from Neon)
DATABASE_URL="paste-your-neon-connection-string-here"

# 2. Better Auth (generate a random secret)
BETTER_AUTH_SECRET="generate-a-random-32-char-string-here"
BETTER_AUTH_URL="http://localhost:3000"

# 3. M-Pesa Daraja (from Safaricom)
MPESA_CONSUMER_KEY="paste-consumer-key-here"
MPESA_CONSUMER_SECRET="paste-consumer-secret-here"
MPESA_BUSINESS_SHORT_CODE="174379"
MPESA_PASSKEY="paste-passkey-here"
MPESA_ENVIRONMENT="sandbox"
MPESA_CALLBACK_URL="http://localhost:3000/api/mpesa/callback"

# 4. Africa's Talking (from AT)
AT_USERNAME="sandbox"
AT_API_KEY="paste-api-key-here"
AT_SENDER_ID="SCHOOL"

# 5. App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**To generate BETTER_AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Database Setup

### 3.1 Generate Prisma Client

```bash
npm run db:generate
```

This creates the database client code.

### 3.2 Push Schema to Database

```bash
npm run db:push
```

This creates all the tables in your Neon database.

### 3.3 Seed Sample Data (Optional)

```bash
npm run db:seed
```

This adds:
- 1 demo school
- 2 classes
- 2 students
- 2 parents
- Fee structures
- 1 sample payment

## Step 4: Run the Application

### 4.1 Start Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

### 4.2 Open in Browser

Go to: [http://localhost:3000](http://localhost:3000)

You should see the landing page!

## Step 5: Test the System

### 5.1 View the Dashboard

Go to: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

You should see:
- Student count
- Fee collection stats
- Payment overview

### 5.2 Test M-Pesa (Sandbox)

You can test M-Pesa payments using Safaricom's test credentials:

**Test Phone Number:** `254708374149`

1. Make an API call to initiate STK Push:

```bash
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "your-student-id",
    "amount": 100,
    "phoneNumber": "254708374149"
  }'
```

2. On your test phone, you'll receive an M-Pesa prompt
3. Enter PIN: `1234` (sandbox PIN)
4. The callback will be received and payment recorded

### 5.3 View Database

```bash
npm run db:studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

You can:
- View all data
- Add/edit records
- See relationships

## Step 6: Deployment (Production)

### 6.1 Deploy to Vercel

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Add all environment variables from `.env`
6. Change:
   - `BETTER_AUTH_URL` to your Vercel domain
   - `MPESA_CALLBACK_URL` to your Vercel domain + `/api/mpesa/callback`
   - `NEXT_PUBLIC_APP_URL` to your Vercel domain
7. Click "Deploy"

### 6.2 Production M-Pesa Setup

1. Get production credentials from Safaricom
2. Update environment variables in Vercel:
   - `MPESA_ENVIRONMENT="production"`
   - Update Consumer Key, Secret, Shortcode, Passkey
   - Update Callback URL to production domain
3. Register callback URLs with Safaricom

### 6.3 Production SMS Setup

1. Add credits to Africa's Talking account
2. Get sender ID approved
3. Update `AT_USERNAME` to your production username
4. Update `AT_SENDER_ID` to your approved sender ID

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
- Check your `DATABASE_URL` is correct
- Make sure Neon project is active
- Check your internet connection

### M-Pesa Errors

**Error:** `Invalid Access Token`

**Solution:**
- Check Consumer Key and Secret are correct
- Make sure there are no extra spaces
- Try regenerating credentials in Daraja portal

**Error:** `Bad Request - Invalid PhoneNumber`

**Solution:**
- Phone number must be in format: `254XXXXXXXXX`
- Remove any spaces, dashes, or +

### Build Errors

**Error:** `Module not found`

**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

## Next Steps

1. **Customize the school:**
   - Update school information in database
   - Upload school logo
   - Set up fee structures

2. **Add users:**
   - Create staff accounts
   - Set up parent portal access

3. **Configure integrations:**
   - Test M-Pesa payments
   - Send test SMS messages
   - Set up webhooks

4. **Training:**
   - Train staff on the system
   - Create user guides
   - Set up support process

## Support

If you encounter issues:

1. Check this guide first
2. Check the main [README.md](README.md)
3. Look at error messages carefully
4. Check console logs in browser (F12)
5. Check server logs in terminal

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database

# Prisma
npx prisma migrate dev  # Create migration
npx prisma format       # Format schema file
npx prisma validate     # Validate schema
```

## Security Checklist

Before going to production:

- [ ] Change all default credentials
- [ ] Use strong random secret for `BETTER_AUTH_SECRET`
- [ ] Enable HTTPS (Vercel does this automatically)
- [ ] Set up proper database backups
- [ ] Review and limit API access
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review Neon database security settings
- [ ] Never commit `.env` file to git

---

Good luck! 🚀
