# Deployment

Static files. No build step.

```bash
python3 -m http.server 8080     # local
```

## Security headers

`_headers` is read verbatim by Netlify and Cloudflare Pages. Everywhere else,
translate it.

**nginx**

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location = /index.html { add_header Cache-Control "no-cache"; }
```

**Vercel** — `vercel.json`

```json
{ "headers": [{ "source": "/(.*)", "headers": [
  { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'" },
  { "key": "X-Content-Type-Options", "value": "nosniff" },
  { "key": "X-Frame-Options", "value": "DENY" }
]}]}
```

`frame-ancestors` and `base-uri` only work as real headers — the `<meta>` copy in
`index.html` is a fallback for the rest of the policy.

## Before real data

1. Build the API and set `SESSION_ENDPOINT` in `assets/js/auth.js`.
2. Set `AUDIT_ENDPOINT` in the same file.
3. Remove `localStorage` persistence in `assets/js/store.js`.
4. Re-check every capability server-side. See `docs/SECURITY.md`.
