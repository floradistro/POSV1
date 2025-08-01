# WordPress POS Authentication Setup Guide

## 🚨 Current Issue
Your login is failing because:
1. WordPress Application Password is not configured properly (`your_app_password_here`)
2. User may not have POS access enabled in WordPress admin

## 🔧 Fix Steps

### Step 1: Generate WordPress Application Password

1. **Login to your WordPress Admin**: `https://api.floradistro.com/wp-admin`

2. **Go to Users → Profile**:
   - Click on your user profile (admin)

3. **Scroll down to "Application Passwords"** section:
   - Application Name: `Flora POS System`
   - Click **"Add New Application Password"**

4. **Copy the generated password** (it will look like: `abcd 1234 efgh 5678 ijkl 9012`)

5. **Update your `.env.local` file**:
   ```bash
   # Replace this line:
   WP_APP_PASSWORD=your_app_password_here
   
   # With your actual password:
   WP_APP_PASSWORD=abcd 1234 efgh 5678 ijkl 9012
   ```

### Step 2: Configure User POS Access

1. **Go to WordPress Admin** → Users → All Users

2. **Find your user** (`floradistrodev@gmail.com`) and click **Edit**

3. **Scroll down to "POS Access Settings"** section and configure:

   ✅ **Enable POS Access** - Check this box  
   
   🎭 **POS Role** - Select: `Super Admin`
   
   🏪 **Allowed Stores** - Check all boxes:
   - ☑️ Flora Distro - Blowing Rock
   - ☑️ Flora Distro - Charlotte (Monroe)  
   - ☑️ Flora Distro - Charlotte (Nations Ford)
   - ☑️ Flora Distro - Elizabethton
   - ☑️ Flora Distro - Salisbury

   🔒 **POS Password** - Set this to your login password

4. **Click "Update User"**

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Login

1. Go to: `http://localhost:3000`
2. Login with:
   - **Email**: `floradistrodev@gmail.com`
   - **Password**: [Your POS password from Step 2]
   - **Store**: Any store (you have access to all)
   - **Terminal**: Any terminal

## 🔍 Troubleshooting

### If you still get "Invalid email or password":

1. **Check WordPress Plugin is Active**:
   - Go to WordPress Admin → Plugins
   - Ensure "Flora Points & Rewards Headless" is **Active**

2. **Verify User Meta in Database**:
   ```sql
   SELECT * FROM wp_usermeta 
   WHERE user_id = [YOUR_USER_ID] 
   AND meta_key IN ('pos_enabled', 'pos_role', 'pos_allowed_stores');
   ```
   
   Should show:
   - `pos_enabled` = `1`
   - `pos_role` = `super_admin`
   - `pos_allowed_stores` = array of store IDs

3. **Test WordPress API Directly**:
   ```bash
   curl -X POST https://api.floradistro.com/wp-json/flora-pos/v1/auth \
   -H "Content-Type: application/json" \
   -H "Authorization: Basic [BASE64_OF_USERNAME:APP_PASSWORD]" \
   -d '{"username":"floradistrodev@gmail.com","password":"your_pos_password"}'
   ```

### If Application Password section is missing:

1. **Enable Application Passwords** in WordPress:
   - Add to `wp-config.php`: `define('WP_APPLICATION_PASSWORDS', true);`
   - Or install a plugin like "Application Passwords"

2. **Check WordPress version** (requires 5.6+)

## 📞 Quick Fix Commands

If you have SSH access to your server:

```bash
# Enable POS access for user ID 1 (admin)
wp user meta update 1 pos_enabled 1
wp user meta update 1 pos_role super_admin
wp user meta update 1 pos_allowed_stores '["mli_28","mli_30","mli_32","mli_34","mli_36"]'
```

## ✅ Success Indicators

You'll know it's working when you see in the logs:
```
✅ Flora POS plugin authentication successful
🎉 Login successful for: floradistrodev@gmail.com
```

Instead of:
```
❌ Flora POS plugin authentication failed: Error: WordPress API error: 401 - Unauthorized
🔄 Trying WordPress standard authentication...
``` 