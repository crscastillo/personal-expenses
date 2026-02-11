# Quick Start Guide

## 1. Setup Supabase Database

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: Personal Expenses
   - Database Password: (create a strong password)
   - Region: (choose closest to you)

### Run the Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste into the SQL Editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see "Success. No rows returned"

### Get Your API Keys
1. Go to Project Settings > API
2. Copy the following:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - anon/public key (starts with `eyJ...`)

## 2. Configure the Application

### Set Environment Variables
1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Run the Application

```bash
# Install dependencies (if you haven't already)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. First Time Setup

### Enable Authentication (Optional but Recommended)
1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable Email provider
3. Configure email templates as desired
4. You can also enable social providers (Google, GitHub, etc.)

### Test the Database Connection
1. Go to Settings page in the app
2. Verify your Supabase configuration is working
3. You should see no errors

## 5. Start Using the App

### Create Your First Account
1. Go to **Accounts** page
2. Click "Add Account"
3. Add your checking account:
   - Name: "My Checking"
   - Type: Checking
   - Institution: Your bank name
   - Balance: Current balance

### Set Up Your First Plan
1. Go to **Plans** page
2. It will show the current month
3. Click on any category to expand subcategories
4. Click "Add Category" to create custom subcategories
5. For each subcategory, enter:
   - Planned amount
   - Due date (optional, for bills)

### Add Your First Transaction
1. Go to **Transactions** page
2. Click "Add Transaction"
3. Fill in:
   - Description: What was purchased
   - Amount: Use negative for expenses, positive for income
   - Account: Which account was used
   - Category & Subcategory
   - Date

### View Your Dashboard
1. Go to **Dashboard** (home page)
2. See your spending overview
3. View charts showing your plan progress
4. Track your conscious spending percentages

## Conscious Spending Percentages

Based on Ramit Sethi's approach, aim for:

- **Fixed Costs**: 50-60% (rent, utilities, insurance, groceries)
- **Investments**: 10% (401k, IRA, index funds)
- **Savings**: 5-10% (emergency fund, goals)
- **Guilt-Free Spending**: 20-35% (dining, entertainment, hobbies)

## Tips

### Monthly Workflow
1. At the start of each month:
   - Go to Plans
   - Navigate to the new month
   - Click "Copy from Previous" to quickly set up plan
   - Adjust amounts as needed

2. Throughout the month:
   - Add transactions as they happen
   - Check dashboard to see progress
   - Get reminders for bills due

3. End of month:
   - Review spending vs plan
   - Identify areas for adjustment
   - Plan for next month

### Customization
- Add custom subcategories that match your lifestyle
- Set due dates for recurring bills
- Adjust category colors in the database
- Create multiple accounts for different purposes

## Troubleshooting

### Can't connect to database
- Check `.env.local` has correct Supabase URL and key
- Verify the schema was run successfully in Supabase SQL Editor
- Check your internet connection

### No data showing
- Make sure you've run the database schema (`supabase/schema.sql`)
- Check that authentication is working (if enabled)
- Look at browser console for any errors

### Charts not displaying
- Make sure you have transactions and plans created
- Check that dates are correct
- Verify recharts is installed: `npm install recharts`

## Next Steps

1. Set up authentication if you want multiple users
2. Add all your accounts (checking, savings, credit cards, cash)
3. Create your monthly plan based on your income
4. Start tracking transactions
5. Review your conscious spending percentages
6. Adjust plan as needed to meet your goals

## Support

For issues or questions:
- Check the main [README.md](README.md) for full documentation
- Review the database schema in `supabase/schema.sql`
- Check Supabase documentation at [supabase.com/docs](https://supabase.com/docs)

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Supabase API keys secure
- The anon key is safe to use in the browser (protected by Row Level Security)
- Consider enabling MFA in Supabase for production use
