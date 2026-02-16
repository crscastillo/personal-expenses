# Forgot Password Implementation

This document describes the password reset functionality implemented using Supabase Auth.

## Overview

Users can now reset their password through a standard email-based flow:

1. User clicks "Forgot password?" on login page
2. User enters their email address
3. Supabase sends a reset link via email
4. User clicks the link and sets a new password
5. User is redirected back to login

## Files Created

### `/app/forgot-password/page.tsx`
- Email input form for password reset requests
- Calls `supabase.auth.resetPasswordForEmail()` with redirect URL
- Shows success message after email is sent
- Handles errors (invalid email, rate limiting, etc.)

### `/app/reset-password/page.tsx`
- Password update form (new password + confirmation)
- Validates user has a valid session from email link
- Calls `supabase.auth.updateUser({ password })` to change password
- Shows success message and redirects to login
- Validates password requirements (min 6 characters, matching passwords)

### Updates to `/app/login/page.tsx`
- Added "Forgot password?" link next to the password field label
- Link directs to `/forgot-password` page

### Updates to `/proxy.ts`
- Added `/forgot-password` and `/reset-password` to middleware matcher
- Redirects authenticated users away from `/forgot-password` (already logged in)
- Allows `/reset-password` for authenticated users (needed after clicking email link)

## User Flow

### Request Password Reset
1. Navigate to `/login`
2. Click "Forgot password?" link
3. Enter email address and submit
4. See success message: "Check your email"
5. Receive email from Supabase with reset link

### Complete Password Reset
1. Click link in email → redirects to `/reset-password`
2. Supabase automatically logs user in with temporary session
3. Enter new password (twice for confirmation)
4. Submit form
5. See success message: "Password updated!"
6. Automatically redirected to `/login` after 2 seconds
7. Sign in with new password

## Technical Details

### Supabase Configuration Required

In your Supabase dashboard (Authentication → Email Templates):

1. **Reset Password Template**: Supabase provides a default template
2. **Redirect URL**: Set to `https://yourdomain.com/reset-password`
   - For local development: `http://localhost:3000/reset-password`
   - Update this in production with your Vercel URL

### Security Features

- **Session Validation**: Reset page checks for valid session before allowing password change
- **Password Requirements**: Minimum 6 characters (enforced client-side and by Supabase)
- **Password Confirmation**: Must enter password twice to prevent typos
- **Expired Link Handling**: If session is invalid, user is redirected to `/forgot-password` with error message
- **Rate Limiting**: Supabase rate limits password reset requests to prevent abuse

### Error Handling

Both pages include comprehensive error handling:
- Network errors
- Invalid email addresses
- Expired or invalid reset links
- Password validation errors
- Supabase API errors

### UI/UX Features

- **Loading States**: Buttons show loading text while processing
- **Disabled Inputs**: Form inputs disabled during submission
- **Success Screens**: Visual confirmation with icons and clear messaging
- **Back Navigation**: Easy return to login page from all screens
- **Auto-focus**: Email/password fields auto-focus for better UX
- **Responsive Design**: Works on mobile and desktop using shadcn/ui Card components

## Testing

### Local Testing
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Forgot password?"
4. Enter a valid user email
5. Check email inbox for reset link
6. Click link and set new password

### Production Testing
1. Deploy to Vercel
2. Update Supabase redirect URL to production domain
3. Test full flow with real email address

## Environment Variables

No additional environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Notes

- Email delivery depends on Supabase email configuration
- In development, check Supabase dashboard for email logs
- Consider customizing email templates in Supabase dashboard for better branding
- Reset links expire after 1 hour by default (configurable in Supabase)
