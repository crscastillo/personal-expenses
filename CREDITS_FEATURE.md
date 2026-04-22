# Credits & Loans Tracking Feature

## Overview
This feature adds comprehensive tracking for credits, loans, mortgages, and other debt instruments to your Personal Expenses application. You can now track multiple types of credit accounts with interest rates, monthly statements, and payment history.

## What Was Added

### 1. Database Schema
- **`credits` table**: Stores credit/loan account information
  - Supports: Mortgages, Personal Loans, Auto Loans, Student Loans, Credit Cards, Line of Credit, and Other
  - Tracks: Original amount, current balance, interest rate (APR), payment due dates
  - Features: Customizable colors, notes, and active/inactive status

- **`credit_statements` table**: Stores monthly statement imports
  - Tracks: Balance, interest rate changes, minimum payments
  - Records: Interest charged, principal paid, fees, new charges, payments made
  - Unique constraint: One statement per credit per date

### 2. Backend Services
- **`CreditService`** ([lib/services/CreditService.ts](lib/services/CreditService.ts))
  - Full CRUD operations for credits
  - Full CRUD operations for credit statements
  - Bulk import functionality for monthly statements
  - Credit summary with total debt, monthly payments, and average interest rate
  - Automatic balance updates when statements are added

### 3. API Routes
- **`/api/credits`** ([app/api/credits/route.ts](app/api/credits/route.ts))
  - GET: Fetch all credits or a specific credit
  - POST: Create a new credit account
  - PUT: Update credit details
  - DELETE: Remove a credit account

- **`/api/credits/statements`** ([app/api/credits/statements/route.ts](app/api/credits/statements/route.ts))
  - GET: Fetch statements for a credit account
  - POST: Add individual statement or bulk import
  - PUT: Update statement details
  - DELETE: Remove a statement

### 4. User Interface
- **Credits Page** ([app/platform/credits/page.tsx](app/platform/credits/page.tsx))
  - Dashboard with summary cards (total debt, original amount, monthly payments, avg interest rate)
  - Visual credit cards showing:
    - Credit name and type with custom icons
    - Current balance and interest rate
    - Minimum payment and due day
    - Progress bar showing % paid off
  - Click on any credit to view statements
  - Add new credits with comprehensive form
  - Responsive design (drawer on mobile, dialog on desktop)

- **Statements Management**
  - Tabbed interface for viewing and adding statements
  - Chronological statement history
  - Detailed breakdown of each statement (interest, principal, fees, payments, etc.)
  - Manual statement entry

### 5. Navigation
- Added "Credits & Loans" to sidebar navigation with TrendingDown icon

## Database Migration

The migration file is located at:
- [supabase/migrations/20260421000000_add_credits_tracking.sql](supabase/migrations/20260421000000_add_credits_tracking.sql)

To apply the migration:
```bash
# Using Supabase CLI
supabase db push

# Or run the migration directly in your Supabase dashboard
```

## Credit Types Supported

1. **Mortgage** - Home loans with long-term payoff
2. **Personal Loan** - Unsecured personal loans
3. **Auto Loan** - Vehicle financing
4. **Student Loan** - Education financing
5. **Credit Card** - Revolving credit lines
6. **Line of Credit** - Home equity lines or other credit lines
7. **Other** - Any other type of credit not listed

## Data Fields

### Credit Account Fields
- **Required:**
  - Name (e.g., "Chase Freedom Unlimited")
  - Type (one of the supported types)
  - Original Amount (initial loan/credit amount)
  - Current Balance (what you owe now)
  - Interest Rate (annual percentage rate)

- **Optional:**
  - Institution (e.g., "Chase Bank")
  - Account Number (last 4 digits recommended)
  - Start Date (when the loan began)
  - Maturity Date (when it will be paid off)
  - Minimum Payment (monthly minimum)
  - Payment Due Day (day of month, 1-31)
  - Color (for visual identification)
  - Notes (additional information)

### Statement Fields
- **Required:**
  - Statement Date
  - Balance (balance as of statement date)

- **Optional:**
  - Interest Rate (if changed from account rate)
  - Minimum Payment
  - Payment Due Date
  - Interest Charged (interest for this period)
  - Principal Paid (principal paid this period)
  - Fees Charged (any fees assessed)
  - New Charges (new purchases/charges)
  - Payments Made (total payments this period)
  - Notes

## How to Use

### Adding a Credit Account
1. Navigate to "Credits & Loans" in the sidebar
2. Click "Add Credit/Loan" button
3. Fill in the required fields (name, type, amounts, interest rate)
4. Add optional details as needed
5. Click "Add Credit"

### Importing Monthly Statements
1. Click on any credit card in the Credits & Loans page
2. A dialog will open with two tabs: "Statements" and "Add Statement"
3. Click the "Add Statement" tab
4. Fill in the statement details:
   - Statement date (required)
   - Balance (required)
   - Other fields as available from your statement
5. Click "Add Statement"

The credit's current balance will automatically update to match the latest statement.

### Future Enhancement: CSV Import
The infrastructure is in place for CSV import functionality. You can enhance the `handleImportCSV` function in [app/platform/credits/page.tsx](app/platform/credits/page.tsx) to parse CSV files from your financial institutions.

Suggested CSV format:
```csv
statement_date,balance,interest_rate,minimum_payment,interest_charged,principal_paid,fees_charged,new_charges,payments_made
2026-01-31,5432.10,18.99,125.00,82.15,142.85,0,200.00,225.00
2026-02-28,5407.25,18.99,125.00,80.25,144.75,0,0,225.00
```

## Features & Benefits

1. **Comprehensive Tracking**: Track all your debts in one place
2. **Interest Rate Monitoring**: See how your rates change over time
3. **Payment Progress**: Visual progress bars show how much you've paid off
4. **Statement History**: Keep a complete record of all monthly statements
5. **Financial Summary**: Dashboard shows total debt, payments, and average rates
6. **Flexible Import**: Manual entry now, with infrastructure ready for CSV imports

## Security

- All data is protected with Row Level Security (RLS)
- Users can only access their own credits and statements
- Authentication required for all operations
- Data is encrypted at rest in Supabase

## Next Steps

To start using this feature:

1. **Apply the database migration** to your Supabase project
2. **Restart your development server** to load the new routes
3. **Navigate to Credits & Loans** in the sidebar
4. **Add your first credit account** and start tracking!

## Technical Notes

- TypeScript types are defined in [lib/types/database.ts](lib/types/database.ts)
- Service layer follows the same pattern as existing services (AccountService, TransactionService)
- API routes use Next.js App Router conventions
- UI components use shadcn/ui for consistency
- Responsive design uses Tailwind CSS breakpoints

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the migration was applied successfully
3. Ensure you're authenticated
4. Check that the API routes are accessible

Enjoy tracking your credits and working toward financial freedom! 🎯
