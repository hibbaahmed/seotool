# Trial Period: Unlimited Usage Implementation

## Overview

During the 3-day $1 trial period, users have **unlimited usage** - credits are not deducted. This provides the best user experience by allowing customers to fully explore all features without restrictions.

## How It Works

### 1. Trial Status Tracking

- When a subscription is created with a trial period, the webhook handler stores `trial_ends_at` in the `subscription` table
- The `trial_ends_at` timestamp is set from Stripe's `subscription.trial_end` field
- This timestamp marks when the trial period ends
- **Note**: Trial status is stored in the `subscription` table (not `credits` table) as it's a subscription property

### 2. Credit Checking Logic

**File**: `app/utils/creditCheck.js`

- Checks if current date is before `trial_ends_at`
- If in trial: Returns `hasEnoughCredits: true` regardless of credit balance
- If not in trial: Normal credit checking applies

```javascript
const isInTrial = trialEndsAt && now < trialEndsAt;
const hasEnoughCredits = isInTrial || currentCredits >= requiredCredits;
```

### 3. Credit Deduction Logic

**File**: `app/api/deduct-credits/route.ts`

- Checks if user is in trial period before deducting credits
- If in trial: Skips deduction entirely (returns success immediately)
- If not in trial: Normal credit deduction applies

### 4. Webhook Integration

**File**: `app/api/webhook/stripe/route.ts`

- When subscription is created/updated, checks `subscription.status === 'trialing'`
- Extracts `subscription.trial_end` and stores as `trial_ends_at`
- Updates both new and existing credit records with trial information

## Database Schema

### Migration Required

Run the migration to add the `trial_ends_at` column to the subscription table:

```sql
-- File: migrations/move_trial_ends_at_to_subscription.sql
ALTER TABLE subscription 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
```

**Note**: If you previously added `trial_ends_at` to the credits table, run the removal migration:

```sql
-- File: migrations/remove_trial_ends_at_from_credits.sql
ALTER TABLE credits 
DROP COLUMN IF EXISTS trial_ends_at;
```

### Subscription Table Structure

```sql
subscription (
  email TEXT,
  customer_id TEXT,
  subscription_id TEXT,
  end_at DATE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,  -- NEW: Trial end timestamp
  created_at TIMESTAMP,
  ...
)
```

**Note**: `trial_ends_at` is stored in the `subscription` table, not the `credits` table, as it's a subscription property.

## User Experience Flow

### Day 0: User Signs Up
1. User pays $1 setup fee
2. Subscription created with status: `trialing`
3. `trial_ends_at` set to 3 days from now
4. **No credits are added** - user has unlimited usage during trial
5. Credits record created with 0 credits (subscription info stored)

### Days 1-3: Trial Period
- ✅ All features work without credit deduction
- ✅ User can generate unlimited content
- ✅ No "out of credits" dialogs
- ✅ Full access to all premium features

### Day 4: Trial Ends
1. Stripe automatically charges $69
2. Subscription status changes to `active`
3. **30 credits are now allocated** to the user
4. Normal credit system applies (credits are deducted)
5. `trial_ends_at` is cleared from subscription table

## Code Changes Summary

### Modified Files

1. **`app/utils/creditCheck.js`**
   - Queries `subscription` table for `trial_ends_at`
   - Added trial period check logic
   - Returns `isInTrial` flag

2. **`app/api/deduct-credits/route.ts`**
   - Queries `subscription` table for trial status
   - Skips deduction during trial
   - Returns early with success if in trial

3. **`app/api/webhook/stripe/route.ts`**
   - Extracts trial end date from Stripe subscription
   - Stores `trial_ends_at` in `subscription` table (not credits table)
   - Updates subscription table on both checkout and payment events

4. **`app/context/CreditsContext.jsx`**
   - Added `isInTrial` to context
   - Updates trial status from credit check results

## Testing

### Test Scenarios

1. **New Trial User**
   - Sign up with $1 trial
   - Verify `trial_ends_at` is set in database
   - Verify unlimited usage works
   - Verify no credits are deducted

2. **Trial Expiration**
   - Wait for trial to end (or manually update `trial_ends_at` to past date)
   - Verify normal credit system applies
   - Verify credits are deducted

3. **Webhook Events**
   - Test `customer.subscription.created` with trial
   - Test `invoice.payment_succeeded` after trial
   - Verify `trial_ends_at` is set correctly

### Manual Testing

```sql
-- Check if subscription is in trial
SELECT 
  email,
  subscription_id,
  trial_ends_at,
  CASE 
    WHEN trial_ends_at IS NOT NULL AND NOW() < trial_ends_at 
    THEN 'IN TRIAL' 
    ELSE 'NOT IN TRIAL' 
  END as trial_status
FROM subscription
WHERE email = 'user@example.com';
```

## Benefits

1. **Better User Experience**: Users can fully explore the product without restrictions
2. **Higher Conversion**: Unlimited trial access increases likelihood of conversion
3. **No Credit Confusion**: Users don't need to worry about credits during trial
4. **Automatic Transition**: Seamless transition from trial to paid subscription

## Important Notes

- The trial period is determined by Stripe's subscription status
- `trial_ends_at` is automatically set by the webhook handler
- No manual intervention needed - the system handles everything automatically
- If a user cancels during trial, they keep access until `trial_ends_at`
- After trial ends, normal credit system applies immediately

## Troubleshooting

### Issue: User not getting unlimited usage during trial

**Check**:
1. Verify `trial_ends_at` is set in `subscription` table (not credits table)
2. Check that current date is before `trial_ends_at`
3. Verify subscription status in Stripe is `trialing`
4. Check webhook logs for errors
5. Verify the code is querying the `subscription` table, not `credits` table

### Issue: Credits being deducted during trial

**Check**:
1. Verify `trial_ends_at` is not null
2. Check that date comparison logic is correct
3. Verify `deduct-credits` API is checking trial status
4. Check server logs for trial status checks

### Issue: Trial not ending properly

**Check**:
1. Verify Stripe webhook is firing `invoice.payment_succeeded`
2. Check that subscription status changes to `active`
3. Verify `trial_ends_at` is in the past after trial ends
4. Check webhook handler logs

