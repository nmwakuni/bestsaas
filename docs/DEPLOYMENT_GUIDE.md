# Deployment & Setup Guide

Complete guide for deploying the School Management System for Kenyan schools.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Third-Party Services](#third-party-services)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18.17.0 or higher
- **npm** or **pnpm** package manager
- **Git** for version control
- **PostgreSQL** 14+ (via Neon or local)

### Required Accounts
- **Neon** account for PostgreSQL database (free tier available)
- **Safaricom Daraja** account for M-Pesa integration
- **Africa's Talking** account for SMS/WhatsApp
- **Vercel** account for deployment (optional, recommended)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bestsaas.git
cd bestsaas
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/school_db?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/school_db?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Safaricom Daraja API (M-Pesa)
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_BUSINESS_SHORT_CODE="174379"
MPESA_PASSKEY="your_passkey"
MPESA_CALLBACK_URL="https://yourdomain.com/api/mpesa/callback"

# Africa's Talking (SMS/WhatsApp)
AT_API_KEY="your_africas_talking_api_key"
AT_USERNAME="sandbox" # or your production username

# App Settings
NEXT_PUBLIC_APP_NAME="School Management System"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

---

## Database Setup

### Using Neon (Recommended)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up for free account
   - Create a new project

2. **Get Connection String**
   - Copy the connection string from Neon dashboard
   - Add to `.env` as `DATABASE_URL`

3. **Run Migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed Database (Optional)**
   ```bash
   npx prisma db seed
   ```

### Using Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Create Database**
   ```bash
   createdb school_db
   ```

3. **Update .env**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/school_db"
   ```

4. **Run Migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

## Third-Party Services

### 1. Safaricom Daraja API (M-Pesa)

**Sandbox Setup:**

1. Go to https://developer.safaricom.co.ke
2. Create an account and log in
3. Create a new app (Daraja 2.0)
4. Get your Consumer Key and Consumer Secret
5. Test Credentials:
   - Business Short Code: `174379`
   - Passkey: Available in Daraja portal

**Production Setup:**

1. Complete KYC verification on Daraja portal
2. Request production credentials
3. Update `.env` with production values
4. Set up callback URL (must be HTTPS)

**Testing M-Pesa:**

```bash
# Test STK Push
curl -X POST http://localhost:3000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 1000,
    "accountReference": "FEE001",
    "description": "School Fees"
  }'
```

### 2. Africa's Talking (SMS/WhatsApp)

**Sandbox Setup:**

1. Go to https://africastalking.com
2. Create account
3. Go to Sandbox App
4. Get API Key from Settings
5. Username: `sandbox`

**Production Setup:**

1. Upgrade to production
2. Get production API key
3. Purchase credits
4. Update `.env` with production credentials

**Testing SMS:**

```bash
# Test SMS
curl -X POST http://localhost:3000/api/messages/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["254712345678"],
    "message": "Test message from School SMS"
  }'
```

### 3. Email Service (Optional)

For production, set up email service for:
- Admission confirmations
- Report card notifications
- Payment receipts

**Recommended Services:**
- **Resend** (resend.com) - Modern, developer-friendly
- **SendGrid** (sendgrid.com) - Reliable, good free tier
- **AWS SES** (aws.amazon.com/ses) - Cost-effective

---

## Local Development

### 1. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 2. Database Management

**View Database:**
```bash
npx prisma studio
```

**Generate Prisma Client:**
```bash
npx prisma generate
```

**Reset Database:**
```bash
npx prisma migrate reset
```

### 3. Run Tests (When Available)

```bash
npm test
npm run test:e2e
```

---

## Production Deployment

### Option 1: Vercel (Recommended)

**Advantages:**
- Zero configuration
- Automatic HTTPS
- Global CDN
- Serverless functions
- GitHub integration

**Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/bestsaas.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import GitHub repository
   - Configure environment variables
   - Deploy

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env`
   - Redeploy

4. **Custom Domain** (Optional)
   - Go to Settings → Domains
   - Add your domain (e.g., school.co.ke)
   - Update DNS records as instructed

### Option 2: Digital Ocean App Platform

**Steps:**

1. **Create App**
   - Go to DigitalOcean Apps
   - Create new app from GitHub repo
   - Select Next.js as framework

2. **Configure**
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Add environment variables

3. **Database**
   - Use Neon or DigitalOcean Managed PostgreSQL
   - Update DATABASE_URL

4. **Deploy**
   - Click Deploy
   - Wait for build to complete

### Option 3: VPS (Ubuntu Server)

**For advanced users who need full control.**

**Steps:**

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx
   ```

2. **Clone & Build**
   ```bash
   git clone https://github.com/yourusername/bestsaas.git
   cd bestsaas
   npm install
   npm run build
   ```

3. **Setup PM2**
   ```bash
   pm2 start npm --name "school-app" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name school.example.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Setup SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d school.example.com
   ```

---

## Post-Deployment

### 1. Create First School

```bash
# Connect to database
npx prisma studio

# Or use SQL
psql $DATABASE_URL

# Create school
INSERT INTO "School" (id, name, code, email, phone, county, "subCounty", "createdAt", "updatedAt")
VALUES (
  'school_1',
  'ABC Secondary School',
  '01234567',
  'admin@abc.school.ke',
  '254712345678',
  'Nairobi',
  'Westlands',
  NOW(),
  NOW()
);
```

### 2. Create Admin User

```bash
# Use Better Auth registration endpoint
curl -X POST https://yourapp.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.ke",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "schoolId": "school_1"
  }'
```

### 3. Create Classes

```sql
INSERT INTO "Class" (id, name, stream, "classTeacherId", "schoolId", "academicYear", "createdAt", "updatedAt")
VALUES
('class_1', 'Form 1', 'East', NULL, 'school_1', '2024', NOW(), NOW()),
('class_2', 'Form 2', 'East', NULL, 'school_1', '2024', NOW(), NOW());
```

### 4. Setup Subjects

```sql
INSERT INTO "Subject" (id, name, code, description, "schoolId", "createdAt", "updatedAt")
VALUES
('math', 'Mathematics', 'MATH', 'Core Mathematics', 'school_1', NOW(), NOW()),
('eng', 'English', 'ENG', 'English Language', 'school_1', NOW(), NOW()),
('kis', 'Kiswahili', 'KIS', 'Kiswahili Language', 'school_1', NOW(), NOW());
```

### 5. Verify Integrations

**Test M-Pesa:**
- Navigate to Fees → Make Payment
- Enter test phone number (sandbox)
- Verify STK Push appears on phone

**Test SMS:**
- Navigate to Messages
- Send test SMS
- Verify delivery

### 6. Configure School Settings

Login as admin and configure:
- School profile
- Term dates
- Fee structures
- Academic calendar

---

## Monitoring & Maintenance

### Application Monitoring

**Vercel:**
- Built-in analytics
- Real-time logs
- Performance insights

**Self-hosted:**
```bash
# View PM2 logs
pm2 logs

# Monitor processes
pm2 monit

# View status
pm2 status
```

### Database Backups

**Neon:**
- Automatic daily backups (paid plan)
- Manual snapshots via dashboard

**Self-hosted:**
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Automate with cron
0 2 * * * pg_dump $DATABASE_URL > /backups/school_$(date +\%Y\%m\%d).sql
```

### SSL Certificate Renewal

**Vercel:** Automatic

**Self-hosted:**
```bash
# Certbot auto-renewal (already setup)
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Regenerate Prisma client
npx prisma generate
```

### Build Failures

**Error:** `Module not found`

**Solution:**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### M-Pesa Integration Issues

**Error:** `Invalid credentials`

**Solution:**
- Verify consumer key and secret in `.env`
- Ensure using correct environment (sandbox vs production)
- Check passkey matches business short code

**Error:** `Callback URL unreachable`

**Solution:**
- Ensure callback URL is publicly accessible
- Must use HTTPS in production
- Test with tools like ngrok for local development

### SMS Not Sending

**Error:** `Invalid API key`

**Solution:**
- Verify AT_API_KEY in `.env`
- Check username is correct (`sandbox` for testing)
- Ensure phone numbers are in international format (254...)

### Performance Issues

**Solution:**
```bash
# Enable Next.js production optimizations
NODE_ENV=production npm run build

# Use CDN for static assets
# Enable database connection pooling
# Add Redis cache (optional)

# Monitor database queries
npx prisma studio
```

---

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Use strong BETTER_AUTH_SECRET (32+ chars)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption at rest

---

## Scaling Considerations

When your school grows:

### Database Scaling
- **Neon:** Upgrade to higher tier for more storage/connections
- **PostgreSQL:** Set up read replicas for reporting

### Application Scaling
- **Vercel:** Automatic scaling
- **Self-hosted:** Add more servers behind load balancer

### File Storage
- Move uploads to S3 or Cloudinary
- Use CDN for static assets

### Caching
- Add Redis for session storage
- Cache frequently accessed data

---

## Support

### Documentation
- API Docs: `/docs/API_DOCUMENTATION.md`
- User Guide: Contact for access

### Community
- GitHub Issues: Report bugs
- Discord: Join our community
- Email: support@school.example.com

### Professional Support
For production deployments requiring assistance:
- Email: consulting@school.example.com
- Setup assistance: KES 50,000
- Monthly support: KES 20,000/month

---

## License

This project is licensed under MIT License.

## Credits

Built with:
- Next.js
- Hono
- Better Auth
- Prisma
- Neon
- Safaricom Daraja
- Africa's Talking

---

**Last Updated:** November 15, 2024
**Version:** 1.0.0
