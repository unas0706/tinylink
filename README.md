# TinyLink — URL Shortener (Node + Express)

A small URL shortener (like bit.ly) built with Node.js and Express, EJS server-rendered pages and a small REST API.

This repository implements the assignment requirements:

- Create short links (optionally with a custom short code)
- Redirect `/code` to the original URL (HTTP 302)
- Increment click counts and update `lastClicked`
- Delete links (stops redirecting)
- Dashboard at `/` and stats page `/code/:code`
- Healthcheck at `/healthz`
- API endpoints under `/api/links`

---

## Features

- POST `/api/links` — create link (409 if code exists)
- GET `/api/links` — list all links
- GET `/api/links/:code` — get a single link's data
- DELETE `/api/links/:code` — delete a link
- SSR Dashboard: `/` (create, list, delete via UI)
- Stats page: `/code/:code`
- Redirect: `/:code` (302)
- Health: `GET /healthz` → `{ ok: true, version: '1.0', uptimeSeconds }`

The app validates custom codes to match the rule: `[A-Za-z0-9]{6,8}`. The server now validates `longUrl` format (must be a valid `http://` or `https://` URL).

---

## Quick start (local)

1. Clone the repo

```bash
git clone <your-repo-url>
cd TinyLink
```

2. Install dependencies

```bash
npm install
```

3. Copy and edit `.env`

```bash
cp .env.example .env
# then edit .env and set MONGO_URI and BASE_URL
```

4. Start the server

```bash
# production mode
node server.js

# or dev with nodemon (devDependency included)
npm run dev
```

Open http://localhost:5000

---

## API examples (PowerShell / curl)

- Create (JSON):

```powershell
curl -Method POST -Uri http://localhost:5000/api/links -Headers @{ 'Content-Type' = 'application/json' } -Body '{"longUrl":"https://example.com","customCode":"Abc123"}'
```

- List:

```powershell
curl -Method GET -Uri http://localhost:5000/api/links
```

- Get one:

```powershell
curl -Method GET -Uri http://localhost:5000/api/links/Abc123
```

- Delete:

```powershell
curl -Method DELETE -Uri http://localhost:5000/api/links/Abc123
```

- Health:

```powershell
curl -Method GET -Uri http://localhost:5000/healthz
```

## Request & Response examples

Below are example request bodies and responses for the core API endpoints. Field names and paths follow the autograder spec.

1. Create link

- Method: POST
- Path: `/api/links`
- Request body (JSON):

```json
{
  "longUrl": "https://example.com/path",
  "customCode": "Abc123" // optional, must match [A-Za-z0-9]{6,8}
}
```

- Success response (201):

```json
{
  "shortId": "Abc123",
  "originalUrl": "https://example.com/path",
  "shortUrl": "http://your-base-url/Abc123"
}
```

- Error responses:
  - 400 Bad Request (missing or invalid URL):

```json
{ "error": "longUrl is required" }
```

or

```json
{ "error": "Invalid URL format" }
```

- 400 Bad Request (invalid custom code):

```json
{ "error": "Custom code must match [A-Za-z0-9]{6,8}" }
```

- 409 Conflict (code already exists):

```json
{ "error": "Code already exists" }
```

2. List links

- Method: GET
- Path: `/api/links`
- Success response (200):

```json
[
  {
    "_id": "...",
    "longUrl": "https://example.com/path",
    "shortId": "Abc123",
    "clicks": 5,
    "lastClicked": "2025-11-22T16:00:00.000Z",
    "createdAt": "2025-11-20T12:00:00.000Z",
    "updatedAt": "2025-11-22T16:00:00.000Z",
    "__v": 0
  }
]
```

3. Get link (stats)

- Method: GET
- Path: `/api/links/:code`
- Success response (200):

```json
{
  "_id": "...",
  "longUrl": "https://example.com/path",
  "shortId": "Abc123",
  "clicks": 5,
  "lastClicked": "2025-11-22T16:00:00.000Z",
  "createdAt": "2025-11-20T12:00:00.000Z",
  "updatedAt": "2025-11-22T16:00:00.000Z",
  "__v": 0
}
```

- Not found (404):

```json
{ "error": "Link not found" }
```

4. Delete link

- Method: DELETE
- Path: `/api/links/:code`
- Success response (200):

```json
{ "message": "Link deleted" }
```

- Not found (404):

```json
{ "error": "Link not found" }
```

5. Redirect (public)

- Method: GET
- Path: `/:code` (public redirect)
- Behavior: responds with HTTP 302 and `Location` header pointing to the original URL if the code exists. If not found, returns 404.

Example (response headers):

```
HTTP/1.1 302 Found
Location: https://example.com/path
```

6. Health

- Method: GET
- Path: `/healthz`
- Success response (200):

```json
{ "ok": true, "version": "1.0", "uptimeSeconds": 123 }
```

Notes:

- Codes must follow the regex `[A-Za-z0-9]{6,8}`. The API will return 400 for invalid custom codes and 409 for duplicates.
- `longUrl` is validated server-side and must include a scheme (`http://` or `https://`).
- Field names and endpoints are kept stable for automated grading.

---

## UI

- Dashboard `/`: create short links (optional custom code), list links with copy/delete/view actions.
- Stats `/code/:code`: shows details for a single short link.

The UI is responsive and converts the table into stacked cards on small screens.

---

## Deployment notes (examples)

### Render (recommended for Express)

1. Create a new "Web Service" in Render.
2. Link your GitHub repo and choose the branch.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables in the Render dashboard:
   - `MONGO_URI` (your MongoDB connection string)
   - `BASE_URL` (your Render URL, e.g., `https://your-app.onrender.com`)
   - `PORT` (optional)

Render will run the server and your app will be live.

### Railway

- Similar flow: create a new project, connect repo, set the start command to `node server.js`, and set environment variables. Railway has a PostgreSQL option, but this project uses MongoDB — use Atlas or another hosted Mongo.

### Vercel

- Vercel is more suited for frontend/Next.js. You can deploy an Express server on Vercel using serverless functions, but I'd recommend Render or Railway for the straightforward Node server.

---

## Automated testing suggestions

- You can add `jest` + `supertest` to assert endpoints:
  - `/healthz` returns 200
  - POST `/api/links` creates link and returns 201
  - Duplicate POST returns 409
  - GET `/:code` redirects (302) and increments clicks
  - DELETE `/api/links/:code` removes link and `/:code` returns 404

If you want, I can add a test suite (I can create `test/` with Jest & Supertest and an npm script `test`).

---

## What I changed in the repo (high level)

- Added API controller: `controllers/apiLinksController.js`
- Added API routes: `routes/apiLinks.js`
- Implemented SSR views: `views/index.ejs`, `views/stats.ejs`
- Added client JS: `public/js/script.js`
- Added modern responsive CSS: `public/style.css`
- `models/Url.js` includes fields: `longUrl`, `shortId`, `clicks`, `lastClicked`
- `routes/urlRoutes.js` includes dashboard, stats route and redirect
- Health route: `routes/health.js`
- Server wiring: `server.js`

---

## Submission checklist

- Public URL: (provide your deployed URL here)
- GitHub URL: (provide repo URL)
- Video walkthrough: (upload a short screen recording and add link)
- ChatGPT / LLM transcript: (include link or file)

---

If you'd like, I can:

- Add automated tests (`supertest` + `jest`) and `npm test` command.
- Add a small CI workflow (`.github/workflows/nodejs.yml`) that runs tests.
- Prepare a `Procfile` and Render-specific notes or a Dockerfile.

Tell me which of the above you'd like me to add next.
