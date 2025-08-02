# Stripe Setup Guide for Development

## Issue: Payment Form Validation Errors with Live Keys

You're currently using **live Stripe keys** (`sk_live_*`) which have strict validation requirements and are meant for production use only. For development and testing, you should use **test keys**.

## How to Get Test Keys

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Toggle to Test Mode**: 
   - Look for the "Test mode" toggle in the left sidebar
   - Make sure it's ON (should show "Test mode" at the top)
3. **Get Your Test Keys**:
   - Go to "Developers" → "API keys"
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

## Update Your Environment Variables

Replace your current keys with test keys:
- `VITE_STRIPE_PUBLIC_KEY` = `pk_test_...` (your test publishable key)
- `STRIPE_SECRET_KEY` = `sk_test_...` (your test secret key)

## Test Credit Cards

With test keys, you can use these test card numbers:
- **Success**: `4242424242424242`
- **Declined**: `4000000000000002`
- **Requires 3D Secure**: `4000002500003155`

Use any future expiry date (e.g., `12/34`) and any 3-digit CVC.

## Why This Matters

- **Live keys** require full business verification and compliance
- **Test keys** allow you to develop and test without restrictions
- Test mode never charges real cards or creates real subscriptions
- You can switch to live keys later when ready for production

## Production Checklist (For Later)

Before using live keys in production:
1. Complete Stripe business verification
2. Set up proper webhook endpoints
3. Implement proper error handling
4. Test all payment scenarios thoroughly
5. Review Stripe's production checklist