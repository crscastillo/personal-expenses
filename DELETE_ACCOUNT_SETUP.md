# Delete Account Setup Guide

## Overview
The delete account feature requires a Supabase Service Role Key to properly delete the user from the authentication system. This key has elevated privileges and should be kept secure.

## What Happens When a User Deletes Their Account

1. **User clicks "Delete My Account"** in Settings
2. **Confirmation required**: User must type "DELETE" to confirm
3. **API deletes all user data** in this order:
   - Reminders
   - Transactions
   - Monthly plans (plan items cascade delete)
   - Accounts
   - Expense categories
   - Expense groups
4. **API deletes the auth user** using admin client (requires service role key)
5. **User is signed out** and redirected to home page

## Required Environment Variable

### Local Development (.env.local)
Add this to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Vercel Deployment
1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Your Supabase service role key
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

## Finding Your Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Under **Project API keys**, find the **service_role** key
5. Copy it (⚠️ Keep this secret! It has full access to your database)

## Security Notes

⚠️ **IMPORTANT**: The service role key:
- Bypasses Row Level Security (RLS)
- Has full admin access to your database
- Should NEVER be exposed to the client
- Should ONLY be used in server-side API routes
- Should be added to `.gitignore` (`.env.local` is already ignored)

## What If the Service Role Key Is Not Set?

If `SUPABASE_SERVICE_ROLE_KEY` is not configured:
- The API will return an error message
- User data will be deleted but the auth user won't be deleted
- The user will be signed out
- The error message will instruct the user to delete their account from the Supabase dashboard

## Manual User Deletion (Fallback)

If the service role key isn't set up, users can delete their account manually:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**
4. Find the user
5. Click the **...** menu
6. Select **Delete user**
7. This will automatically cascade delete all their data thanks to `ON DELETE CASCADE` in the schema

## Testing

### Local Testing
1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
2. Run `npm run dev`
3. Sign in to the app
4. Go to **Settings**
5. Scroll to the **Danger Zone**
6. Click **Delete My Account**
7. Type "DELETE" and confirm
8. Check the console for deletion logs
9. Verify the user is deleted in Supabase dashboard

### Production Testing
⚠️ Be careful when testing in production as deletions are permanent!

1. Create a test account
2. Add some test data
3. Go to Settings and delete the account
4. Verify in Supabase dashboard that the user and data are gone
5. Check Vercel function logs for any errors

## API Logs

The delete account API provides detailed logging:
- `[DELETE ACCOUNT] Starting account deletion for user: {userId}`
- `[DELETE ACCOUNT] Deleting user reminders...`
- `[DELETE ACCOUNT] Deleting user transactions...`
- `[DELETE ACCOUNT] Deleting user monthly plans...`
- `[DELETE ACCOUNT] Deleting user accounts...`
- `[DELETE ACCOUNT] Deleting user expense categories...`
- `[DELETE ACCOUNT] Deleting user expense groups...`
- `[DELETE ACCOUNT] All user data deleted successfully`
- `[DELETE ACCOUNT] Deleting auth user with admin client...`
- `[DELETE ACCOUNT] Auth user deleted successfully`

Check these logs in:
- **Local**: Terminal console
- **Vercel**: Functions tab → Select the function → View logs

## UI Features

The delete account section includes:
- ⚠️ Red warning card (Danger Zone)
- List of what will be deleted
- Confirmation dialog
- Type "DELETE" to confirm
- Loading state while deleting
- Success toast notification
- Automatic redirect to home page

## Troubleshooting

### Error: "Service role key not configured"
- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
- Redeploy the application

### Error: "Failed to delete user account"
- Check Vercel function logs for details
- Verify the service role key is correct
- Ensure the user is authenticated

### User data not deleted
- Check if RLS policies are blocking deletion
- Verify CASCADE constraints in database schema
- Check Supabase logs for errors

### User still exists after deletion
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check function logs for admin client errors
- Try manual deletion from Supabase dashboard
