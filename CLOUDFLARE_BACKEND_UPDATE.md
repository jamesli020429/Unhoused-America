# Updating the Cloudflare backend

Use this workflow whenever you change the backend that powers the app on Cloudflare.

## What to edit

Make code changes in [backend-cloudflare/src](backend-cloudflare/src). That folder contains the Worker entry point, D1 database helpers, and the Cloudflare-safe RAG and Gemini code.

## Local verification

From the `backend-cloudflare` folder:

```bash
npm install
npm run dev
```

This starts the Worker locally at `http://localhost:8787`. Use it to check `/health` and `/api/personas` before deploying.

If you changed the schema, reapply it before testing:

```bash
npm run d1:init-local
```

If you changed secrets or added a new secret, update Cloudflare with:

```bash
wrangler secret put GEMINI_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_API_TOKEN
```

## Deploy to Cloudflare

When the local check passes, deploy the Worker:

```bash
npm run deploy
```

Wrangler prints the live `workers.dev` URL after deployment. That is the endpoint the frontend should use.

## Point the frontend at Cloudflare

The frontend reads the API URL from `REACT_APP_API_URL`, with a fallback to `http://localhost:8787`.

Set your frontend environment file to the deployed Worker URL, for example:

```bash
REACT_APP_API_URL=https://unhoused-america-backend.your-subdomain.workers.dev
```

Restart the React dev server after changing the environment file.

## Quick checklist

1. Edit backend code.
2. Test with `npm run dev`.
3. Re-run schema setup if needed.
4. Deploy with `npm run deploy`.
5. Update `REACT_APP_API_URL` if the frontend should use the new Worker URL.

## Updating any of the information used for training Embodicons
[backend-cloudflare/QUICKSTART.md](backend-cloudflare/QUICKSTART.md)