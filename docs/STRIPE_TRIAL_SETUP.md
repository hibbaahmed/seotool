# Stripe 3-Day $1 Trial Setup Guide

This guide explains how to set up a 3-day $1 trial for your subscription in Stripe.

## Overview

The trial setup works as follows:
- **$1 setup fee**: Charged immediately when the customer signs up
- **3-day trial period**: Full access for 3 days without additional charges
- **$69/month subscription**: Automatically starts after the 3-day trial ends

## Step 1: Create the $1 Setup Fee Price in Stripe

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add product**
3. Create a new product:
   - **Name**: "Setup Fee" or "Trial Setup Fee"
   - **Description**: "One-time setup fee for trial"
   - **Pricing model**: Select **One time**
   - **Price**: $1.00 USD
   - Click **Save product**

4. After creating the product, copy the **Price ID** (starts with `price_`)

## Step 2: Configure Environment Variables

**REQUIRED**: Add the setup fee price ID to your environment variables. The trial requires the $1 setup fee to be configured:

```bash
# In your .env.local or production environment
NEXT_PUBLIC_STRIPE_SETUP_FEE_PRICE_ID=price_xxxxxxxxxxxxx
```

Replace `price_xxxxxxxxxxxxx` with the actual Price ID from Step 1.

**Note**: The setup fee price ID is mandatory. The checkout will fail if this environment variable is not set.

## Step 3: Verify Your Subscription Price

Ensure your main subscription price is correctly configured:

1. In Stripe Dashboard, go to **Products**
2. Find your main subscription product (the $69/month plan)
3. Verify the **Price ID** matches `NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH` in your environment variables

## Step 4: Test the Trial Flow

### Test in Stripe Test Mode

1. Use Stripe's test card: `4242 4242 4242 4242`
2. Any future expiry date (e.g., 12/34)
3. Any 3-digit CVC (e.g., 123)
4. Any ZIP code

### Expected Behavior

1. **Immediate charge**: $1.00 should be charged when the customer completes checkout
2. **Trial period**: Subscription should show as "trialing" for 3 days
3. **After 3 days**: $69.00 should be automatically charged, and the subscription becomes active

## Step 5: Monitor Subscriptions

### In Stripe Dashboard

1. Go to **Customers** to see trial subscriptions
2. Check **Subscriptions** to see the trial status
3. Look for subscriptions with status "trialing"

### Subscription Status Flow

- **Day 0**: Customer signs up → $1 charged, subscription status: `trialing`
- **Days 1-3**: Subscription remains in `trialing` status
- **Day 4**: Stripe automatically charges $69, subscription status: `active`

## Step 6: Handle Webhooks (Already Configured)

Your webhook handler at `/api/webhook/stripe/route.ts` should already handle:
- `checkout.session.completed` - When customer completes checkout
- `customer.subscription.created` - When subscription is created
- `invoice.payment_succeeded` - When payment is successful (including the $1 charge and the $69 charge after trial)

## Troubleshooting

### Issue: Setup fee not being charged or checkout fails

**Solution**: 
- **CRITICAL**: `NEXT_PUBLIC_STRIPE_SETUP_FEE_PRICE_ID` must be set - the checkout will fail without it
- Verify the price ID is correct and matches your Stripe dashboard
- Check that the price ID exists in Stripe
- Ensure the price is set to "One time" (not recurring)
- Check your server logs for the error message if checkout fails

### Issue: Trial period not working

**Solution**:
- Check that `subscription_data.trial_period_days: 3` is set in the checkout session (already configured in code)
- Verify the subscription price is recurring (monthly)
- Check Stripe logs for any errors

### Issue: Customer charged full amount immediately

**Solution**:
- Ensure the trial period is set correctly in the checkout session
- Check that you're not overriding the trial period elsewhere
- Verify the subscription price doesn't have a trial period set at the price level (should be set at checkout session level)

## Important Notes

1. **Setup Fee Timing**: The $1 setup fee is charged immediately when the customer completes checkout, before the trial period begins.

2. **Trial Period**: The 3-day trial applies to the subscription price ($69/month), not the setup fee.

3. **Cancellation**: If a customer cancels during the trial period:
   - They keep access until the trial ends
   - They are not charged the $69 subscription fee
   - The $1 setup fee is non-refundable (unless you implement refund logic)

4. **Webhook Events**: You'll receive multiple webhook events:
   - `checkout.session.completed` - When checkout is completed
   - `invoice.payment_succeeded` - For the $1 charge (immediately)
   - `customer.subscription.created` - When subscription is created
   - `invoice.payment_succeeded` - For the $69 charge (after 3 days)

## Stripe Dashboard Settings

### Recommended Settings

1. **Subscription Settings**:
   - Enable automatic collection of failed payments
   - Set up email notifications for failed payments
   - Configure dunning emails for payment retries

2. **Webhook Settings**:
   - Ensure your webhook endpoint is configured
   - Add events: `checkout.session.completed`, `customer.subscription.created`, `invoice.payment_succeeded`, `customer.subscription.updated`

## Code Implementation

The trial is implemented in:
- `/app/api/create-checkout-session/route.ts` - Adds setup fee and trial period to checkout
- `/components/PricingSection.tsx` - Displays trial information to users

## Testing Checklist

- [ ] $1 setup fee is charged immediately
- [ ] Subscription shows as "trialing" for 3 days
- [ ] $69 is charged automatically after 3 days
- [ ] Customer receives confirmation emails
- [ ] Webhook events are received correctly
- [ ] Subscription status updates correctly in your database
- [ ] Customer can cancel during trial without being charged $69

