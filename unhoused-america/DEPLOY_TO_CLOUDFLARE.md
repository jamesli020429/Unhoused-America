# Deploy Frontend to Cloudflare Pages

## 🚀 Quick Overview

Cloudflare Pages is the easiest way to host your React frontend. It's:
- ✅ Free tier included
- ✅ Automatic deployments from GitHub
- ✅ Global CDN (fast everywhere)
- ✅ Built-in analytics

Two deployment options:
1. **Git Integration** (Recommended) - Auto-deploy on every push
2. **Direct Upload** - Deploy with CLI commands

---

## Option A: Git Integration (Easiest)

### 1. Push Your Code to GitHub

First, your project needs to be on GitHub:

```bash
cd /path/to/Unhoused-America
git add .
git commit -m "Add Cloudflare backend and frontend config"
git push origin main
```

If you don't have it on GitHub yet:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/Unhoused-America.git
git push -u origin main
```

### 2. Connect GitHub to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** → **Pages** (left sidebar)
3. Click **Connect to Git**
4. Authorize Cloudflare to access your GitHub account
5. Select your `Unhoused-America` repository

### 3. Configure Build Settings

When you connect the repo, you'll see build configuration:

- **Project name:** `unhoused-america` (or your choice)
- **Production branch:** `main`
- **Framework preset:** `Create React App`
- **Build command:** `npm run build`
- **Build output directory:** `build`
- **Root directory:** `unhoused-america` (important!)

**Add environment variable:**
- Variable name: `REACT_APP_API_URL`
- Value: `https://your-backend-worker-url.workers.dev`

Click **Save and Deploy** ✨

### 4. Get Your Public URL

After deployment, you'll see a URL like:
```
https://unhoused-america.pages.dev
```

That's your live frontend!

### 5. Update Backend API URL

Once deployed, update your frontend config:

```bash
cd unhoused-america
# Edit .env.production with your backend URL
REACT_APP_API_URL=https://unhoused-america-backend.SUBDOMAIN.workers.dev
```

Commit and push:
```bash
git add .env.production
git commit -m "Update Cloudflare backend URL"
git push origin main
```

Cloudflare will automatically rebuild and redeploy! 🎉

---

## Option B: Direct CLI Deployment

Use this if you prefer not to use GitHub.

### 1. Install Wrangler (if not already)

```bash
npm install -g wrangler
```

### 2. Build Your React App

```bash
cd unhoused-america
npm run build
```

This creates a `build/` folder with your static files.

### 3. Deploy to Pages

```bash
wrangler pages deploy build --project-name unhoused-america
```

Wrangler will:
- Ask you to create a project (if first time)
- Upload your build folder
- Give you a public URL

### 4. Set Environment Variables

After deployment:

```bash
wrangler pages env list
wrangler pages env set REACT_APP_API_URL https://your-backend-worker-url.workers.dev --branch production
```

Or set via dashboard: Pages → Project → Settings → Environment variables

---

## 🔗 Connect Frontend to Backend

Your frontend needs to know where to find the backend API.

### For Local Testing
Already configured in [.env.local](unhoused-america/.env.local):
```bash
REACT_APP_API_URL=http://localhost:8787
```

### For Production (Cloudflare)
Update [.env.production](unhoused-america/.env.production):
```bash
REACT_APP_API_URL=https://unhoused-america-backend.YOUR-SUBDOMAIN.workers.dev
```

**Where to find your backend URL:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages → Workers → unhoused-america-backend
3. Copy the URL from "Deployments"

---

## 🎯 Complete Deployment Flow

### Step-by-Step

```bash
# 1. Prepare backend (if not done already)
cd backend-cloudflare
npm run deploy
# Copy the deployment URL

# 2. Update frontend config
cd ../unhoused-america
# Edit .env.production with your backend URL
REACT_APP_API_URL=https://YOUR-BACKEND-URL

# 3. Commit changes
git add .env.production
git commit -m "Update backend API URL for production"
git push origin main

# 4. Deploy to Cloudflare Pages
# (Automatic if using Git integration)
# OR manual:
npm run build
wrangler pages deploy build --project-name unhoused-america
```

---

## 🌐 Add Custom Domain (Optional)

If you have a domain, you can use it instead of `.pages.dev`:

### Option 1: Domain at Cloudflare

1. Add domain to Cloudflare: [dash.cloudflare.com](https://dash.cloudflare.com) → Add domain
2. Go to Pages → Your project → Custom domain
3. Enter your domain: `example.com` or `app.example.com`
4. Cloudflare auto-configures DNS

### Option 2: Domain at Another Registrar

1. Go to Pages → Your project → Custom domain
2. Enter your domain
3. Note the CNAME value Cloudflare provides
4. Add CNAME record in your registrar's DNS settings
5. Wait for DNS to propagate (5-30 min)

### Verify It Works

```bash
curl https://your-domain.com
```

---

## 🧪 Testing After Deployment

### Check Frontend is Up
```bash
curl https://unhoused-america.pages.dev
```

### Check API Connection
Open browser console (F12) and check Network tab. API calls should go to:
```
https://your-backend-worker.workers.dev/api/personas
```

### Test Full Flow
1. Visit your Pages URL
2. Start a new persona
3. Should call backend successfully
4. Image should generate

---

## 🔒 Environment Variables Cheat Sheet

| Where | Variable | Value |
|-------|----------|-------|
| **React App** | `REACT_APP_API_URL` | Your backend worker URL |
| **Backend Worker** | `GEMINI_API_KEY` | Your Gemini API key |
| **Backend Worker** | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| **Backend Worker** | `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token |

---

## 📊 What Cloudflare Gives You Free

- **Pages:** 500 builds/month, unlimited requests
- **Workers:** 100,000 requests/day
- **D1:** 5GB storage, 5M reads/day
- **AI Models:** 10,000 requests/day

This is plenty for development and small-scale use!

---

## 🐛 Troubleshooting

### "Build failed"
Check:
1. `root directory` is set to `unhoused-america/` (with trailing slash)
2. `build command` is `npm run build`
3. All dependencies installed: `npm install`

### "API calls failing" 
Check:
1. Backend worker is deployed: `wrangler deploy` in backend-cloudflare/
2. `REACT_APP_API_URL` matches exactly
3. Backend worker has all secrets set

### "Build command not found"
```bash
cd unhoused-america
npm install
npm run build
```

### "CORS error"
Cloudflare backend already handles CORS. If issues, check [backend-cloudflare/src/index.js](../backend-cloudflare/src/index.js) CORS headers.

---

## 🎉 You're Live!

Once deployed:
- Frontend: `https://unhoused-america.pages.dev` (or your custom domain)
- Backend: `https://unhoused-america-backend.*.workers.dev`
- Database: D1 (private, accessed by backend)

Everything is globally distributed and auto-scaling! 🚀

---

## 📝 Next Steps

1. ✅ Deploy backend with `npm run deploy` (in backend-cloudflare)
2. ✅ Update .env.production with backend URL
3. ✅ Connect GitHub repo to Cloudflare Pages OR use `wrangler pages deploy`
4. ✅ Test API calls work from browser
5. ✅ (Optional) Add custom domain
6. ✅ (Optional) Set up monitoring in Cloudflare Dashboard

---

## 📚 Quick Commands Reference

```bash
# Build React app
cd unhoused-america
npm run build

# Deploy to Pages (CLI)
wrangler pages deploy build --project-name unhoused-america

# View Pages project
wrangler pages project list

# Check worker deployment
cd ../backend-cloudflare
npm run deploy

# View logs
wrangler tail

# Check Pages live logs
wrangler pages deployment list
```

---

Need help? Check the [README.md](../backend-cloudflare/README.md) or [FRONTEND_CONFIG.md](./FRONTEND_CONFIG.md)!
