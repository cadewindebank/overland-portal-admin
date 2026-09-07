# Security

## Read this first

**This repository is a front end.** Everything it does to protect data is a
*user-experience guard*, not a security boundary. A determined user can open dev
tools and change client state at will.

The portal is safe to run in production **only behind a server that re-checks
every capability on every request.** Until that server exists, treat a deployment
as a demo, not as a system of record.

## What the client does

| Control | Where | What it actually gives you |
| --- | --- | --- |
| Session loading | `assets/js/auth.js` | Fetches `/api/session`, or a mock user when `SESSION_ENDPOINT` is null. Boot halts and redirects to `/login` if there is no session. |
| Capability checks | `assets/js/policy.js`, `auth.js` | `can()` / `require()` over one capability table. |
| Route guarding | `assets/js/app.js` | Every route declares a capability in `ROUTE_CAPABILITY`. A denied route renders a 403 and writes `route.denied` to the audit log. |
| Nav filtering | `app.js` `renderRail` | Users are not shown areas they cannot open. |
| Approval limits | `policy.js` `APPROVAL_LIMIT` | Per-role ceiling on a single approval. |
| Dual authorisation | `policy.js` `DUAL_AUTH_THRESHOLD` | Amounts ≥ $10,000 need two different approvers. |
| Audit journal | `store.js`, `auth.js` | Every write is logged with actor, action, target and changed fields. |
| Output encoding | `ui.js` `esc()` | HTML-escapes `& < > " '` at every interpolation of record data. |
| CSV hardening | `ui.js` `csvCell()` | Prefixes `= + - @` so exports cannot execute in a spreadsheet. |
| Transport & headers | `_headers`, `index.html` | CSP, HSTS, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy. |
| Indexing | `robots.txt` | Disallow all — this is an internal tool. |

## What the server must do

None of the following can be done in the browser. All of it is required.

1. **Authenticate.** Issue a session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`.
   Never put a token in `localStorage`.
2. **Re-check every capability on every request.** Mirror `policy.js`. The client
   copy exists only so people are not shown doors they cannot open.
3. **Enforce approval limits and dual authorisation server-side**, including that
   the second approver is a *different* user from the first.
4. **Write the audit log server-side**, append-only, from the authenticated
   identity — never from a value the client supplies.
5. **Rate-limit** authentication and approval endpoints.
6. **Validate and authorise every field** in a write. The client sends shapes it
   believes are valid; assume none of it.
7. **Serve the headers in `_headers`** as real headers. `frame-ancestors` and
   `base-uri` are ignored in a `<meta>` tag.
8. **Scope data by role and region.** A Base Director should not be able to fetch
   another region's records even if the UI never offers it.

## Data protection

- The seeded dataset in `data.js` is entirely fictional, on the RFC 2606 reserved
  `example.org` domain. No real names, addresses, phone numbers or account
  identifiers are in this repository.
- Local changes are mirrored to `localStorage` so a demo survives a reload. That
  store is unencrypted and per-browser. **Do not point this build at real data
  while that is true** — see `store.js` `persist()`.
- Passport numbers, insurance records and giving history are sensitive. When the
  API arrives, gate them behind `people.compliance` and `giving.view`
  respectively, and log every read, not merely every write.

## Known gaps

| Gap | Impact | Fix |
| --- | --- | --- |
| No server | The entire model above is unenforced | Build the API |
| `localStorage` persistence | Records readable by anything running on the origin | Remove before real data |
| No CSRF tokens | N/A while there are no writes to a server | Add with the API |
| Primary button contrast 2.74:1 | Below WCAG AA | See `docs/DECISIONS.md` |

## Reporting

Send security issues to the address in `settings` → Organisation → Support email.
Do not open a public issue.
