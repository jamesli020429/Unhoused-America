# Frontend API Configuration Guide

## 🎯 Quick Reference

Your React app now supports **easy switching** between local and production backends!

## 🔧 How It Works

All API calls now use: `process.env.REACT_APP_API_URL || 'http://localhost:8787'`

This reads from environment files with a fallback to localhost.

## 🏠 Testing Locally (Node.js Backend)

**File:** `.env.local` (already created)
```bash
REACT_APP_API_URL=http://localhost:8787
```

**To use:**
1. Start your local backend:
   ```bash
   cd backend
   npm start
   ```

2. Start React app:
   ```bash
   cd unhoused-america
   npm start
   ```

That's it! Your app will use the local Node.js backend.

## ☁️ Using Cloudflare Workers

### Option 1: Update .env.local
```bash
REACT_APP_API_URL=https://your-worker-name.your-subdomain.workers.dev
```

### Option 2: Use Production Build
When you run `npm run build`, it automatically uses `.env.production`

## ⚡ Quick Switching

### Switch to Local Backend
```bash
# Edit .env.local
REACT_APP_API_URL=http://localhost:8787

# Restart React app (Ctrl+C then npm start)
```

### Switch to Cloudflare
```bash
# Edit .env.local
REACT_APP_API_URL=https://your-worker-name.workers.dev

# Restart React app (Ctrl+C then npm start)
```

**Important:** Changes to `.env` files require restarting the dev server!

## 📝 Environment Files

| File | Purpose | Git Tracked? |
|------|---------|--------------|
| `.env.local` | Local development (you edit this) | ❌ No |
| `.env.production` | Production builds | ✅ Yes |
| `.env.example` | Template/documentation | ✅ Yes |

## 🚀 After Cloudflare Deployment

1. Deploy your worker:
   ```bash
   cd backend-cloudflare
   npm run deploy
   ```

2. Copy the deployment URL (looks like: `https://unhoused-america-backend.xyz.workers.dev`)

3. Update `.env.production`:
   ```bash
   REACT_APP_API_URL=https://unhoused-america-backend.xyz.workers.dev
   ```

4. For local testing with Cloudflare, update `.env.local` with the same URL

## 🧪 Testing Setup

### Test with Local Backend
```bash
# Terminal 1: Start local backend
cd backend
npm start

# Terminal 2: Start React app
cd unhoused-america
npm start

# .env.local should have: REACT_APP_API_URL=http://localhost:8787
```

### Test with Cloudflare
```bash
# Just start React app
cd unhoused-america
npm start

# .env.local should have: REACT_APP_API_URL=https://your-worker.workers.dev
```

## 🔍 Verify Current Configuration

Open your browser console and check network requests:
- Local: Calls go to `http://localhost:8787/api/personas`
- Cloudflare: Calls go to `https://your-worker.workers.dev/api/personas`

## 💡 Pro Tips

1. **Keep .env.local for switching**: Don't delete it - just change the URL when needed

2. **Use local for development**: Faster iteration, easier debugging

3. **Use Cloudflare for demos**: Share live URL with others

4. **Production builds**: Always use `.env.production` URL

## 🐛 Troubleshooting

### React app still using old URL?
**Solution:** Restart the dev server (environment changes need restart)

### API calls failing?
**Check:**
1. Backend is running (local or Cloudflare deployed)
2. `.env.local` has correct URL
3. No typos in the URL
4. CORS is configured (already set up in both backends)

### Can't see .env files?
They might be hidden. In VS Code, they should show up. On Windows, enable "Show hidden files"

## 📋 Quick Commands

```bash
# See current env variable (while React app is running)
echo %REACT_APP_API_URL%     # Windows CMD
echo $env:REACT_APP_API_URL  # Windows PowerShell
echo $REACT_APP_API_URL      # Mac/Linux

# Restart React app (in the terminal running npm start)
Ctrl+C
npm start
```

---

**Your setup is complete!** You can now easily switch between local and production backends by editing `.env.local` and restarting the React app.
