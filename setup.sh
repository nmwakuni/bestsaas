#!/bin/bash

# School Management System - Setup Script
# This script helps you set up the project with Neon database and Better Auth

set -e

echo "=================================================="
echo "  School Management System - Setup Wizard"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Using existing .env file..."
        ENV_EXISTS=true
    else
        ENV_EXISTS=false
    fi
else
    ENV_EXISTS=false
fi

if [ "$ENV_EXISTS" = false ]; then
    echo -e "${GREEN}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo ""
fi

# Function to update .env file
update_env() {
    key=$1
    value=$2
    if grep -q "^${key}=" .env; then
        # macOS compatible sed
        sed -i.bak "s|^${key}=.*|${key}=\"${value}\"|" .env && rm .env.bak
    else
        echo "${key}=\"${value}\"" >> .env
    fi
}

echo "=================================================="
echo "  1️⃣  DATABASE SETUP - Neon PostgreSQL"
echo "=================================================="
echo ""
echo "Get your Neon database credentials from:"
echo "👉 https://console.neon.tech"
echo ""
echo "Steps:"
echo "1. Sign in to Neon"
echo "2. Create a new project (or use existing)"
echo "3. Copy the connection string"
echo ""

read -p "Enter your Neon DATABASE_URL: " database_url
if [ -n "$database_url" ]; then
    update_env "DATABASE_URL" "$database_url"
    echo -e "${GREEN}✅ Database URL configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping database URL (you can add it later in .env)${NC}"
fi

echo ""
echo "=================================================="
echo "  2️⃣  AUTHENTICATION - Better Auth"
echo "=================================================="
echo ""
echo "Generating secure authentication secret..."

# Generate a secure random secret
auth_secret=$(openssl rand -base64 32 | tr -d '\n')
update_env "BETTER_AUTH_SECRET" "$auth_secret"
echo -e "${GREEN}✅ Generated BETTER_AUTH_SECRET${NC}"

echo ""
read -p "Enter your application URL (default: http://localhost:3000): " app_url
app_url=${app_url:-http://localhost:3000}
update_env "BETTER_AUTH_URL" "$app_url"
echo -e "${GREEN}✅ Application URL configured${NC}"

echo ""
echo "=================================================="
echo "  3️⃣  M-PESA DARAJA API (Optional)"
echo "=================================================="
echo ""
read -p "Do you want to configure M-Pesa now? (y/N): " setup_mpesa

if [[ $setup_mpesa =~ ^[Yy]$ ]]; then
    echo ""
    echo "Get M-Pesa credentials from:"
    echo "👉 https://developer.safaricom.co.ke"
    echo ""
    
    read -p "Environment (sandbox/production) [sandbox]: " mpesa_env
    mpesa_env=${mpesa_env:-sandbox}
    update_env "MPESA_ENVIRONMENT" "$mpesa_env"
    
    read -p "Consumer Key: " mpesa_key
    if [ -n "$mpesa_key" ]; then
        update_env "MPESA_CONSUMER_KEY" "$mpesa_key"
    fi
    
    read -p "Consumer Secret: " mpesa_secret
    if [ -n "$mpesa_secret" ]; then
        update_env "MPESA_CONSUMER_SECRET" "$mpesa_secret"
    fi
    
    read -p "Business Short Code [174379]: " mpesa_code
    mpesa_code=${mpesa_code:-174379}
    update_env "MPESA_BUSINESS_SHORT_CODE" "$mpesa_code"
    
    read -p "Passkey: " mpesa_passkey
    if [ -n "$mpesa_passkey" ]; then
        update_env "MPESA_PASSKEY" "$mpesa_passkey"
    fi
    
    read -p "Callback URL: " mpesa_callback
    if [ -n "$mpesa_callback" ]; then
        update_env "MPESA_CALLBACK_URL" "$mpesa_callback"
    fi
    
    echo -e "${GREEN}✅ M-Pesa configured${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping M-Pesa setup${NC}"
fi

echo ""
echo "=================================================="
echo "  4️⃣  INSTALLING DEPENDENCIES"
echo "=================================================="
echo ""

if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}📦 Installing npm packages...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}📦 node_modules exists, skipping install${NC}"
    echo "   Run 'npm install' manually if needed"
fi

echo ""
echo "=================================================="
echo "  5️⃣  DATABASE SETUP"
echo "=================================================="
echo ""

if [ -n "$database_url" ]; then
    echo -e "${GREEN}🗄️  Setting up database schema...${NC}"
    
    # Generate Prisma Client
    echo "Generating Prisma Client..."
    npx prisma generate
    
    # Push schema to database
    echo "Pushing schema to Neon database..."
    npx prisma db push
    
    echo -e "${GREEN}✅ Database schema created${NC}"
    echo ""
    
    read -p "Do you want to seed the database with sample data? (y/N): " seed_db
    if [[ $seed_db =~ ^[Yy]$ ]]; then
        echo "Seeding database..."
        npm run db:seed
        echo -e "${GREEN}✅ Database seeded${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping database setup (no DATABASE_URL configured)${NC}"
    echo "   Add your DATABASE_URL to .env and run:"
    echo "   npx prisma db push"
fi

echo ""
echo "=================================================="
echo "  ✅  SETUP COMPLETE!"
echo "=================================================="
echo ""
echo -e "${GREEN}Your School Management System is ready!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Review your .env file:"
echo "   nano .env"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   ${app_url}"
echo ""
echo "4. Access Prisma Studio (database GUI):"
echo "   npm run db:studio"
echo ""
echo "📚 Documentation:"
echo "   - API Docs: docs/API_DOCUMENTATION.md"
echo "   - Deployment: docs/DEPLOYMENT_GUIDE.md"
echo "   - Docker: docs/DOCKER_DEPLOYMENT.md"
echo "   - CI/CD: docs/CI_CD_GUIDE.md"
echo ""
echo "💡 Useful commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm test             - Run tests"
echo "   npm run lint         - Check code quality"
echo "   npm run format       - Format code"
echo "   npm run db:studio    - Open database GUI"
echo ""
echo "Need help? Check the documentation or visit:"
echo "https://github.com/nmwakuni/bestsaas"
echo ""
echo "=================================================="
