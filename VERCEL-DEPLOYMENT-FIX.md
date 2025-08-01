# Vercel Deployment Fix for Authentication Issue

## Problem Identified:
Your live site (`pos-dliu.vercel.app`) is trying to authenticate against itself instead of your WordPress backend (`api.floradistro.com`).

## Root Cause:
Missing environment variables on Vercel deployment.

## Quick Fix Steps:

### 1. Set Environment Variables on Vercel

Go to your Vercel dashboard:
1. Navigate to your project: `pos-dliu.vercel.app`
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```bash
NEXT_PUBLIC_WORDPRESS_URL = https://api.floradistro.com
WC_CONSUMER_KEY = ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WC_CONSUMER_SECRET = cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```

**Important:** Make sure to set these for **Production** environment.

### 2. Redeploy Your Site

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** on your latest deployment
3. Select **Redeploy**

OR

Push any small change to trigger a new deployment.

### 3. Verify the Fix

After redeployment:
1. Try logging in again
2. Check browser console - you should see debug messages showing the correct API URLs
3. Look for: `🌐 Testing connection to: https://api.floradistro.com/wp-json/addify-mli/v1/stores/public`

## Alternative Quick Test:

If you want to test immediately without waiting for Vercel deployment, you can temporarily hardcode the URL:

In `src/lib/woocommerce.ts`, line 3, change:
```javascript
const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'
```

To:
```javascript
const API_BASE = 'https://api.floradistro.com'  // Hardcoded for testing
```

Then push this change to test. **Remember to revert this after setting proper environment variables.**

## What Was Happening:

1. Local: Uses `http://api.floradistro.com` (default fallback)
2. Live: No environment variable set, so Next.js API routes were trying to call WordPress on the same domain
3. Result: 401 Unauthorized because user doesn't exist in the wrong database

## Expected Debug Output After Fix:

You should see:
```
🔍 Auth Debug Info:
- WordPress URL: https://api.floradistro.com
🌐 Testing connection to: https://api.floradistro.com/wp-json/addify-mli/v1/stores/public
🔐 Testing auth to: https://api.floradistro.com/wp-json/addify-mli/v1/auth/login
```

Instead of URLs pointing to `pos-dliu.vercel.app`. 