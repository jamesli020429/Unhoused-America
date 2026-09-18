# Deployment Checklist

Use this checklist to track your Cloudflare Workers setup progress.

## Pre-Deployment Setup

- [ ] Navigate to `backend-cloudflare` folder
- [ ] Run `npm install`
- [ ] Install Wrangler: `npm install -g wrangler`
- [ ] Login to Cloudflare: `wrangler login`

## Database Setup

- [ ] Create D1 database: `npm run d1:create`
- [ ] Copy `database_id` from output
- [ ] Paste `database_id` into `wrangler.toml`
- [ ] Initialize schema: `npm run d1:init`

## Secrets Configuration

- [ ] Set GEMINI_API_KEY: `wrangler secret put GEMINI_API_KEY`
- [ ] Set CLOUDFLARE_ACCOUNT_ID: `wrangler secret put CLOUDFLARE_ACCOUNT_ID`
- [ ] Set CLOUDFLARE_API_TOKEN: `wrangler secret put CLOUDFLARE_API_TOKEN`
- [ ] Verify secrets: `wrangler secret list`

## City Data Ingestion

Choose one method:

### Method A: Local Ingestion (Recommended)
- [ ] Go to `backend` folder
- [ ] Run `npm run injest:cities` (if not already done)
- [ ] Export: `sqlite3 personas.db ".mode insert city_chunks" ".output city_chunks.sql" "SELECT * FROM city_chunks;"`
- [ ] Go back to `backend-cloudflare`
- [ ] Import: `wrangler d1 execute unhoused-personas --file=../backend/city_chunks.sql`

### Method B: Create Workers Ingestion Script
- [ ] Create separate ingestion worker
- [ ] Deploy and run ingestion
- [ ] Verify chunks in D1

## Local Testing

- [ ] Start dev server: `npm run dev`
- [ ] Test health: `curl http://localhost:8787/health`
- [ ] Test list: `curl http://localhost:8787/api/personas`
- [ ] Test create: Create a test persona via POST
- [ ] Check logs: `wrangler tail` (in separate terminal)
- [ ] Verify responses are correct

## Production Deployment

- [ ] Deploy: `npm run deploy`
- [ ] Copy the deployed URL
- [ ] Test health: `curl https://YOUR-WORKER.workers.dev/health`
- [ ] Test endpoints on production
- [ ] Verify logs: `wrangler tail`

## Frontend Integration

- [ ] Update API URL in React app
- [ ] Test persona creation from UI
- [ ] Test persona listing from UI
- [ ] Test persona detail view from UI
- [ ] Verify images load correctly

## Production Configuration

- [ ] Update CORS in `src/index.js` (change `*` to your domain)
- [ ] Set up custom domain (optional): `wrangler domains add`
- [ ] Configure rate limiting (optional)
- [ ] Set up monitoring alerts in Cloudflare Dashboard

## Post-Deployment

- [ ] Monitor usage in Cloudflare Dashboard
- [ ] Check D1 database metrics
- [ ] Verify no errors in logs
- [ ] Test from different locations/devices
- [ ] Document your deployment URL

## Optional Enhancements

- [ ] Migrate existing personas from local database
- [ ] Set up staging environment
- [ ] Configure analytics
- [ ] Add API rate limiting
- [ ] Store images in R2 instead of D1 (if needed)
- [ ] Set up custom error pages

## 📝 Notes

**Deployment URL:** _______________________________________________

**Database ID:** _______________________________________________

**Custom Domain (if any):** _______________________________________________

**Deployment Date:** _______________________________________________

---

**Troubleshooting Resources:**
- README.md - Comprehensive guide
- MIGRATION.md - Technical details
- QUICKSTART.md - Fast setup
- Cloudflare Dashboard - Metrics & logs
- `wrangler tail` - Real-time logs

**Support:**
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
