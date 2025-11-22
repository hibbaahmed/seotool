# Quick Setup: $1 Trial in Stripe Dashboard

Follow these steps to set up your 3-day $1 trial in Stripe.

## Step 1: Create the $1 Setup Fee Product

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Click "Products"** in the left sidebar
3. **Click "Add product"** button (top right)

4. **Fill in the product details**:
   ```
   Name: Trial Setup Fee
   Description: One-time $1 setup fee for 3-day trial
   ```

5. **Set the pricing**:
   - Click **"Add price"**
   - **Pricing model**: Select **"One time"** (NOT recurring)
   - **Price**: Enter `1.00`
   - **Currency**: Select `USD`
   - Click **"Save price"**

6. **Save the product**: Click **"Save product"** at the bottom

7. **Copy the Price ID**:
   - After saving, you'll see the product page
   - Find the **Price ID** (it starts with `price_` like `price_1ABC123xyz`)
   - **Copy this Price ID** - you'll need it for Step 2

## Step 2: Add Price ID to Your Environment Variables

1. **Open your environment file** (`.env.local` for local, or your production environment)

2. **Add this line**:
   ```bash
   NEXT_PUBLIC_STRIPE_SETUP_FEE_PRICE_ID=price_1ABC123xyz
   ```
   (Replace `price_1ABC123xyz` with the actual Price ID you copied in Step 1)

3. **Save the file** and restart your development server if running locally

## Step 3: Verify Your Subscription Price Exists

1. **In Stripe Dashboard**, go to **Products**
2. **Find your $69/month subscription product**
3. **Check that you have the Price ID** for this product
4. **Verify** it matches your `NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH` environment variable

## Step 4: Test It Out

### In Test Mode:

1. **Make sure you're in Test Mode** (toggle in top right of Stripe Dashboard)
2. **Go to your app** and try to checkout
3. **Use Stripe's test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

### What Should Happen:

✅ **Immediately**: $1.00 is charged  
✅ **Subscription status**: Shows as "trialing"  
✅ **After 3 days**: $69.00 is automatically charged  
✅ **Subscription status**: Changes to "active"

## Visual Guide: Stripe Dashboard

```
Stripe Dashboard
├── Products (left sidebar)
    ├── Click "Add product"
    │   ├── Name: "Trial Setup Fee"
    │   ├── Description: "One-time $1 setup fee"
    │   └── Add price
    │       ├── Pricing model: "One time" ⚠️ IMPORTANT
    │       ├── Price: 1.00
    │       └── Currency: USD
    │   └── Save product
    └── Copy Price ID (starts with price_)
```

## Common Mistakes to Avoid

❌ **Don't** create the setup fee as a recurring price  
✅ **Do** create it as a "One time" price

❌ **Don't** forget to copy the Price ID  
✅ **Do** double-check the Price ID matches your environment variable

❌ **Don't** use the Product ID (starts with `prod_`)  
✅ **Do** use the Price ID (starts with `price_`)

## Troubleshooting

### "Setup fee price ID is not configured" error
- Check that `NEXT_PUBLIC_STRIPE_SETUP_FEE_PRICE_ID` is set in your environment
- Restart your server after adding the environment variable
- Verify the Price ID is correct (starts with `price_`)

### $1 not being charged
- Verify the price is set to "One time" (not recurring)
- Check the Price ID in your environment matches Stripe
- Look at Stripe Dashboard → Customers → [Customer] → Payments to see charges

### Trial not working
- The trial period is set in code (3 days) - no Stripe configuration needed
- Check that your subscription price exists and is recurring (monthly)

## Next Steps

Once set up:
1. Test the flow in Stripe Test Mode
2. Monitor subscriptions in Stripe Dashboard → Subscriptions
3. Check webhook events in Stripe Dashboard → Developers → Webhooks
4. When ready, switch to Live Mode and test with a real card

## Need Help?

- Check the full documentation: `/docs/STRIPE_TRIAL_SETUP.md`
- Stripe Documentation: https://stripe.com/docs/billing/subscriptions/trials
- Stripe Support: https://support.stripe.com

