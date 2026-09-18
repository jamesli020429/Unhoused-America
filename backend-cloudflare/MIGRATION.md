# Migration Guide: Local Backend → Cloudflare Workers

This guide explains the key differences between your local backend and the Cloudflare Workers version.

## 📁 File Structure Comparison

### Local Backend
```
backend/
├── server.js          # Express app & routes
├── database.js        # SQLite operations
├── gemini.js          # AI/ML functions
├── rag.js            # RAG logic
├── index.js          # Entry point
├── package.json
└── data/
    ├── environments-day.js
    └── environments-night.js
```

### Cloudflare Backend
```
backend-cloudflare/
├── wrangler.toml      # Cloudflare config
├── schema.sql         # D1 database schema
├── package.json
└── src/
    ├── index.js       # Workers entry + routes
    ├── database.js    # D1 operations
    ├── gemini.js      # AI/ML (adapted)
    ├── rag.js        # RAG logic (adapted)
    └── data/
        ├── environments-day.js
        └── environments-night.js
```

## 🔄 Key Technical Changes

### 1. Request Handling

**Local (Express):**
```javascript
app.post('/api/personas', async (req, res) => {
  const { city, demographics } = req.body;
  // ...
  res.json({ id });
});
```

**Cloudflare (Workers):**
```javascript
export default {
  async fetch(request, env, ctx) {
    const body = await request.json();
    const { city, demographics } = body;
    // ...
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 2. Database Operations

**Local (SQLite):**
```javascript
export function createPersona({ city, demographics, name, age, narrative, imageUrl }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO personas (city, demographics_json, name, age, narrative, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(city, JSON.stringify(demographics), name, age, narrative, imageUrl, 
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
    stmt.finalize();
  });
}
```

**Cloudflare (D1):**
```javascript
export async function createPersona({ city, demographics, name, age, narrative, imageUrl }, env) {
  const stmt = env.DB.prepare(`
    INSERT INTO personas (city, demographics_json, name, age, narrative, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = await stmt
    .bind(city, JSON.stringify(demographics), name, age, narrative, imageUrl)
    .run();
  
  return result.meta.last_row_id;
}
```

**Key Differences:**
- D1 uses async/await (no callbacks)
- Must pass `env` parameter for database binding
- Results accessed via `.meta` property

### 3. Environment Variables

**Local:**
```javascript
import 'dotenv/config';
const API_KEY = process.env.GEMINI_API_KEY;
```

**Cloudflare:**
```javascript
// Set via: wrangler secret put GEMINI_API_KEY
const API_KEY = env.GEMINI_API_KEY;  // from Workers environment
```

### 4. Function Signatures

Most functions now need the `env` parameter:

**Before:**
```javascript
export async function generateNarrative({ city, demographics }) {
  const chunks = await getCityChunks(city);
  // ...
}
```

**After:**
```javascript
export async function generateNarrative({ city, demographics }, env) {
  const chunks = await getCityChunks(city, env);
  // ...
}
```

## 🚫 What Doesn't Work in Workers

### No File System Access
Workers can't read/write files like Node.js can.

**Impact:**
- Can't use `fs.readFile()` or similar
- City data files must be imported as modules
- Can't write logs to disk

**Solutions:**
- Import data files as ES modules
- Use D1 database for persistent data
- Use `console.log()` (available via `wrangler tail`)

### No `__dirname` or `__filename`
Workers don't have file paths.

**Impact:**
- Can't use `path.join(__dirname, 'file.txt')`

**Solutions:**
- Import modules directly
- Store data in D1 or KV

### Limited npm Packages
Not all Node.js packages work in Workers.

**Compatible:**
- ✅ `axios` (HTTP requests)
- ✅ Most pure JavaScript packages

**Incompatible:**
- ❌ Native modules (C++ bindings)
- ❌ Packages requiring `fs`, `path`, etc.
- ❌ `sqlite3` (use D1 instead)

## 💾 Data Migration

### Personas Table
```bash
# Export from local
sqlite3 backend/personas.db \
  ".mode insert personas" \
  ".output personas.sql" \
  "SELECT * FROM personas;"

# Import to D1
wrangler d1 execute unhoused-personas --file=personas.sql
```

### City Chunks Table
```bash
# Export from local
sqlite3 backend/personas.db \
  ".mode insert city_chunks" \
  ".output city_chunks.sql" \
  "SELECT * FROM city_chunks;"

# Import to D1
wrangler d1 execute unhoused-personas --file=city_chunks.sql
```

## 🧪 Testing Strategy

### 1. Test Locally First
```bash
cd backend-cloudflare
npm run dev
```

### 2. Verify Each Endpoint
```bash
# Health check
curl http://localhost:8787/health

# Create persona (requires city data ingestion)
curl -X POST http://localhost:8787/api/personas \
  -H "Content-Type: application/json" \
  -d '{"city":"NYC","demographics":{...}}'

# List personas
curl http://localhost:8787/api/personas
```

### 3. Deploy to Production
```bash
npm run deploy
```

### 4. Monitor Logs
```bash
wrangler tail
```

## 🔒 Security Considerations

### Secrets Management

**Local:** `.env` file (git-ignored)
```env
GEMINI_API_KEY=abc123
CLOUDFLARE_ACCOUNT_ID=xyz789
```

**Cloudflare:** Wrangler secrets (encrypted)
```bash
wrangler secret put GEMINI_API_KEY
# Never visible in code or git
```

### CORS Configuration

**Local:**
```javascript
app.use(cors());  // Allows all origins
```

**Cloudflare:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Update for production
  // ...
};
```

**Production Recommendation:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

## 📊 Performance Differences

| Metric | Local Backend | Cloudflare Workers |
|--------|--------------|-------------------|
| **Cold Start** | N/A (always running) | ~5-50ms |
| **Latency** | Depends on server location | <100ms globally |
| **Concurrency** | Limited by server resources | Virtually unlimited |
| **Scaling** | Manual | Automatic |
| **Cost** | Server/hosting fees | Pay per request (free tier: 100k/day) |

## 🐛 Common Migration Issues

### Issue: "No chunks found for city"
**Cause:** City data not ingested into D1.  
**Fix:** Run ingestion script and import to D1 (see Data Migration above).

### Issue: "env is not defined"
**Cause:** Forgot to pass `env` parameter.  
**Fix:** Update function signature to accept `env` and pass it to nested calls.

### Issue: "Database binding not found"
**Cause:** `wrangler.toml` missing or incorrect database binding.  
**Fix:** Ensure `[[d1_databases]]` section is properly configured with correct `database_id`.

### Issue: Image data too large
**Cause:** D1 has a 1 MB limit per query; base64 images can be large.  
**Fix:** Consider using Cloudflare R2 (object storage) for images instead of storing in database.

## 🎯 Deployment Workflow

### Development Cycle
1. Make changes in `src/`
2. Test locally: `npm run dev`
3. Check logs: `wrangler tail` (in another terminal)
4. Deploy: `npm run deploy`
5. Verify production: `curl https://your-worker.workers.dev/health`

### Rolling Back
```bash
# View deployments
wrangler deployments list

# Rollback to previous
wrangler rollback
```

## 📝 Checklist: Am I Ready to Deploy?

- [ ] Installed Wrangler CLI
- [ ] Logged into Cloudflare account
- [ ] Created D1 database
- [ ] Updated `wrangler.toml` with database ID
- [ ] Initialized database schema
- [ ] Set all required secrets (GEMINI_API_KEY, etc.)
- [ ] Ingested city data into D1
- [ ] Tested locally (`npm run dev`)
- [ ] Verified all endpoints work
- [ ] Updated CORS for production (if needed)
- [ ] Updated frontend API URL

## 🎓 Learning Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Examples](https://developers.cloudflare.com/workers/examples/)

---

**Remember:** Your local backend remains fully functional. You can run both versions simultaneously during migration and testing!
