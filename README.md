# Personal Expenses - Conscious Spending Plan

A Next.js application for tracking personal and family expenses, inspired by Ramit Sethi's "I Will Teach You to Be Rich" conscious spending approach and YNAB (You Need A Budget).

## Features

✨ **Conscious Spending Categories**
- Income tracking
- Investments (10%)
- Savings (5-10%)
- Fixed Costs (50-60%)
- Guilt-Free Spending (20-35%)

📊 **Comprehensive Dashboard**
- Visual charts and graphs
- Category-wise spending overview
- Monthly trend analysis
- Plan progress tracking

💰 **Plan Management**
- Monthly financial planning
- Copy plans from previous months
- Custom subcategories
- Due date reminders
- Plan vs actual tracking

🏦 **Account Management**
- Multiple bank accounts
- Savings accounts
- Credit cards
- Cash tracking
- Investment accounts
- Net worth calculation

📝 **Transaction Tracking**
- Manual transaction entry
- Categorization
- Search and filter
- Export capabilities

🔔 **Notifications**
- Due date reminders
- Plan alerts
- Toast notifications

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL) - **Runs Locally with Docker**
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner

## Getting Started (Local Development)

This project is configured to run **completely locally** using Docker. No cloud account needed!

### Prerequisites

- **Node.js 18+** installed
- **Docker Desktop** installed and running
  - Download from [docker.com](https://www.docker.com/products/docker-desktop/)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase (will pull Docker images first time)
npm run supabase:start

# 3. Start the app (in a new terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - Done! 🎉

Your database is already set up with all tables and sample categories.

### View Local Dashboard

Access Supabase Studio at: **http://127.0.0.1:54323**

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed instructions and commands.

### Authentication Configuration

Email confirmation is **disabled by default** for local development (instant signup). For production configuration and customization options, see [AUTH_CONFIGURATION.md](AUTH_CONFIGURATION.md).

---

## Deploying to Production

Ready to deploy your app? See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for a complete guide on:

- ✅ Setting up a production Supabase project
- ✅ Deploying to Vercel
- ✅ Configuring environment variables
- ✅ Running database migrations
- ✅ Setting up authentication

**Quick Summary:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Deploy to Vercel at [vercel.com](https://vercel.com)
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Alternative: Cloud Supabase Setup

If you prefer using cloud Supabase instead:

1. Create a project at [supabase.com](https://supabase.com)
2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Go to SQL Editor in Supabase dashboard
4. Run the migration from `supabase/migrations/20260211000000_initial_schema.sql`
5. Start the app: `npm run dev`

## Project Structure

```
personal-expenses/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── plans/
│   │   └── page.tsx          # Plan management
│   ├── accounts/
│   │   └── page.tsx          # Account management
│   ├── transactions/
│   │   └── page.tsx          # Transaction tracking
│   ├── settings/
│   │   └── page.tsx          # App settings
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── sidebar.tsx           # Navigation sidebar
│   ├── header.tsx            # Top header
│   └── stat-card.tsx         # Dashboard stat cards
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   └── server.ts         # Server Supabase client
│   ├── types/
│   │   └── database.ts       # TypeScript types
│   └── utils.ts              # Utility functions
└── supabase/
    └── schema.sql            # Database schema
```

## Usage Guide

### Creating Your First Plan

1. Go to the **Plans** page
2. Use the month selector to choose your plan month
3. Click "Add Category" to add custom subcategories
4. Set planned amounts for each subcategory
5. Optionally set due dates for bills

### Copying from Previous Month

1. Navigate to the desired month
2. Click "Copy from Previous"
3. Adjust amounts as needed

### Managing Accounts

1. Go to the **Accounts** page
2. Click "Add Account"
3. Fill in account details:
   - Account name
   - Type (checking, savings, credit card, cash, investment)
   - Institution name
   - Current balance
   - Choose a color for visualization

### Adding Transactions

1. Go to the **Transactions** page
2. Click "Add Transaction"
3. Fill in transaction details:
   - Description
   - Amount (negative for expenses, positive for income)
   - Account
   - Category and subcategory
   - Date

### Viewing Dashboard

The dashboard shows:
- Total income, expenses, savings, and net balance
- Spending breakdown by category (pie chart)
- Income vs expenses trend (bar chart)
- Plan progress for each category

## Database Schema

The app uses a PostgreSQL database (via Supabase) with the following main tables:

- **categories**: Predefined main categories
- **subcategories**: Types within each category (can be custom)
- **accounts**: Bank accounts, credit cards, cash
- **monthly_plans**: Monthly financial plans
- **plan_items**: Individual plan allocations
- **transactions**: All financial transactions
- **reminders**: Due date reminders

All tables are in the `public` schema with Row Level Security enabled.

## Conscious Spending Philosophy

This app follows Ramit Sethi's conscious spending plan:

1. **Fixed Costs (50-60%)**: Essential expenses like rent, utilities, insurance
2. **Investments (10%)**: 401(k), IRA, index funds for long-term wealth
3. **Savings (5-10%)**: Emergency fund, vacation, large purchases
4. **Guilt-Free Spending (20-35%)**: Enjoy life without guilt!

## Customization

### Adding New Categories

While the 5 main categories are predefined, you can:
- Add custom subcategories within any category
- Set your own target percentages
- Create specific plan items for your needs

### Styling

- Adjust colors in `app/globals.css`
- Modify the theme in `tailwind.config.js`
- Customize component styles using Tailwind classes

## Contributing

This is a personal project template. Feel free to fork and customize for your needs!

## License

MIT License - Feel free to use this for your personal finance tracking.

## Acknowledgments

- Inspired by Ramit Sethi's "I Will Teach You to Be Rich"
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com)
