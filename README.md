# School Management System

A modern, full-stack School Management System built specifically for Kenyan schools with M-Pesa integration, SMS/WhatsApp notifications, and comprehensive fee management.

## 🚀 Features

### Core Features (Phase 1) ✅
- ✅ **Student Management** - Complete student records with parent information
- ✅ **Fee Management** - Fee structures, records, and collection tracking
- ✅ **M-Pesa Integration** - STK Push and C2B payments via Safaricom Daraja API
- ✅ **Payment Processing** - Auto-reconciliation, receipts, and payment history
- ✅ **Parent Portal** - OTP authentication, fee viewing, payment history
- ✅ **SMS/WhatsApp Integration** - Automated notifications and bulk messaging
- ✅ **Bulk Import** - CSV/Excel student import with auto-admission numbers
- ✅ **PDF Generation** - Fee receipts and statements

### Advanced Features (Phase 2) ✅
- ✅ **CBC Report Cards** - Kenya Competency-Based Curriculum compliant reports
- ✅ **Gradebook System** - Grade entry, analytics, and performance tracking
- ✅ **Events & Calendar** - School events management with calendar views
- ✅ **Timetable Builder** - Automated conflict detection for classes, teachers, and rooms
- ✅ **Online Admissions** - Application workflow with approval and auto-student creation
- ✅ **Meal Planning** - Weekly menu management for boarding schools
- ✅ **NEMIS Integration** - Kenya government reporting and compliance checks

### Coming Soon
- 📱 Parent mobile app (React Native)
- 🏥 Student health records
- 📚 Library management
- 🚌 Transport management
- 💼 Staff payroll integration

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide Icons**

### Backend
- **Hono** (API framework)
- **Better Auth** (Authentication)
- **Prisma** (ORM)
- **Neon** (PostgreSQL database)

### Integrations
- **Safaricom Daraja API** (M-Pesa payments)
- **Africa's Talking** (SMS/WhatsApp)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Neon database account (or any PostgreSQL database)
- Safaricom Daraja API credentials
- Africa's Talking account (for SMS/WhatsApp)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd school-management-system
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/school_db?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-long"
BETTER_AUTH_URL="http://localhost:3000"

# M-Pesa Daraja API
MPESA_CONSUMER_KEY="your-consumer-key"
MPESA_CONSUMER_SECRET="your-consumer-secret"
MPESA_BUSINESS_SHORT_CODE="174379"  # Sandbox shortcode
MPESA_PASSKEY="your-passkey"
MPESA_ENVIRONMENT="sandbox"
MPESA_CALLBACK_URL="https://your-domain.com/api/mpesa/callback"

# Africa's Talking
AT_USERNAME="sandbox"
AT_API_KEY="your-api-key"
AT_SENDER_ID="SCHOOL"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up Neon Database

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

### 5. Initialize the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Setting Up M-Pesa (Daraja API)

### Sandbox (Testing)

1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and login
3. Create a new app
4. Get your Consumer Key and Consumer Secret
5. Get the test credentials:
   - **Shortcode**: `174379`
   - **Passkey**: Available in the test credentials section
6. Update your `.env` file with these credentials

### Production

1. Get your production credentials from Safaricom
2. Replace the sandbox credentials in `.env`
3. Set `MPESA_ENVIRONMENT="production"`
4. Update `MPESA_CALLBACK_URL` to your production URL
5. Register your callback URLs:

```bash
# The system will auto-register URLs on first payment
# Or manually register via:
POST /api/mpesa/register-urls
```

## 📧 Setting Up SMS/WhatsApp (Africa's Talking)

1. Create account at [Africa's Talking](https://account.africastalking.com/)
2. Get your API key from the dashboard
3. For production:
   - Get a sender ID approved
   - Add SMS/WhatsApp credits
4. Update `.env` with your credentials

## 🗄️ Database Schema

The system uses the following main models:

- **School** - School information and settings
- **Student** - Student records
- **Parent** - Parent/guardian information
- **Staff** - Teachers and staff
- **Class** - Class/grade information
- **FeeStructure** - Fee configurations
- **FeeRecord** - Student fee records
- **Payment** - Payment transactions
- **Message** - SMS/WhatsApp messages
- **AuditLog** - System audit trail

See `prisma/schema.prisma` for full schema.

## 📂 Project Structure

```
/school-management-system
├── /app                    # Next.js app directory
│   ├── /api               # API routes (Hono)
│   │   └── /[[...route]]
│   │       ├── route.ts   # Main API handler
│   │       └── /routes    # API route handlers
│   ├── /(auth)            # Auth pages (login, signup)
│   ├── /(dashboard)       # Dashboard pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── /lib                   # Utilities and configs
│   ├── auth.ts           # Better Auth config
│   ├── auth-client.ts    # Client-side auth
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Utility functions
│   └── /mpesa            # M-Pesa integration
│       ├── daraja.ts     # Daraja API wrapper
│       └── types.ts      # M-Pesa types
├── /prisma               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── /components           # React components (TODO)
└── /public              # Static assets
```

## 🔑 API Endpoints

For complete API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

### Core APIs
- **Students** - Student CRUD operations
- **Fees** - Fee structures and records management
- **Payments** - Payment tracking and reconciliation
- **M-Pesa** - STK Push, C2B, callbacks
- **Messages** - SMS/WhatsApp bulk messaging
- **Dashboard** - Analytics and statistics

### Academic APIs (New!)
- **CBC Reports** - `/api/cbc/*` - Competency-based report cards
- **Gradebook** - `/api/gradebook/*` - Grades, subjects, teacher assignments
- **Events** - `/api/events/*` - School events and calendar
- **Timetable** - `/api/timetable/*` - Automated scheduling with conflict detection
- **Admissions** - `/api/admissions/*` - Online application workflow
- **Meals** - `/api/meals/*` - Meal planning for boarding schools
- **NEMIS** - `/api/nemis/*` - Kenya government reporting

Total: **80+ API endpoints** across 14 route groups

## 🧪 Testing M-Pesa

### Test STK Push

```bash
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-id",
    "amount": 1000,
    "phoneNumber": "254712345678"
  }'
```

### Simulate Callback (Development)

Use the [M-Pesa Sandbox](https://developer.safaricom.co.ke/) to simulate payments.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database (Neon)

Neon automatically scales and manages your PostgreSQL database.

### M-Pesa Production

1. Get production credentials from Safaricom
2. Update environment variables
3. Ensure callback URL is publicly accessible (HTTPS required)
4. Register production URLs

## 📊 Monitoring & Logs

- Check M-Pesa callbacks in console logs
- Monitor payment status in database
- Use Prisma Studio for database inspection: `npm run db:studio`

## 🔒 Security

- All sensitive credentials in environment variables
- M-Pesa callbacks are validated
- Better Auth handles authentication
- Database queries use Prisma (SQL injection protection)
- API rate limiting (TODO)

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## 🙋‍♂️ Support

For issues and questions:
- Check the [documentation](#)
- Open an issue on GitHub
- Contact support (TODO)

## 🗺️ Roadmap

### Phase 1 (MVP) ✅ COMPLETED
- ✅ Student management
- ✅ Fee management
- ✅ M-Pesa integration
- ✅ Parent portal with OTP auth
- ✅ SMS/WhatsApp integration
- ✅ PDF generation (receipts, statements)
- ✅ Bulk student import
- ✅ Dashboard and basic reporting

### Phase 2 (Academic Features) ✅ COMPLETED
- ✅ CBC Report Card system (Kenya curriculum)
- ✅ Gradebook & grading system
- ✅ Events & calendar management
- ✅ Timetable builder with conflict detection
- ✅ Online admissions workflow
- ✅ Meal planning for boarding schools
- ✅ NEMIS integration (Kenya government reporting)

### Phase 3 (Mobile & Advanced Features) 🚧 IN PROGRESS
- 📱 Parent mobile app (React Native)
- 📊 Advanced analytics and insights
- 📚 Library management
- 🏥 Student health records
- 🚌 Transport & route management
- 💼 Staff payroll integration
- 📝 Attendance tracking (biometric support)

### Phase 4 (AI & Automation) 🔮 PLANNED
- 🤖 AI-powered academic predictions
- 💬 Chatbot for parents (WhatsApp)
- 📈 Automated performance insights
- 🌍 Multi-language support (English, Swahili)
- 🎨 Custom school branding
- 🔗 Integration marketplace

---

Built with ❤️ for Kenyan schools
