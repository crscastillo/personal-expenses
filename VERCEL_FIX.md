# Fix for "No Data in Vercel" Issue

## Problem
The refactored pages (Accounts, Expense Groups) were returning no data when deployed to Vercel because:
1. Client-side pages use fetch() to call API routes
2. API routes use server-side Supabase client that needs session cookies
3. The proxy middleware wasn't running for `/api/*` routes
4. Without the middleware refreshing the session, API routes couldn't access user authentication

## Solution
Updated [proxy.ts](proxy.ts) to include API routes in the matcher:

```typescript
export const config = {
  matcher: [
    '/platform/:path*',
    '/login',
    '/signup',
    '/api/:path*',  // ← Added this line
  ],
}
```

This ensures that:
- All API route requests go through the proxy middleware
- The middleware refreshes the Supabase auth session
- The session cookies are properly synced between client and server
- API routes can successfully authenticate users

## Debugging in Vercel

### Check Function Logs
1. Go to your Vercel dashboard
2. Click on your deployment
3. Go to "Functions" tab
4. Look for logs from your API routes

You should now see logs like:
```
[API /accounts GET] Loading accounts for user: abc-123-def
[API /accounts GET] Successfully loaded 5 accounts
```

### Check Browser Console
Open DevTools in your browser and look for:
```
[Accounts Page] Fetching accounts from API...
[Accounts Page] API response status: 200
[Accounts Page] Successfully loaded 5 accounts
```

### If Still No Data

1. **Check Environment Variables in Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL` must be set
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set

2. **Check Supabase RLS Policies**
   - Ensure your Row Level Security policies allow authenticated users to read their data
   - Example policy: `SELECT on accounts FOR authenticated USING (user_id = auth.uid())`

3. **Check Network Tab**
   - Open DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Look for requests to `/api/accounts` or `/api/expense-groups`
   - Check the response status and body
   - If status is 401: Authentication issue
   - If status is 500: Server error (check function logs)

4. **Test API Routes Directly**
   - Visit `https://your-app.vercel.app/api/accounts` directly
   - You should see either:
     - JSON array of accounts (if authenticated)
     - `{"error": "No authenticated user"}` (if not authenticated)

## Affected Pages

### ✅ Fixed (Using API Routes)
- [Accounts page](app/platform/accounts/page.tsx) - Uses `/api/accounts`
- [Expense Groups page](app/platform/expense-groups/page.tsx) - Uses `/api/expense-groups`

### ⚠️ Still Using Direct Supabase (Working)
These pages still use the client-side Supabase client and should continue working:
- Dashboard page (`app/platform/page.tsx`)
- Transactions page (`app/platform/transactions/page.tsx`)
- Plans page (`app/platform/plans/page.tsx`)
- Expense Categories page (`app/platform/expense-categories/page.tsx`)

## Next Steps

If you want to fully migrate all pages to use API routes:
1. Follow the pattern in [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)
2. Test locally first with `npm run dev`
3. Deploy to Vercel
4. Check function logs for any errors
5. Monitor browser console for client-side errors

## Important Notes

- The proxy middleware MUST run for authentication to work with API routes
- Never remove `/api/:path*` from the proxy matcher
- All API routes expect authentication - they will return 401 if user is not logged in
- The client-side auth context (`lib/auth/context.tsx`) manages the user session
- The proxy middleware syncs this session to the server-side
