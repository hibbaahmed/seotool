# Local Stripe Webhook Testing Guide

## Method 1: Using Stripe CLI (Recommended)

The Stripe CLI allows you to forward webhook events from Stripe to your local development server.

### Step 1: Install Stripe CLI

**macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (using Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download the latest release
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz
tar -xvf stripe_*_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Or download from:** https://stripe.com/docs/stripe-cli

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Localhost

Start your Next.js development server first:
```bash
npm run dev
```

Then in a separate terminal, forward webhooks to your local endpoint:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

The CLI will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Set the Webhook Signing Secret

Copy the webhook signing secret and add it to your `.env.local` file:

```env
STRIPE_ENDPOINT_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** For local development, use the signing secret from `stripe listen`, NOT the one from your Stripe Dashboard webhook endpoint.

### Step 5: Trigger Test Events

In another terminal, trigger test events:

```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed

# Test invoice.payment_succeeded
stripe trigger invoice.payment_succeeded

# Test customer.subscription.created
stripe trigger customer.subscription.created

# Test customer.subscription.deleted
stripe trigger customer.subscription.deleted
```

You can also trigger events with custom data:
```bash
stripe trigger checkout.session.completed --override checkout_session:metadata.plan=Professional
```

### Step 6: Monitor Webhook Events

The `stripe listen` command will show you all webhook events being forwarded:
- Event type
- Request/response details
- HTTP status codes
- Any errors

## Method 2: Using ngrok (Alternative)

If you prefer using ngrok instead of Stripe CLI:

### Step 1: Install ngrok
```bash
brew install ngrok  # macOS
# Or download from https://ngrok.com/download
```

### Step 2: Start your Next.js server
```bash
npm run dev
```

### Step 3: Create ngrok tunnel
```bash
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Step 4: Configure Stripe Webhook in Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your ngrok URL: `https://abc123.ngrok.io/api/webhook/stripe`
4. Select the events you want to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add it to your `.env.local`:
   ```env
   STRIPE_ENDPOINT_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Step 5: Test

Create a test checkout session or subscription in Stripe Dashboard, and the webhook will be sent to your local server.

## Troubleshooting

### Webhook signature verification fails

Make sure you're using the correct signing secret:
- **Local testing with Stripe CLI**: Use the secret from `stripe listen`
- **Production/ngrok**: Use the secret from Stripe Dashboard webhook endpoint

### Webhook not received

1. Check that `stripe listen` is running
2. Verify the endpoint URL is correct: `localhost:3000/api/webhook/stripe`
3. Check your Next.js server logs for errors
4. Ensure your `.env.local` has `STRIPE_ENDPOINT_SECRET` set

### Testing specific events

You can filter which events to forward:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe --events checkout.session.completed,invoice.payment_succeeded
```

## Quick Start Script

Create a script `scripts/test-webhooks.sh`:

```bash
#!/bin/bash
echo "Starting Stripe webhook forwarding..."
echo "Make sure your Next.js server is running on port 3000"
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Make it executable:
```bash
chmod +x scripts/test-webhooks.sh
```

Then run:
```bash
./scripts/test-webhooks.sh
```

## Environment Variables Needed

Make sure your `.env.local` has:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Webhook Secret (from stripe listen or Dashboard)
STRIPE_ENDPOINT_SECRET=whsec_xxxxxxxxxxxxx

# Your other env vars...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Best Practices

1. **Use Stripe CLI for local development** - It's the easiest and most reliable method
2. **Keep separate signing secrets** - One for local (from CLI) and one for production (from Dashboard)
3. **Test all event types** - Make sure you handle all webhook events your app uses
4. **Check logs** - Monitor both Stripe CLI output and your Next.js server logs
5. **Use test mode** - Always use Stripe test mode (`sk_test_`) for local development

