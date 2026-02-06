# 🚀 Cloudflare Pages - OpenAI API Setup Guide

## 🎯 Problem
Your website is showing "Invalid API Key" errors because the Cloudflare Worker doesn't have access to your OpenAI API key.

## ✅ Solution
Add the OpenAI API key as an environment variable in Cloudflare Pages.

---

## 📋 Step-by-Step Instructions

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click **"Create new secret key"** (or use an existing one)
4. **Copy the key** - it starts with `sk-proj-...` or `sk-...`
5. **Save it somewhere safe** - you won't be able to see it again!

---

### Step 2: Add Environment Variable to Cloudflare Pages

#### Option A: Using Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Open [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Sign in to your account

2. **Navigate to Your Project**
   - Click on **"Workers & Pages"** in the left sidebar
   - Find and click on your **Hajri** project

3. **Open Settings**
   - Click on the **"Settings"** tab at the top

4. **Add Environment Variable**
   - Scroll down to **"Environment variables"** section
   - Click **"Add variable"** or **"Edit variables"**

5. **Configure the Variable**
   - **Variable name**: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI API key (e.g., `sk-proj-abc123...`)
   - **Environment**: Select **"Production"** (and optionally **"Preview"** if you want it in preview deployments too)

6. **Save**
   - Click **"Save"** or **"Save and deploy"**

#### Option B: Using Wrangler CLI (Alternative)

If you prefer using the command line:

```bash
# Install Wrangler if you haven't already
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Add the environment variable
wrangler pages secret put OPENAI_API_KEY
# When prompted, paste your OpenAI API key
```

---

### Step 3: Redeploy Your Application

**Important**: Environment variables only take effect after redeployment!

#### Option A: Trigger Redeploy from Dashboard
1. Go to your project in Cloudflare Pages
2. Click on **"Deployments"** tab
3. Click **"Retry deployment"** on the latest deployment
   - OR push a new commit to trigger automatic deployment

#### Option B: Redeploy from Git
```bash
# Make a small change and push to trigger redeployment
git commit --allow-empty -m "Trigger redeploy for OpenAI env var"
git push
```

---

### Step 4: Verify It's Working

1. **Wait for deployment to complete** (usually 1-2 minutes)
2. **Open your website** (e.g., `https://hajri.pages.dev` or your custom domain)
3. **Test AI features**:
   - Go to **Dashboard** → Try **"Magic Entry"**
   - Go to **Expenses** → Try **"Magic Entry"**
   - Go to **Estimates** → Try uploading a document

4. **Check for errors**:
   - Open browser console (F12)
   - Look for any error messages
   - If you see "OpenAI API key not configured", the env var wasn't set correctly

---

## 🔍 Troubleshooting

### Error: "OpenAI API key not configured in Cloudflare Worker environment variables"

**Cause**: The environment variable wasn't added or the app wasn't redeployed.

**Fix**:
1. Double-check you added `OPENAI_API_KEY` (exact name, case-sensitive)
2. Verify you selected "Production" environment
3. Make sure you redeployed after adding the variable
4. Wait a few minutes for Cloudflare to propagate changes

---

### Error: "Invalid API Key" or 401 Unauthorized

**Cause**: The API key is incorrect or expired.

**Fix**:
1. Verify your OpenAI API key is valid
2. Check your OpenAI account has available credits
3. Try creating a new API key and updating the environment variable

---

### Error: "Rate limit exceeded" or 429

**Cause**: You've hit OpenAI's rate limits or run out of credits.

**Fix**:
1. Check your [OpenAI usage](https://platform.openai.com/usage)
2. Add credits to your OpenAI account
3. Wait a few minutes if you hit rate limits

---

### AI Features Work Locally But Not in Production

**Cause**: Local dev uses `.env` file, production uses Cloudflare environment variables.

**Fix**:
1. Make sure you added `OPENAI_API_KEY` to Cloudflare (not just `.env`)
2. Redeploy your application
3. Clear browser cache and try again

---

## 🔒 Security Checklist

- [x] API key is stored in Cloudflare environment variables (server-side)
- [x] API key is NOT in your code or `.env` file committed to Git
- [x] Cloudflare Worker injects the key server-side
- [x] Browser never sees the API key
- [x] `.env` file is in `.gitignore`

---

## 📊 How It Works

### Architecture Flow

```
User Browser
    ↓
    | Makes request to /api/openai/chat/completions
    ↓
Cloudflare Pages (Your Website)
    ↓
    | Request is routed to Cloudflare Worker
    ↓
Cloudflare Worker (functions/api/openai/[[catchall]].js)
    ↓
    | 1. Reads OPENAI_API_KEY from environment
    | 2. Adds Authorization header
    | 3. Forwards request to OpenAI
    ↓
OpenAI API
    ↓
    | Returns AI response
    ↓
Cloudflare Worker
    ↓
    | Forwards response back
    ↓
User Browser (Displays result)
```

### Key Points
- **Browser**: Never sees the API key ✅
- **Worker**: Injects key server-side ✅
- **OpenAI**: Receives authenticated request ✅

---

## 🎯 Quick Reference

| Environment | Where API Key is Stored | How to Update |
|-------------|------------------------|---------------|
| **Local Dev** | `.env` file (`VITE_OPENAI_API_KEY`) | Edit `.env` and restart dev server |
| **Production** | Cloudflare environment variables (`OPENAI_API_KEY`) | Cloudflare Dashboard → Settings → Environment variables |

---

## ✅ Deployment Checklist

Before marking this as complete:

- [ ] OpenAI API key obtained from platform.openai.com
- [ ] `OPENAI_API_KEY` added to Cloudflare Pages environment variables
- [ ] Environment set to "Production" (and "Preview" if needed)
- [ ] Application redeployed after adding environment variable
- [ ] Tested Magic Entry on Dashboard (attendance parsing)
- [ ] Tested Magic Entry on Expenses (expense parsing)
- [ ] Tested document upload on Estimates (BOQ extraction)
- [ ] No errors in browser console
- [ ] API key NOT committed to Git

---

## 🆘 Still Having Issues?

If you've followed all steps and it's still not working:

1. **Check Cloudflare Function Logs**:
   - Go to Cloudflare Dashboard → Your Project → Functions
   - Look for error logs from the OpenAI worker

2. **Verify the Worker is Deployed**:
   - Check that `functions/api/openai/[[catchall]].js` exists in your deployment
   - Cloudflare should automatically detect and deploy it

3. **Test the Worker Directly**:
   - Open browser console
   - Try: `fetch('/api/openai/models').then(r => r.json()).then(console.log)`
   - Should return OpenAI models list if working

4. **Check Network Tab**:
   - Open DevTools → Network tab
   - Try using Magic Entry
   - Look at the `/api/openai/chat/completions` request
   - Check the response for detailed error messages

---

**Status**: 🟡 **Waiting for Cloudflare Configuration**  
**Next Step**: Add `OPENAI_API_KEY` to Cloudflare Pages and redeploy
