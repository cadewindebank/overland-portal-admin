/* ==========================================================================
   UI primitives — the shared component vocabulary for the admin portal.
   ========================================================================== */
import { icon } from './icons.js';

/* --- escaping & formatting ------------------------------------------------ */
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const usd = n => (n < 0 ? '-' : '') + '$' + Math.abs(Number(n) || 0)
  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd0 = n => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(Number(n) || 0)).toLocaleString('en-US');
export const num = n => Number(n || 0).toLocaleString('en-US');
export const pct = n => Math.round(Number(n) || 0) + '%';

export const shortDate = s => {
  if (!s) return '—';
  const d = new Date(String(s).length <= 10 ? s + 'T00:00:00' : s.replace(' ', 'T'));
  return isNaN(d) ? esc(s) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
export const dateTime = s => {
  if (!s) return '—';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? esc(s) : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};
export function relative(s) {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return esc(s);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 0) return 'in ' + relativeParts(-mins);
  if (mins < 1) return 'just now';
  return relativeParts(mins) + ' ago';
}
function relativeParts(mins) {
  if (mins < 60) return mins + 'm';
  if (mins < 1440) return Math.round(mins / 60) + 'h';
  if (mins < 43200) return Math.round(mins / 1440) + 'd';
  return Math.round(mins / 43200) + 'mo';
}

export const initials = name => String(name || '?').split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();

/* --- small render helpers -------------------------------------------------- */
export const avatar = (name, cls = '') => `<span class="avatar ${cls}" title="${esc(name)}">${esc(initials(name))}</span>`;

const STATUS_CLASS = {
  Pending: 'pending', 'In Review': 'review', Interview: 'review', Submitted: 'review',
  Approved: 'approved', Accepted: 'approved', Paid: 'paid', Done: 'paid', Live: 'live',
  Denied: 'denied', Declined: 'denied', Blocked: 'denied', Suspended: 'denied', Missing: 'denied',
  Draft: 'draft', Recalled: 'draft', Waitlisted: 'draft', Closed: 'draft', Open: 'review',
  Active: 'approved', Current: 'approved', Expiring: 'pending', Locked: 'pending',
  Urgent: 'urgent', 'In Progress': 'review', Success: 'approved', Sent: 'approved',
  Scheduled: 'review', Invited: 'draft', Clear: 'approved', Received: 'approved'
};
export const badge = (label, kind) =>
  `<span class="badge badge--${kind || STATUS_CLASS[label] || 'draft'}"><i class="dot"></i>${esc(label)}</span>`;

export const stat = ({ label, value, meta, delta, accent }) => `
  <div class="stat"${accent ? ` style="--accent:${accent}"` : ''}>
    <div class="stat__label">${esc(label)}</div>
    <div class="stat__value">${value}</div>
    ${delta ? `<div class="stat__delta ${delta.startsWith('-') ? 'delta-down' : 'delta-up'}">${esc(delta)}</div>` : ''}
    ${meta ? `<div class="stat__meta">${meta}</div>` : ''}
  </div>`;

export const progress = (p, go) =>
  `<div class="progress${go ? ' progress--go' : ''}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;

export const card = (body, { title, actions, icon: ic, flush } = {}) => `
  <section class="card${flush ? ' card--flush' : ''}">
    ${title ? `<header class="card__head">
      <h2 class="section-title">${ic ? icon(ic) : ''}${esc(title)}</h2>
      ${actions ? `<div class="card__head-actions">${actions}</div>` : ''}
    </header>` : ''}
    ${body}
  </section>`;

export const pageHead = ({ crumbs, title, sub, actions }) => `
  <div class="page-head">
    <div class="page-head__text">
      ${crumbs ? `<nav class="crumbs">${crumbs.map((c, i) =>
        (i ? '<span>/</span>' : '') + (c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`)
      ).join('')}</nav>` : ''}
      <h1>${esc(title)}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
    </div>
    ${actions ? `<div class="page-head__actions">${actions}</div>` : ''}
  </div>`;

export const deflist = rows => `<div class="deflist">${rows.map(([k, v]) =>
  `<div class="dk">${esc(k)}</div><div class="dv">${v ?? '—'}</div>`).join('')}</div>`;

export const emptyState = (msg, sub) =>
  `<div class="dt__empty"><div style="font-size:15px;color:var(--text)">${esc(msg)}</div>${sub ? `<div style="margin-top:4px">${esc(sub)}</div>` : ''}</div>`;

export const barChart = (series, fmt = usd0) => {
  const max = Math.max(...series.map(s => s.total), 1);
  return `<div class="chart">${series.map(s => `
    <div class="chart__col">
      <div class="chart__bar" style="height:${Math.max(3, (s.total / max) * 100)}%" data-value="${fmt(s.total)}"></div>
      <div class="chart__label">${esc(s.month)}</div>
    </div>`).join('')}</div>`;
};

/* --- toasts ---------------------------------------------------------------- */
export function toast(message) {
  let host = document.querySelector('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* --- modal ----------------------------------------------------------------- */
export function modal({ title, body, confirm = 'Confirm', cancel = 'Cancel', wide, onConfirm }) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `
    <div class="modal${wide ? ' modal--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="modal__head"><h2>${esc(title)}</h2>
        <button class="icon-btn push" data-close aria-label="Close">${icon('x')}</button></header>
      <div class="modal__body">${body}</div>
      <footer class="modal__foot">
        <button class="btn-mini" data-close>${esc(cancel)}</button>
        <button class="btn" data-confirm>${esc(confirm)}</button>
      </footer>
    </div>`;
  const close = () => scrim.remove();
  scrim.addEventListener('click', e => {
    if (e.target === scrim || e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-confirm]')) {
      const ok = onConfirm ? onConfirm(scrim) : true;
      if (ok !== false) close();
    }
  });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });
  document.body.appendChild(scrim);
  return scrim;
}

/* ==========================================================================
   DataTable — reproduces the portal's DataTables behaviour:
   length menu, global search, per-column filters, sorting, CSV, print, paging.
   ========================================================================== */
let dtSeq = 0;

export class DataTable {
  /**
   * @param {object} opts
   *   columns: [{ key, label, className?, render?(row), value?(row), sortable?, filter? }]
   *   rows:    array of records
   *   title:   shown in the toolbar, used for the CSV filename and print header
   *   hideTitle: keep the title for export/print but don't render it (the card
   *              header already names the table)
   *   pageSize, toolbar (extra HTML), columnFilters (bool), onRowClick(row)
   */
  constructor(opts) {
    this.o = Object.assign({ pageSize: 10, columnFilters: true, sortable: true }, opts);
    this.id = 'dt' + (++dtSeq);
    this.page = 1;
    this.size = this.o.pageSize;
    this.q = '';
    this.colQ = {};
    this.sortKey = this.o.sortKey || null;
    this.sortDir = this.o.sortDir || 'asc';
  }

  cellValue(col, row) {
    if (col.value) return col.value(row);
    const v = row[col.key];
    return v == null ? '' : v;
  }
  cellHtml(col, row) {
    if (col.render) return col.render(row);
    const v = this.cellValue(col, row);
    return esc(v);
  }

  filtered() {
    const q = this.q.trim().toLowerCase();
    return this.o.rows.filter(row => {
      if (q) {
        const hay = this.o.columns.map(c => String(this.cellValue(c, row))).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const [key, term] of Object.entries(this.colQ)) {
        if (!term) continue;
        const col = this.o.columns.find(c => c.key === key);
        if (!col) continue;
        if (!String(this.cellValue(col, row)).toLowerCase().includes(term.toLowerCase())) return false;
      }
      return true;
    });
  }

  sorted(rows) {
    if (!this.sortKey) return rows;
    const col = this.o.columns.find(c => c.key === this.sortKey);
    if (!col) return rows;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = this.cellValue(col, a), bv = this.cellValue(col, b);
      const an = typeof av === 'number', bn = typeof bv === 'number';
      if (an && bn) return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  }

  html() {
    const all = this.sorted(this.filtered());
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / this.size));
    if (this.page > pages) this.page = pages;
    const start = (this.page - 1) * this.size;
    const rows = all.slice(start, start + this.size);
    const cols = this.o.columns;

    const pager = [];
    pager.push(`<button data-page="prev"${this.page === 1 ? ' disabled' : ''}>Previous</button>`);
    const win = [];
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - this.page) <= 1) win.push(p);
      else if (win[win.length - 1] !== '…') win.push('…');
    }
    win.forEach(p => pager.push(p === '…'
      ? `<button disabled>…</button>`
      : `<button data-page="${p}"${p === this.page ? ' class="is-active"' : ''}>${p}</button>`));
    pager.push(`<button data-page="next"${this.page === pages ? ' disabled' : ''}>Next</button>`);

    return `
    <div class="dt" id="${this.id}">
      <div class="dt__head">
        ${this.o.title && !this.o.hideTitle ? `<h2 class="dt__title">${esc(this.o.title)}</h2>` : ''}
        <div class="dt-btn-group">
          <button class="dt-btn" data-act="csv">CSV</button>
          <button class="dt-btn" data-act="print">Print</button>
        </div>
        <label class="dt__len">Show
          <select data-act="size">${[10, 25, 50, 100].map(n =>
            `<option value="${n}"${n === this.size ? ' selected' : ''}>${n}</option>`).join('')}</select>
          entries</label>
        <div class="dt__search"><input type="search" placeholder="Search" value="${esc(this.q)}" data-act="q" aria-label="Search table"></div>
        ${this.o.toolbar || ''}
      </div>
      <div class="dt__scroll">
        <table class="dt__table">
          <thead>
            <tr>${cols.map(c => `<th class="${c.className || ''}${c.sortable === false ? '' : ' sortable'}${
              this.sortKey === c.key ? (this.sortDir === 'asc' ? ' sorted-asc' : ' sorted-desc') : ''
            }" data-sort="${c.sortable === false ? '' : esc(c.key)}">${esc(c.label)}</th>`).join('')}</tr>
            ${this.o.columnFilters ? `<tr>${cols.map(c => `<th class="${c.className || ''}" style="border-bottom:1px solid var(--line);padding:6px 10px">${
              c.filter === false ? '' :
              `<input type="search" data-colq="${esc(c.key)}" value="${esc(this.colQ[c.key] || '')}" aria-label="Filter ${esc(c.label)}" style="width:100%;min-width:80px;padding:5px 8px;border:1px solid var(--line-strong);border-radius:3px;font-size:12px">`
            }</th>`).join('')}</tr>` : ''}
          </thead>
          <tbody>
            ${rows.length ? rows.map(r => `<tr${this.o.onRowClick ? ' style="cursor:pointer"' : ''} data-row="${esc(r.id ?? '')}">${
              cols.map(c => `<td class="${c.className || ''}">${this.cellHtml(c, r)}</td>`).join('')
            }</tr>`).join('') : `<tr><td colspan="${cols.length}">${emptyState('No matching records found', 'Adjust your filters and try again.')}</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="dt__foot">
        <span>Showing ${total ? start + 1 : 0} to ${Math.min(start + this.size, total)} of ${num(total)} entries${
          total !== this.o.rows.length ? ` (filtered from ${num(this.o.rows.length)})` : ''}</span>
        <div class="pager">${pager.join('')}</div>
      </div>
    </div>`;
  }

  /** Render into a container and wire up interaction. */
  mount(container) {
    this.host = typeof container === 'string' ? document.querySelector(container) : container;
    this.paint();
    return this;
  }
  paint() {
    this.host.innerHTML = this.html();
    const root = this.host.querySelector('.dt');

    root.addEventListener('click', e => {
      const sortTh = e.target.closest('th[data-sort]');
      if (sortTh && sortTh.dataset.sort) {
        const k = sortTh.dataset.sort;
        if (this.sortKey === k) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortKey = k; this.sortDir = 'asc'; }
        return this.paint();
      }
      const pg = e.target.closest('[data-page]');
      if (pg) {
        const v = pg.dataset.page;
        if (v === 'prev') this.page = Math.max(1, this.page - 1);
        else if (v === 'next') this.page = this.page + 1;
        else this.page = Number(v);
        return this.paint();
      }
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'csv') return this.exportCsv();
      if (act && act.dataset.act === 'print') return this.print();

      const tr = e.target.closest('tbody tr[data-row]');
      if (tr && this.o.onRowClick && !e.target.closest('a,button')) {
        const row = this.o.rows.find(r => String(r.id) === tr.dataset.row);
        if (row) this.o.onRowClick(row, e);
      }
    });

    root.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.act === 'q') { this.q = t.value; this.page = 1; this.repaintKeepFocus('[data-act="q"]'); }
      else if (t.dataset.colq != null) {
        this.colQ[t.dataset.colq] = t.value; this.page = 1;
        this.repaintKeepFocus(`[data-colq="${t.dataset.colq}"]`);
      }
    });
    root.addEventListener('change', e => {
      if (e.target.dataset.act === 'size') { this.size = Number(e.target.value); this.page = 1; this.paint(); }
    });
  }
  repaintKeepFocus(sel) {
    const active = this.host.querySelector(sel);
    const pos = active ? active.selectionStart : null;
    this.paint();
    const next = this.host.querySelector(sel);
    if (next) { next.focus(); if (pos != null) try { next.setSelectionRange(pos, pos); } catch (_) {} }
  }

  rowsForExport() {
    return this.sorted(this.filtered());
  }
  exportCsv() {
    const cols = this.o.columns;
    const lines = [cols.map(c => csvCell(c.label)).join(',')];
    for (const r of this.rowsForExport()) lines.push(cols.map(c => csvCell(this.cellValue(c, r))).join(','));
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.o.title || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exported');
  }
  print() {
    const cols = this.o.columns;
    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) return toast('Allow pop-ups to print this table');
    w.document.write(`<title>${esc(this.o.title || 'Overland Missions')}</title>
      <style>body{font:13px 'Work Sans',sans-serif;padding:24px;color:#1c1b19}
      h1{font-size:18px;text-transform:uppercase;letter-spacing:.06em;font-weight:400}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th{text-align:left;border-bottom:2px solid #0f0e0d;padding:7px 8px}
      td{padding:6px 8px}tbody tr:nth-child(odd){background:#ececec}</style>
      <h1>${esc(this.o.title || 'Export')}</h1>
      <table><thead><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>
      ${this.rowsForExport().map(r => `<tr>${cols.map(c => `<td>${esc(this.cellValue(c, r))}</td>`).join('')}</tr>`).join('')}
      </tbody></table>`);
    w.document.close();
    w.print();
  }
}
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
