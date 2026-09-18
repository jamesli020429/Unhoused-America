# Unhoused America - Cloudflare Workers Backend

This is a Cloudflare Workers adaptation of the Express.js backend, designed to run on Cloudflare's edge network with D1 (serverless SQL database).

## 🎯 Key Differences from Local Backend

| Feature | Local Backend | Cloudflare Workers |
|---------|--------------|-------------------|
| **Runtime** | Node.js + Express | Cloudflare Workers (V8 isolates) |
| **Database** | SQLite (file-based) | D1 (serverless SQL) |
| **Deployment** | Local server | Global edge network |
| **Scaling** | Manual | Automatic |
| **File System** | Direct access | No file system (data in code) |

## 📋 Prerequisites

1. **Cloudflare Account** (free tier works)
   - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
   
2. **Wrangler CLI** (Cloudflare's deployment tool)
   ```bash
   npm install -g wrangler
   ```

3. **API Keys** (same as local backend):
   - Google Gemini API Key
   - Cloudflare Account ID
   - Cloudflare API Token (for AI models)

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend-cloudflare
npm install
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### Step 3: Create D1 Database

```bash
npm run d1:create
```

This will output a `database_id`. **Copy this ID** and paste it into [wrangler.toml](wrangler.toml) under the `database_id` field:

```toml
[[d1_databases]]
binding = "DB"
database_name = "unhoused-personas"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### Step 4: Initialize Database Schema

```bash
npm run d1:init
```

This creates the necessary tables in your D1 database.

### Step 5: Set Environment Secrets

Set your API keys as secrets (they won't be visible in code):

```bash
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted

wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Paste your Cloudflare Account ID

wrangler secret put CLOUDFLARE_API_TOKEN
# Paste your Cloudflare API token
```

**To find these values:**
- **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **CLOUDFLARE_ACCOUNT_ID**: Dashboard → Workers & Pages → Overview (right sidebar)
- **CLOUDFLARE_API_TOKEN**: Dashboard → My Profile → API Tokens → Create Token (use "Edit Cloudflare Workers" template)

### Step 6: Ingest City Data (Important!)

Before deploying, you need to populate the database with city data chunks. You have two options:

#### Option A: Run Local Ingestion Script (Recommended)
Use your existing local backend ingestion script to populate city data, then export and import into D1:

```bash
# In the backend folder (your original local backend)
cd ../backend
npm run injest:cities

# Export the city_chunks data
sqlite3 personas.db ".mode insert city_chunks" ".output city_chunks.sql" "SELECT * FROM city_chunks;"

# Import into D1
cd ../backend-cloudflare
wrangler d1 execute unhoused-personas --file=../backend/city_chunks.sql
```

#### Option B: Create a Workers Ingestion Script
Create a separate worker script that reads city files and populates D1. This is more complex but keeps everything in the cloud.

### Step 7: Test Locally

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`. Test the endpoints:

```bash
# Health check
curl http://localhost:8787/health

# List personas
curl http://localhost:8787/api/personas
```

### Step 8: Deploy to Production

```bash
npm run deploy
```

Your worker will be deployed to `https://unhoused-america-backend.<your-subdomain>.workers.dev`

## 📡 API Endpoints

All endpoints are the same as the local backend:

### `POST /api/personas`
Create a new persona.

**Request:**
```json
{
  "city": "NYC",
  "demographics": {
    "genderExpression": "masculine",
    "genderIdentity": "man",
    "raceEthnicity": "Black",
    "sexualOrientation": "straight",
    "relationshipStatus": "single",
    "parentStatus": "not a parent",
    "ageRange": "25-34",
    "disabilityStatus": "no disabilities",
    "education": "high school"
  }
}
```

**Response:**
```json
{
  "id": 123
}
```

### `GET /api/personas`
List recent personas (limit 50).

### `GET /api/personas/:id`
Get a specific persona by ID.

### `GET /health`
Health check endpoint.

## 🔧 Development Workflow

### Local Development
```bash
npm run dev
```

Changes are hot-reloaded. Use the local D1 database:
```bash
npm run d1:init-local  # Initialize local D1 for testing
```

### View Logs
```bash
wrangler tail
```

Shows real-time logs from your production worker.

### Query D1 Database
```bash
# Production
wrangler d1 execute unhoused-personas --command="SELECT COUNT(*) FROM personas"

# Local
wrangler d1 execute unhoused-personas --local --command="SELECT * FROM personas LIMIT 10"
```

## 🌍 Updating Your Frontend

Update your React app's API endpoint to point to your Cloudflare Worker:

**In `unhoused-america/src/` files:**

```javascript
// Before (local)
const API_URL = 'http://localhost:8787';

// After (production)
const API_URL = 'https://unhoused-america-backend.<your-subdomain>.workers.dev';
```

Or use environment variables:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';
```

## 📊 Monitoring & Analytics

### View Worker Analytics
- Dashboard → Workers & Pages → Your Worker → Metrics
- See requests, errors, CPU time, and more

### D1 Database Metrics
- Dashboard → D1 → unhoused-personas
- See query count, storage usage, etc.

## 💰 Pricing (as of 2024)

### Free Tier Includes:
- **Workers**: 100,000 requests/day
- **D1**: 5 GB storage, 5 million rows read/day
- **AI Models**: 10,000 neurons/day

This is generous for development and small-scale use. See [Cloudflare Pricing](https://www.cloudflare.com/plans/developer-platform/) for details.

## 🔒 Security Notes

1. **Secrets**: Never commit API keys. Always use `wrangler secret put`.
2. **CORS**: Currently allows all origins (`*`). For production, update [src/index.js](src/index.js):
   ```javascript
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://yourdomain.com',
     // ...
   };
   ```
3. **Rate Limiting**: Consider adding rate limiting for production use.

## 🐛 Troubleshooting

### "No chunks found for city"
You need to run the city data ingestion. See Step 6 above.

### "database_id not found"
Make sure you've updated `wrangler.toml` with your D1 database ID from Step 3.

### "GEMINI_API_KEY missing"
Set secrets using `wrangler secret put` (Step 5).

### Image generation fails
Check that both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are set correctly.

### 413 Payload Too Large
D1 has a 1 MB limit per request. If narratives or images are too large, consider storing images in R2 (Cloudflare's object storage) instead of base64 in the database.

## 🔄 Migrating Data from Local Backend

To migrate existing personas from SQLite to D1:

```bash
# Export from SQLite
sqlite3 ../backend/personas.db ".mode insert personas" ".output personas.sql" "SELECT * FROM personas;"

# Import to D1
wrangler d1 execute unhoused-personas --file=personas.sql
```

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare AI Docs](https://developers.cloudflare.com/workers-ai/)

## 🤝 Support

For issues specific to:
- **Local backend**: Check the main backend README
- **Cloudflare deployment**: Check [Cloudflare Community](https://community.cloudflare.com/)
- **This adaptation**: Open an issue in the repository

---

**Note**: Your local backend in the `backend/` folder remains completely unchanged and functional. You can run both versions side by side during development and testing.
