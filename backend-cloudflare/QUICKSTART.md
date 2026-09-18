# Quick Start Guide - Cloudflare Workers Backend

## 🚀 Fast Setup (5 minutes)

### 1. Install & Login
```bash
cd backend-cloudflare
npm install
npm install -g wrangler
wrangler login
```

### 2. Create Database
```bash
npm run d1:create
```
Copy the `database_id` from output → paste into `wrangler.toml`

### 3. Initialize Database
```bash
npm run d1:init
```

### 4. Set Secrets
```bash
wrangler secret put GEMINI_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_API_TOKEN
```

### 5. Ingest City Data
```bash
# From your local backend folder
cd ../backend
npm run injest:cities

# Export city data
sqlite3 personas.db ".mode insert city_chunks" ".output city_chunks.sql" "SELECT * FROM city_chunks;"

# Import to D1
cd ../backend-cloudflare
wrangler d1 execute unhoused-personas --file=../backend/city_chunks.sql
```

### 6. Test Locally
```bash
npm run dev
```
Visit: http://localhost:8787/health

### 7. Deploy
```bash
npm run deploy
```

Done! Your API is live at `https://unhoused-america-backend.*.workers.dev`

---

## 📝 Common Commands

```bash
# Development
npm run dev                    # Start local dev server
wrangler tail                  # View live logs

# Database
npm run d1:init               # Initialize schema (production)
npm run d1:init-local         # Initialize schema (local)
wrangler d1 execute unhoused-personas --command="SELECT * FROM personas LIMIT 5"

# Deployment
npm run deploy                # Deploy to production
wrangler publish              # Same as deploy

# Secrets
wrangler secret list          # List all secrets
wrangler secret delete KEY    # Delete a secret
wrangler secret put KEY       # Add/update a secret
```

---

## ⚠️ Before First Use

You MUST ingest city data (Step 5) or the `/api/personas` endpoint will fail with:
```
"No chunks found for city"
```

---

## 🔗 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Update your frontend to use the new API URL
- Set up custom domain (optional): `wrangler domains add yourdomain.com`
- Monitor usage in Cloudflare Dashboard

---

## 💡 Tips

- **Local Development**: Use `--local` flag for faster testing without deploying
- **Debugging**: Add `console.log()` in your code, then run `wrangler tail`
- **Environment Variables**: Use `.dev.vars` file for local development (git-ignored)
- **Cost**: Free tier is generous - 100k requests/day for Workers, 5M reads/day for D1

---

For help, see [README.md](README.md) or [Cloudflare Docs](https://developers.cloudflare.com/workers/)
