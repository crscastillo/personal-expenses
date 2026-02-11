# Authentication Configuration

This guide explains how to configure email confirmation settings for signup.

## Local Development

Email confirmation is **disabled by default** for local development to speed up testing.

This is configured in [`supabase/config.toml`](supabase/config.toml#L107):

```toml
[auth.email]
enable_confirmations = false  # No email confirmation required
```

Users can sign up and immediately access the app without confirming their email.

## Production (Hosted Supabase)

For your production Supabase project, email confirmation is controlled through the Supabase Dashboard:

### To Disable Email Confirmation (Recommended for MVP/Testing)

1. Go to your Supabase Dashboard: `https://supabase.com/dashboard/project/cdiylugjxeglxkhwptft`
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. **Uncheck** "Confirm email"
5. Click **Save**

Users can now sign up and immediately access the app without email verification.

### To Enable Email Confirmation (Recommended for Production)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. **Check** "Confirm email"
5. Configure your SMTP settings (optional, but recommended for production):
   - Navigate to **Project Settings** → **Auth**
   - Configure **SMTP Settings** with your email provider

Users will need to confirm their email before accessing the app.

## Environment Variables

The application uses these environment variables (configured in `.env.local` or `.env.production`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Email confirmation behavior is controlled at the Supabase project level, not through environment variables.

## Email Templates

If email confirmation is enabled, you can customize the confirmation email template:

1. Go to **Authentication** → **Email Templates** in your Supabase Dashboard
2. Edit the "Confirm signup" template
3. Customize the subject and content

## Current Configuration

- **Local Development**: ❌ Email confirmation disabled
- **Production (cdiylugjxeglxkhwptft)**: Check your Supabase Dashboard

## Testing

To test email flows locally:

1. Supabase Local uses **Inbucket** for email testing
2. Access the email inbox at: `http://127.0.0.1:54324`
3. Any emails sent during local development will appear here
4. You can view confirmation links and test the full flow

## Troubleshooting

**Users can't sign in after signup:**
- Check if email confirmation is enabled in your Supabase settings
- If enabled, users must click the confirmation link in their email
- Check the Inbucket inbox (local) or your email provider (production)

**Want instant signup:**
- Disable email confirmation in Supabase Dashboard
- Users can sign in immediately after creating an account
