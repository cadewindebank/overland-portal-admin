# Overland Missions — Admin Portal

The back-office counterpart to [portal.overlandmissions.com](https://portal.overlandmissions.com), built
in the Overland Missions design language: the same palette, type and component vocabulary as the
public site and the member-facing portal.

Where the member portal is where staff, expedition members and donors *submit* things, this is where
the office *decides* on them — approvals, rosters, balances, access and the audit trail behind it all.

---

## Running it

No build step, no dependencies. It is plain ES modules, so it needs to be served over HTTP
(browsers block module imports on `file://`):

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Any static server works — `npx serve`, Caddy, nginx,
GitHub Pages, Netlify, S3.

---

## What's in it

Twenty screens across five areas:

| Area | Screens |
| --- | --- |
| **Overview** | Operations dashboard — decision queue, giving trend, expeditions in motion, what needs attention |
| **People** | People index with advanced search · person detail (overview, giving, expeditions, requests, access) · staff directory · roles & permission matrix |
| **Expeditions** | Expedition index · expedition detail (roster grid, readiness, finances, applications, resources, milestones) · application review queue |
| **Giving & Finance** | Donations ledger · donation page moderation · support accounts & balances · FY budgets |
| **Workflow** | Request queue across all nine form types · request detail with funding check and approval flow · tasks · alerts & comms · media library |
| **System** | Audit log · security & device sessions · settings |

Every table is a full DataTable — global search, per-column filters, sortable headers, page-length
menu, pagination, CSV export and print — matching the behaviour of the tables already in the live
portal.

---

## Design system

Colour and type tokens are taken from the live Overland Missions stylesheet, not eyeballed:

```
Core        Shadow #0f0e0d   Flare #ec4300   Bone #ddd7ce   Sand #baa283   Slate #393d36
Support     Bark #865c42     Clay #bd947c    Deep Sea #1e2434
            Emerald Pine #005744   Lagoon #638791   Sprout #859671
Sub-brand   Rain #324360     Sap #b4894c     Vine #354c21
```

- **IBM Plex Sans Condensed SemiBold** — the wordmark, page titles, eyebrows
- **Work Sans** — body, tables, forms
- **Teko** — large numerals in stat tiles

The primary button reproduces the public site's `.button` rule exactly: Flare fill, Bone text,
uppercase, 11px / 600 / 1.12px tracking, square corners, 14px × 16px padding.

Everything lives in `assets/css/overland.css` as custom properties — retheming is a token edit.

---

## Structure

```
index.html
assets/
  css/overland.css        design system — tokens, components, responsive rules
  js/
    app.js                shell, sidebar, app-grid launcher, hash router
    ui.js                 DataTable, modal, toast, stat tile, badges, formatters
    data.js               seeded mock dataset + accessor functions
    icons.js              inline SVG icon set
    views/*.js            one module per screen
```

## Wiring it to a real backend

`assets/js/data.js` is the only module that knows where data comes from. It ends with a block of
accessor functions — `findUser`, `pendingRequests`, `userDonations`, and so on. Replace those with
`fetch` calls (and make the views `await` them) and nothing else has to change; the views never
touch the raw arrays except through those accessors.

The dataset is seeded, so it renders identically on every load — useful for screenshots and demos.

---

## Notes

- Mock data only. Names, balances, passport numbers and donations are generated — nothing here is
  real personal or financial data.
- Light theme only, matching the live portal.
- Tested in Safari, Chrome and Firefox.
