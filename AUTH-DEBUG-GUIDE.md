# Authentication Debug Guide

## Issue: Login works locally but fails on live site

### Most Common Causes:

1. **Different API URLs**
   - Local: `http://api.floradistro.com`
   - Live: Should be `https://your-live-domain.com`

2. **Environment Variables Missing**
   - `NEXT_PUBLIC_WORDPRESS_URL` not set on live server
   - `WC_CONSUMER_KEY` different between environments
   - `WC_CONSUMER_SECRET` different between environments

3. **HTTPS vs HTTP Issues**
   - Live site using HTTPS but API configured for HTTP
   - Mixed content security blocking requests

4. **CORS Issues**
   - Live domain not whitelisted in WordPress
   - Different origin causing CORS blocks

### Debug Steps:

1. **Check Browser Console** (F12)
   - Look for debug messages starting with 🔍, 🌐, 🔐
   - Check for network errors or CORS issues

2. **Environment Variables**
   Create `.env.local` file in project root:
   ```bash
   # For local development
   NEXT_PUBLIC_WORDPRESS_URL=http://api.floradistro.com
   WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
   WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
   ```

   For live deployment, set these in your hosting provider:
   ```bash
   # For production
   NEXT_PUBLIC_WORDPRESS_URL=https://your-live-domain.com
   WC_CONSUMER_KEY=your_live_consumer_key
   WC_CONSUMER_SECRET=your_live_consumer_secret
   ```

3. **Test API Endpoints Manually**
   ```bash
   # Test stores endpoint
   curl -X GET "https://your-live-domain.com/wp-json/addify-mli/v1/stores/public"
   
   # Test auth endpoint
   curl -X POST "https://your-live-domain.com/wp-json/addify-mli/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword","store_id":1,"terminal_id":"terminal-1"}'
   ```

### Quick Fixes:

1. **Update WordPress URL for live site:**
   ```javascript
   // In src/lib/woocommerce.ts, temporarily hardcode for testing:
   const API_BASE = 'https://your-live-domain.com' // instead of process.env.NEXT_PUBLIC_WORDPRESS_URL
   ```

2. **Check Network Tab in DevTools:**
   - Look for failed requests to wrong URLs
   - Check if requests are being blocked by CORS
   - Verify the exact error messages from the server

3. **Verify WordPress Plugin Status:**
   - Ensure Addify Multi-Location Inventory plugin is active on live site
   - Check if REST API endpoints are accessible
   - Verify user credentials exist in live WordPress database

### Debug Output Explanation:

When you try to login, you'll see console messages like:
- `🔍 Auth Debug Info:` - Shows environment configuration
- `🌐 Testing connection to:` - Tests if API is reachable
- `🔐 Testing auth to:` - Shows the exact auth request being made
- `📡 Response status:` - HTTP status code from server
- `📄 Raw response:` - Actual server response

### Common Error Messages:

- **"Invalid email or password"** - Credentials don't match live database
- **"Network error"** - Can't reach the API server
- **"CORS error"** - Domain not allowed to access API
- **"404 Not Found"** - API endpoint doesn't exist on live server
- **"500 Internal Server Error"** - Server-side PHP error

### Next Steps:

1. Try logging in and check the browser console
2. Share the debug output to identify the exact issue
3. Update environment variables based on the findings
4. Test API endpoints manually to verify they work 