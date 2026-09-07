/* ==========================================================================
   Mutation layer.

   data.js seeds the collections; this module is the only thing that CHANGES
   them. Views call create/update/remove and then re-render on the change
   notification, so an action taken in one screen is visible in every other.

   Swapping in a real API means changing the three primitives below to await
   fetch() — the views' call sites do not change.

   Writes are journalled to the audit log and mirrored to localStorage so a
   demo survives a reload. `resetAll()` returns to the seeded state.
   ========================================================================== */

import * as D from './data.js';
import { audit } from './auth.js';

const KEY = 'om.portal.v1';
const listeners = new Set();

/* --- collection registry -------------------------------------------------- */
const COLLECTIONS = {
  users: D.users,
  contacts: D.contacts,
  expeditions: D.expeditions,
  applications: D.applications,
  donations: D.donations,
  donationPages: D.donationPages,
  requests: D.requests,
  tasks: D.tasks,
  alerts: D.alerts,
  reminders: D.reminders,
  events: D.events,
  signups: D.signups,
  campaigns: D.campaigns,
  blogs: D.blogs,
  surveys: D.surveys,
  mpders: D.mpders,
  fundsRequests: D.fundsRequests,
  payrollRuns: D.payrollRuns,
  mplLines: D.mplLines,
  easyScanQueue: D.easyScanQueue,
  qbCustomers: D.qbCustomers,
  receiptBatches: D.receiptBatches,
  interbankTransfers: D.interbankTransfers,
  budgets: D.budgets,
  countries: D.countries,
  regions: D.regions,
  groups: D.groups,
  mediaAssets: D.mediaAssets,
  auditLog: D.auditLog,
  sessions: D.sessions,
  expeditionInsurance: D.expeditionInsurance
};

export const collection = name => COLLECTIONS[name];

/* --- change notification -------------------------------------------------- */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(change) {
  persist();
  for (const fn of listeners) {
    try { fn(change); } catch (err) { console.error('store listener failed', err); }
  }
}

/* --- id minting ----------------------------------------------------------- */
const PREFIX = {
  users: 'U', contacts: 'C', expeditions: 'E', applications: 'A', donations: 'D',
  donationPages: 'P', requests: 'R', tasks: 'T', alerts: 'N', reminders: 'RM',
  events: 'EV', signups: 'SU', campaigns: 'CM', blogs: 'BL', surveys: 'SV',
  mpders: 'MP', fundsRequests: 'FR', payrollRuns: 'PR', mplLines: 'ML',
  easyScanQueue: 'ES', qbCustomers: 'QB', receiptBatches: 'RB',
  interbankTransfers: 'IB', budgets: 'B', countries: 'CO', regions: 'RG',
  groups: 'GR', mediaAssets: 'M', auditLog: 'L', sessions: 'S',
  expeditionInsurance: 'EI'
};
let seq = 0;
export function mintId(name) {
  const p = PREFIX[name] || 'X';
  const rows = COLLECTIONS[name] || [];
  const nums = rows
    .map(r => String(r.id || '').replace(/^[A-Za-z]+/, ''))
    .map(n => parseInt(n, 10))
    .filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1 + (seq++ % 1);
  return p + String(next);
}

/* --- the three primitives -------------------------------------------------- */
export function create(name, record, { silent } = {}) {
  const rows = COLLECTIONS[name];
  if (!rows) throw new Error(`Unknown collection: ${name}`);
  const row = { id: record.id || mintId(name), ...record };
  rows.unshift(row);
  if (!silent) {
    logChange('create', name, row.id, record);
    emit({ type: 'create', collection: name, id: row.id, row });
  }
  return row;
}

export function update(name, id, patch, { silent } = {}) {
  const rows = COLLECTIONS[name];
  if (!rows) throw new Error(`Unknown collection: ${name}`);
  const row = rows.find(r => String(r.id) === String(id));
  if (!row) throw new Error(`${name}/${id} not found`);
  const before = {};
  for (const k of Object.keys(patch)) before[k] = row[k];
  Object.assign(row, patch);
  if (!silent) {
    logChange('update', name, id, patch, before);
    emit({ type: 'update', collection: name, id, row, patch, before });
  }
  return row;
}

export function remove(name, id) {
  const rows = COLLECTIONS[name];
  if (!rows) throw new Error(`Unknown collection: ${name}`);
  const i = rows.findIndex(r => String(r.id) === String(id));
  if (i < 0) return null;
  const [row] = rows.splice(i, 1);
  logChange('delete', name, id, null, row);
  emit({ type: 'delete', collection: name, id, row });
  return row;
}

/** Apply the same patch to many ids as one logical action. */
export function updateMany(name, ids, patch) {
  const rows = ids.map(id => update(name, id, patch, { silent: true }));
  logChange('update', name, `${ids.length} records`, patch);
  emit({ type: 'bulk', collection: name, ids, patch });
  return rows;
}

/* --- audit journal --------------------------------------------------------- */
function logChange(action, name, id, patch, before) {
  const detail = patch ? Object.keys(patch).join(', ') : '';
  audit(`${name}.${action}`, String(id), detail);
  D.auditLog.unshift({
    id: 'L' + (90000 + D.auditLog.length + 1),
    when: nowStamp(),
    actor: (window.__omUser && window.__omUser.name) || 'System',
    actorId: (window.__omUser && window.__omUser.userId) || 'U1000',
    action: `${name}.${action}`,
    label: `${action === 'create' ? 'Created' : action === 'delete' ? 'Deleted' : 'Updated'} ${singular(name)}`,
    target: String(id),
    ip: 'local',
    result: 'Success',
    detail,
    before: before || null
  });
}
const singular = n => n.replace(/ies$/, 'y').replace(/s$/, '');
function nowStamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* --- persistence ----------------------------------------------------------- */
let persistTimer = null;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const snapshot = {};
      for (const [name, rows] of Object.entries(COLLECTIONS)) snapshot[name] = rows;
      localStorage.setItem(KEY, JSON.stringify({ v: 1, at: Date.now(), data: snapshot }));
    } catch (_) { /* quota or private mode — the app still works, just not across reloads */ }
  }, 250);
}

/** Rehydrate a previous session's changes over the seeded data. */
export function hydrate() {
  let raw;
  try { raw = localStorage.getItem(KEY); } catch (_) { return false; }
  if (!raw) return false;
  try {
    const { data } = JSON.parse(raw);
    if (!data) return false;
    for (const [name, rows] of Object.entries(data)) {
      const target = COLLECTIONS[name];
      if (!Array.isArray(target) || !Array.isArray(rows)) continue;
      target.length = 0;
      target.push(...rows);
    }
    return true;
  } catch (_) { return false; }
}

/** Discard local changes and reload from the seed. */
export function resetAll() {
  try { localStorage.removeItem(KEY); } catch (_) {}
  location.reload();
}

export function hasLocalChanges() {
  try { return !!localStorage.getItem(KEY); } catch (_) { return false; }
}
