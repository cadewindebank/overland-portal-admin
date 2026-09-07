# Overland Missions — Admin Portal

The back-office counterpart to [portal.overlandmissions.com](https://portal.overlandmissions.com), built
in the Overland Missions design language and structured around the platform mind map.

Where the member portal is where staff, expedition members and donors *submit* things, this is where
the office *decides* on them — approvals, rosters, balances, relationships, money and access.

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

## Structure — from the mind map

The navigation mirrors the Overland Missions platform mind map. The mind map covers the whole
platform (Donor, Trips, Expeditions, AMT, Staff, MPD, Leaders, Admin, CRM); this repo builds out the
back-office half of it — **CRM, MPD, Admin, Finance and General Admin** — plus the management side
of Expeditions, AMT, Staff and Leaders.

| Area | Screens |
| --- | --- |
| **Overview** | Operations dashboard — decision queue, giving trend, expeditions in motion, what needs attention |
| **CRM** | Contacts across the six buckets (Recruiting, MPD, Church Network, Personal, Ministry, Staff) · contact profile with activity log, giving history, demographics, reminders, tags and relationships · Fundraising (goals, past giving, lapsed donors, plan MPD, page stats, map view, lead scoring) · Recruiting (sign-up sheets, past team members, assigned contacts) · Marketing (campaigns, automations, journeys, blogs, surveys, metrics) |
| **People** | People index with advanced search · person detail (overview, giving, expeditions, requests, access) · staff directory · MPD (funds requests, MPDers, coaches, audit, reports) · roles & permission matrix |
| **Expeditions** | Expeditions index and detail (roster grid, readiness, finances, applications, resources, milestones) · AMT cohorts (students, trips, costs, travel booking) · applicant review queue |
| **Finance** | Finance console — Authorize (all), Payroll, MPL and reconciliation, interbank & audit transfers, reimbursements, weekly/EOY receipts, Easy Scan, QuickBooks customers, reports · donations ledger · donation-page moderation · support accounts & balances · FY budgets |
| **Workflow** | Request queue across all nine form types · request detail with funding check and approval flow · tasks · alerts & comms · media library |
| **Admin** | General Admin (countries, regions, groups, expedition insurance, stock photos, create user) · audit log · security & device sessions · settings |

Every table is a full DataTable — global search, per-column filters, sortable headers, page-length
menu, pagination, CSV export and print — matching the behaviour of the tables already in the live
portal.

---

## Design system

Colour and type tokens are taken from source, not eyeballed — they match both the live
overlandmissions.com stylesheet and the Figma variables on the website file:

```
Core        Shadow #0f0e0d   Flare #ec4300   Bone #ddd7ce   Sand #baa283   Slate #393d36
Support     Bark #865c42     Clay #bd947c    Deep Sea #1e2434
            Emerald Pine #005744   Lagoon #638791   Sprout #859671
Sub-brand   Rain #324360     Sap #b4894c     Vine #354c21
```

- **IBM Plex Sans Condensed SemiBold** — page titles, eyebrows, rail headings
- **Work Sans** — body, tables, forms
- **Teko** — large numerals in stat tiles

The primary button reproduces the public site's `.button` rule exactly: Flare fill, Bone text,
uppercase, 11px / 600 / 1.12px tracking, square corners, 14px × 16px padding.

Logos in `assets/img/` are the official parent-brand files from the OM Brand Assets logo system
(`02_Logo System/01_PARENT BRAND`) — the horizontal lockup in black and white, and the logo mark
used as the favicon.

Everything else lives in `assets/css/overland.css` as custom properties — retheming is a token edit.

---

## Files

```
index.html
assets/
  css/overland.css        design system — tokens, components, responsive rules
  img/                    official Overland logo files
  js/
    app.js                shell, sidebar, app-grid launcher, hash router
    ui.js                 DataTable, modal, toast, stat tile, badges, formatters
    data.js               seeded mock dataset + accessor functions
    icons.js              inline SVG icon set
    views/*.js            one module per screen
```

## Wiring it to a real backend

`assets/js/data.js` is the only module that knows where data comes from. It ends with a block of
accessor functions — `findUser`, `findContact`, `pendingRequests`, `pendingFunds`, `lapsedDonors`,
`userDonations` and so on. Replace those with `fetch` calls (and make the views `await` them) and
nothing else has to change; the views reach data through those accessors.

The dataset is seeded, so it renders identically on every load — useful for screenshots and demos.

---

## Notes

- Mock data only. Names, balances, passport numbers, donations and contact records are generated —
  nothing here is real personal or financial data.
- Light theme only, matching the live portal.
- Tested in Safari, Chrome and Firefox.
