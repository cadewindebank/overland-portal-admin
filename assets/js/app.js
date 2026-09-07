/* ==========================================================================
   Overland Missions — Admin Portal shell & router
   ========================================================================== */
import { icon } from './icons.js';
import { esc, initials, toast } from './ui.js';
import * as D from './data.js';

import dashboard      from './views/dashboard.js';
import people         from './views/people.js';
import person         from './views/person.js';
import staff          from './views/staff.js';
import roles          from './views/roles.js';
import expeditions    from './views/expeditions.js';
import expedition     from './views/expedition.js';
import applications   from './views/applications.js';
import donations      from './views/donations.js';
import donationPages  from './views/donationPages.js';
import accounts       from './views/accounts.js';
import budgets        from './views/budgets.js';
import requests       from './views/requests.js';
import request        from './views/request.js';
import tasks          from './views/tasks.js';
import alerts         from './views/alerts.js';
import media          from './views/media.js';
import audit          from './views/audit.js';
import security       from './views/security.js';
import settings       from './views/settings.js';
import crm            from './views/crm.js';
import contact        from './views/contact.js';
import fundraising    from './views/fundraising.js';
import recruiting     from './views/recruiting.js';
import marketing      from './views/marketing.js';
import mpd            from './views/mpd.js';
import finance        from './views/finance.js';
import generalAdmin   from './views/generalAdmin.js';
import amt            from './views/amt.js';

/* --- navigation model ----------------------------------------------------- */
export const NAV = [
  {
    heading: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#/' }]
  },
  {
    heading: 'CRM',
    items: [
      { id: 'crm',         label: 'Contacts',    icon: 'people',  href: '#/crm' },
      { id: 'fundraising', label: 'Fundraising', icon: 'give',    href: '#/fundraising' },
      { id: 'recruiting',  label: 'Recruiting',  icon: 'clipboard', href: '#/recruiting',
        count: () => D.signups.filter(x => !x.assigned).length },
      { id: 'marketing',   label: 'Marketing',   icon: 'bell',    href: '#/marketing' }
    ]
  },
  {
    heading: 'People',
    items: [
      { id: 'people', label: 'People',          icon: 'person', href: '#/people' },
      { id: 'staff',  label: 'Staff Directory', icon: 'staff',  href: '#/staff' },
      { id: 'mpd',    label: 'MPD',             icon: 'dollar', href: '#/mpd',
        count: () => D.pendingFunds().length },
      { id: 'roles',  label: 'Roles & Access',  icon: 'shield', href: '#/roles' }
    ]
  },
  {
    heading: 'Expeditions',
    items: [
      { id: 'expeditions',  label: 'Expeditions',  icon: 'compass',   href: '#/expeditions' },
      { id: 'amt',          label: 'AMT',          icon: 'book',      href: '#/amt' },
      { id: 'applications', label: 'Applicants',   icon: 'clipboard', href: '#/applications',
        count: () => D.openApplications().length }
    ]
  },
  {
    heading: 'Finance',
    items: [
      { id: 'finance',       label: 'Finance Console',  icon: 'bank',  href: '#/finance' },
      { id: 'donations',     label: 'Donations',        icon: 'give',  href: '#/donations' },
      { id: 'donationPages', label: 'Donation Pages',   icon: 'flag',  href: '#/donation-pages' },
      { id: 'accounts',      label: 'Accounts & Balances', icon: 'dollar', href: '#/accounts' },
      { id: 'budgets',       label: 'Budgets',          icon: 'chart', href: '#/budgets' }
    ]
  },
  {
    heading: 'Workflow',
    items: [
      { id: 'requests', label: 'Request Queue', icon: 'inbox', href: '#/requests',
        count: () => D.pendingRequests().length },
      { id: 'tasks',  label: 'Tasks',         icon: 'checkCircle', href: '#/tasks', count: () => D.openTasks().length },
      { id: 'alerts', label: 'Alerts & Comms', icon: 'bell',  href: '#/alerts' },
      { id: 'media',  label: 'Media Library',  icon: 'image', href: '#/media' }
    ]
  },
  {
    heading: 'Admin',
    items: [
      { id: 'generalAdmin', label: 'General Admin',     icon: 'grid',     href: '#/general-admin' },
      { id: 'audit',        label: 'Audit Log',         icon: 'history',  href: '#/audit' },
      { id: 'security',     label: 'Security & Devices', icon: 'device',  href: '#/security' },
      { id: 'settings',     label: 'Settings',          icon: 'settings', href: '#/settings' }
    ]
  }
];

/* --- routes --------------------------------------------------------------- */
const ROUTES = [
  [/^\/?$/,                     dashboard,     'dashboard'],
  [/^\/crm$/,                   crm,           'crm'],
  [/^\/crm\/([^/]+)$/,          contact,       'crm'],
  [/^\/fundraising$/,           fundraising,   'fundraising'],
  [/^\/recruiting$/,            recruiting,    'recruiting'],
  [/^\/marketing$/,             marketing,     'marketing'],
  [/^\/mpd$/,                   mpd,           'mpd'],
  [/^\/finance$/,               finance,       'finance'],
  [/^\/general-admin$/,         generalAdmin,  'generalAdmin'],
  [/^\/amt$/,                   amt,           'amt'],
  [/^\/people$/,                people,        'people'],
  [/^\/people\/([^/]+)$/,       person,        'people'],
  [/^\/staff$/,                 staff,         'staff'],
  [/^\/roles$/,                 roles,         'roles'],
  [/^\/expeditions$/,           expeditions,   'expeditions'],
  [/^\/expeditions\/([^/]+)$/,  expedition,    'expeditions'],
  [/^\/applications$/,          applications,  'applications'],
  [/^\/donations$/,             donations,     'donations'],
  [/^\/donation-pages$/,        donationPages, 'donationPages'],
  [/^\/accounts$/,              accounts,      'accounts'],
  [/^\/budgets$/,               budgets,       'budgets'],
  [/^\/requests$/,              requests,      'requests'],
  [/^\/requests\/([^/]+)$/,     request,       'requests'],
  [/^\/tasks$/,                 tasks,         'tasks'],
  [/^\/alerts$/,                alerts,        'alerts'],
  [/^\/media$/,                 media,         'media'],
  [/^\/audit$/,                 audit,         'audit'],
  [/^\/security$/,              security,      'security'],
  [/^\/settings$/,              settings,      'settings']
];

/* --- launcher (mirrors the live portal's app-grid menu) ------------------- */
const LAUNCHER = [
  { label: null, items: [
    { label: 'Alerts', icon: 'bell', href: '#/alerts', badge: () => D.alerts.filter(a => a.status === 'Scheduled').length, badgeGo: true },
    { label: 'Tasks', icon: 'checkCircle', href: '#/tasks', badge: () => D.openTasks().filter(t => t.overdue).length },
    { label: 'Profile', icon: 'person', href: '#/people/' + D.me.id },
    { label: 'Dashboard', icon: 'dashboard', href: '#/' },
    { label: 'Give', icon: 'give', href: '#/donations' },
    { label: 'Apply', icon: 'clipboard', href: '#/applications' },
    { label: 'Workspace', icon: 'grid', href: '#/settings' }
  ]},
  { label: 'Form Links', items: D.REQUEST_TYPES.map(t => ({
    label: t.label, icon: t.icon, href: '#/requests?type=' + t.key
  }))},
  { label: 'CRM', items: [
    { label: 'Contacts', icon: 'people', href: '#/crm' },
    { label: 'Fundraising', icon: 'give', href: '#/fundraising' },
    { label: 'Recruiting', icon: 'clipboard', href: '#/recruiting' },
    { label: 'Ministry', icon: 'compass', href: '#/crm?bucket=Ministry' },
    { label: 'Marketing', icon: 'bell', href: '#/marketing' },
    { label: 'Church Network', icon: 'home', href: '#/crm?bucket=Church%20Network' }
  ]},
  { label: 'Leader', items: [
    { label: 'MPD', icon: 'dollar', href: '#/mpd' },
    { label: 'Assignment Leaders', icon: 'staff', href: '#/roles' },
    { label: 'Reports', icon: 'chart', href: '#/mpd' }
  ]},
  { label: 'Staff', items: [
    { label: 'Budget', icon: 'chart', href: '#/budgets' },
    { label: 'Cybersecurity Policy', icon: 'shield', href: '#/settings' },
    { label: 'Directory', icon: 'book', href: '#/staff' }
  ]},
  { label: 'Admin', items: [
    { label: 'Finance', icon: 'bank', href: '#/finance' },
    { label: 'General Admin', icon: 'grid', href: '#/general-admin' },
    { label: 'New Applicants', icon: 'clipboard', href: '#/applications' },
    { label: 'Expedition Creation', icon: 'compass', href: '#/expeditions' },
    { label: 'Payroll', icon: 'dollar', href: '#/finance?tab=Payroll' },
    { label: 'EOY Receipts', icon: 'file', href: '#/finance?tab=Receipts' }
  ]},
  { label: 'Media', items: [
    { label: 'Brand Guide', icon: 'image', href: '#/media' },
    { label: 'Writing Guide', icon: 'file', href: '#/media' },
    { label: 'Media Resources', icon: 'download', href: '#/media' }
  ]},
  { label: 'Help', items: [
    { label: 'Active Devices', icon: 'device', href: '#/security' },
    { label: 'Audit Log', icon: 'history', href: '#/audit' },
    { label: 'Generate QR code', icon: 'qr', href: '#/settings' }
  ]}
];

/* --- shell markup --------------------------------------------------------- */
function shell() {
  document.body.innerHTML = `
  <div class="app">
    <header class="topbar">
      <button class="icon-btn rail-toggle" id="railToggle" aria-label="Toggle navigation">${icon('menu')}</button>
      <a class="brand" href="#/" aria-label="Overland Missions — Admin Portal home">
        <img class="brand__logo" src="assets/img/overland-logo-black.svg" alt="Overland Missions">
        <span class="brand__tag">Admin Portal</span>
      </a>
      <div class="topbar__spacer"></div>
      <div class="omnibox">
        ${icon('search')}
        <input type="search" id="omni" placeholder="Search people, expeditions, requests…" aria-label="Global search" autocomplete="off">
      </div>
      <button class="icon-btn" id="alertsBtn" aria-label="Alerts">${icon('bell')}
        <span class="icon-btn__badge icon-btn__badge--go">${D.alerts.filter(a => a.status === 'Scheduled').length}</span></button>
      <button class="icon-btn" id="launcherBtn" aria-label="App menu" aria-expanded="false">${icon('grid')}</button>
      <a class="avatar" href="#/people/${D.me.id}" title="${esc(D.me.name)}">${esc(initials(D.me.name))}</a>
    </header>
    <div class="shell">
      <nav class="rail" id="rail" aria-label="Primary"></nav>
      <main class="main">
        <div class="view" id="view" tabindex="-1"></div>
        <footer class="foot">
          <img class="foot__logo" src="assets/img/overland-logo-white.svg" alt="Overland Missions">
          <span>Admin Portal · Build 2026.09</span>
          <span style="margin-left:auto">Signed in as ${esc(D.me.name)} · ${esc(D.me.role)}</span>
          <a href="#/audit">Audit log</a>
          <a href="#/settings">Settings</a>
        </footer>
      </main>
    </div>
  </div>`;

  document.getElementById('railToggle').addEventListener('click', () =>
    document.getElementById('rail').classList.toggle('is-open'));

  document.getElementById('launcherBtn').addEventListener('click', toggleLauncher);
  document.getElementById('alertsBtn').addEventListener('click', () => { location.hash = '#/alerts'; });

  const omni = document.getElementById('omni');
  omni.addEventListener('keydown', e => {
    if (e.key === 'Enter' && omni.value.trim()) globalSearch(omni.value.trim());
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); omni.focus();
    }
  });
}

function renderRail(activeId) {
  document.getElementById('rail').innerHTML = NAV.map(group => `
    <div class="rail__group">
      <div class="rail__heading">${esc(group.heading)}</div>
      ${group.items.map(it => {
        const c = it.count ? it.count() : null;
        return `<a class="rail__link${it.id === activeId ? ' is-active' : ''}" href="${it.href}">
          ${icon(it.icon)}<span>${esc(it.label)}</span>
          ${c ? `<span class="rail__count">${c}</span>` : ''}</a>`;
      }).join('')}
    </div>`).join('');
}

function toggleLauncher() {
  const btn = document.getElementById('launcherBtn');
  const open = document.querySelector('.launcher');
  if (open) { open.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
  const el = document.createElement('div');
  el.className = 'launcher';
  el.innerHTML = LAUNCHER.map(sec => `
    ${sec.label ? `<div class="launcher__label">${esc(sec.label)}</div>` : ''}
    <div class="launcher__grid">${sec.items.map(i => {
      const b = i.badge ? i.badge() : 0;
      return `<a class="launcher__item" href="${i.href}">
        <span style="position:relative">${icon(i.icon)}${b ? `<span class="icon-btn__badge${i.badgeGo ? ' icon-btn__badge--go' : ''}" style="top:-6px;right:-10px">${b}</span>` : ''}</span>
        <span>${esc(i.label)}</span></a>`;
    }).join('')}</div>`).join('');
  document.querySelector('.app').appendChild(el);
  btn.setAttribute('aria-expanded', 'true');
  setTimeout(() => document.addEventListener('click', function away(e) {
    if (!e.target.closest('.launcher') && !e.target.closest('#launcherBtn')) {
      el.remove(); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', away);
    } else if (e.target.closest('.launcher a')) {
      el.remove(); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', away);
    }
  }), 0);
}

/* --- global search -------------------------------------------------------- */
function globalSearch(q) {
  const t = q.toLowerCase();
  const u = D.users.find(x => x.name.toLowerCase().includes(t) || x.email.toLowerCase().includes(t));
  if (u) return void (location.hash = '#/people/' + u.id);
  const c = D.contacts.find(x => x.name.toLowerCase().includes(t) || x.email.toLowerCase().includes(t));
  if (c) return void (location.hash = '#/crm/' + c.id);
  const e = D.expeditions.find(x => x.name.toLowerCase().includes(t));
  if (e) return void (location.hash = '#/expeditions/' + e.id);
  const r = D.requests.find(x => String(x.id).toLowerCase() === t || x.summary.toLowerCase().includes(t));
  if (r) return void (location.hash = '#/requests/' + r.id);
  toast(`No match for “${q}”`);
}

/* --- router --------------------------------------------------------------- */
function route() {
  const raw = (location.hash || '#/').slice(1);
  const [path, search] = raw.split('?');
  const query = new URLSearchParams(search || '');
  const view = document.getElementById('view');

  for (const [re, render, navId] of ROUTES) {
    const m = re.exec(path);
    if (!m) continue;
    renderRail(navId);
    view.innerHTML = '';
    try {
      render(view, { params: m.slice(1), query });
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="card"><h2 class="card-title">Something went wrong</h2>
        <p class="muted">${esc(err.message)}</p></div>`;
    }
    document.getElementById('rail').classList.remove('is-open');
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    return;
  }

  renderRail(null);
  view.innerHTML = `<div class="card" style="text-align:center;padding:60px 24px">
    <h1 class="card-title">Page not found</h1>
    <p class="muted">No route matches <code>${esc(path)}</code>.</p>
    <p style="margin-top:18px"><a class="btn" href="#/">Back to dashboard</a></p></div>`;
}

/* --- boot ----------------------------------------------------------------- */
shell();
window.addEventListener('hashchange', route);
route();
