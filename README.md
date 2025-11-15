# School Management System

A modern, full-stack School Management System built specifically for Kenyan schools with M-Pesa integration, SMS/WhatsApp notifications, and comprehensive fee management.

## 🚀 Features

### Core Features (MVP)
- ✅ **Student Management** - Complete student records with parent information
- ✅ **Fee Management** - Fee structures, records, and collection tracking
- ✅ **M-Pesa Integration** - STK Push and C2B payments via Safaricom Daraja API
- ✅ **Payment Processing** - Auto-reconciliation, receipts, and payment history
- ✅ **Parent Communication** - SMS and WhatsApp notifications
- ✅ **Dashboard & Reports** - Real-time analytics and insights
- ✅ **Multi-tenant** - Support for multiple schools

### Coming Soon
- 📚 Academic management (grades, report cards, CBC support)
- 👨‍🏫 Teacher management and timetables
- 📊 Advanced reporting and analytics
- 📱 Parent mobile app
- 🏥 Student health records

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

### Students
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fees
- `GET /api/fees/structures` - Get fee structures
- `POST /api/fees/structures` - Create fee structure
- `POST /api/fees/generate-records` - Generate fee records
- `GET /api/fees/records` - Get fee records
- `GET /api/fees/defaulters` - Get fee defaulters

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record manual payment
- `GET /api/payments/stats` - Payment statistics

### M-Pesa
- `POST /api/mpesa/stk-push` - Initiate STK Push
- `POST /api/mpesa/callback` - M-Pesa callback (webhook)
- `POST /api/mpesa/c2b/validation` - C2B validation
- `POST /api/mpesa/c2b/confirmation` - C2B confirmation

### Messages
- `POST /api/messages/send` - Send bulk messages
- `POST /api/messages/fee-reminders` - Send fee reminders
- `GET /api/messages` - Message history

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/dashboard/payment-trends` - Payment trends

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

### Phase 1 (MVP) ✅
- Student management
- Fee management
- M-Pesa integration
- Basic reporting

### Phase 2 (In Progress)
- Academic management (grades, CBC)
- Teacher management
- Attendance tracking
- Advanced reports

### Phase 3 (Planned)
- Parent mobile app
- SMS/WhatsApp integration
- Multi-campus support
- Custom branding

### Phase 4 (Future)
- AI-powered insights
- Mobile app for teachers
- Integration with NEMIS
- Multi-language support

---

Built with ❤️ for Kenyan schools
