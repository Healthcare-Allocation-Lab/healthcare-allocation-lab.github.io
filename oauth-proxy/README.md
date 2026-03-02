# OAuth Proxy for Decap CMS

Cloudflare Worker that handles GitHub OAuth for Decap CMS on GitHub Pages.

## Why this exists

Decap CMS needs to exchange an OAuth authorization code for an access token. This exchange requires the GitHub OAuth client secret, which can't be exposed in browser code. This Worker acts as the intermediary.

## Setup

### 1. Create a GitHub OAuth App

1. Go to **GitHub org settings** > Developer Settings > OAuth Apps > New OAuth App
2. Fill in:
   - **Application name**: `Parker HCA Lab CMS`
   - **Homepage URL**: `https://healthcare-allocation-lab.github.io`
   - **Authorization callback URL**: `https://hca-cms-oauth.<your-subdomain>.workers.dev/callback`
3. Click **Register application**
4. Copy the **Client ID**
5. Click **Generate a new client secret** and copy it

### 2. Deploy the Worker

```bash
npm install -g wrangler    # install Cloudflare CLI (one-time)
wrangler login             # authenticate with Cloudflare

cd oauth-proxy
wrangler secret put GITHUB_CLIENT_ID      # paste the Client ID
wrangler secret put GITHUB_CLIENT_SECRET   # paste the Client Secret
wrangler deploy
```

Note the deployed URL (e.g., `https://hca-cms-oauth.<subdomain>.workers.dev`).

### 3. Update the callback URL

Go back to the GitHub OAuth App settings and update the **Authorization callback URL** to match the actual deployed worker URL:

```
https://hca-cms-oauth.<subdomain>.workers.dev/callback
```

### 4. Update admin/config.yml

Set `base_url` in `admin/config.yml` to your deployed worker URL:

```yaml
backend:
  name: github
  repo: Healthcare-Allocation-Lab/healthcare-allocation-lab.github.io
  branch: main
  base_url: https://hca-cms-oauth.<subdomain>.workers.dev
  auth_endpoint: /auth
```

### 5. Grant repo access

Each editor needs to be added as a collaborator on the `healthcare-allocation-lab.github.io` repo with write access.

## Verification

1. Visit `https://hca-cms-oauth.<subdomain>.workers.dev/auth` — should redirect to GitHub OAuth
2. After authorizing, the callback page should flash briefly and close
3. Visit `https://healthcare-allocation-lab.github.io/admin/` — "Login with GitHub" should complete the OAuth flow

## How it works

1. CMS opens a popup to `/auth`
2. Worker redirects to GitHub's OAuth authorize page
3. User approves, GitHub redirects to `/callback?code=...`
4. Worker exchanges the code for an access token (server-side, using the client secret)
5. Worker renders a small HTML page that sends the token back to the CMS via `postMessage` and closes the popup
