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

export const deflist = rows => `<dl class="deflist">${rows.map(([k, v]) =>
  `<dt class="dk">${esc(k)}</dt><dd class="dv">${v ?? '—'}</dd>`).join('')}</dl>`;

/* --- form fields ----------------------------------------------------------
   Every control gets a minted id and a <label for>, so it has a
   programmatically determinable accessible name (WCAG 1.3.1 / 4.1.2).
   Usage: field('Email', id => `<input id="${id}" type="email">`)
   -------------------------------------------------------------------------- */
let fieldSeq = 0;
export function field(label, control, opts = {}) {
  const id = 'fld' + (++fieldSeq);
  const hintId = opts.hint ? id + 'h' : null;
  const cls = 'field' + (opts.span ? ' span-' + opts.span : '') + (opts.className ? ' ' + opts.className : '');
  return `<div class="${cls}">
    <label for="${id}">${esc(label)}</label>
    ${control(id, hintId)}
    ${opts.hint ? `<div class="field__hint" id="${hintId}">${opts.hint}</div>` : ''}
  </div>`;
}
/** Shorthands for the common controls. */
export const textField = (label, o = {}) => field(label, (id, h) =>
  `<input id="${id}" type="${o.type || 'text'}"${o.value != null ? ` value="${esc(o.value)}"` : ''}${
    o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ''}${o.list ? ` list="${esc(o.list)}"` : ''}${
    h ? ` aria-describedby="${h}"` : ''}${o.required ? ' required' : ''}>`, o);
export const selectField = (label, options, o = {}) => field(label, (id, h) =>
  `<select id="${id}"${h ? ` aria-describedby="${h}"` : ''}>${options.map(x => {
    const v = typeof x === 'string' ? x : x.value;
    const sel = o.value != null && v === o.value ? ' selected' : '';
    return `<option${sel}>${esc(v)}</option>`;
  }).join('')}</select>`, o);
export const textareaField = (label, o = {}) => field(label, (id, h) =>
  `<textarea id="${id}"${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ''}${
    h ? ` aria-describedby="${h}"` : ''}${o.style ? ` style="${o.style}"` : ''}></textarea>`, o);
export const checkField = (label, o = {}) =>
  `<label class="check"><input type="checkbox"${o.checked ? ' checked' : ''}> <span>${esc(label)}</span></label>`;

/* --- tabs -----------------------------------------------------------------
   One implementation instead of the nine copies this pattern had. Renders a
   real ARIA tablist and returns a mount() that wires selection.
   -------------------------------------------------------------------------- */
let tabSeq = 0;
export function tabs(names, onSelect, initial) {
  const id = 'tabs' + (++tabSeq);
  const active = initial && names.includes(initial) ? initial : names[0];
  const html = `<div class="tabs" role="tablist" id="${id}">${names.map(n => {
    const sel = n === active;
    return `<button type="button" role="tab" data-tab="${esc(n)}" id="${id}-${slug(n)}"
      aria-selected="${sel}" tabindex="${sel ? 0 : -1}"${sel ? ' class="is-active"' : ''}>${esc(n)}</button>`;
  }).join('')}</div>`;
  const mount = root => {
    const strip = root.querySelector('#' + id);
    if (!strip) return;
    const btns = [...strip.querySelectorAll('[data-tab]')];
    const select = b => {
      btns.forEach(x => {
        const on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
      });
      onSelect(b.dataset.tab);
    };
    strip.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (b) select(b);
    });
    strip.addEventListener('keydown', e => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight') n = btns[(i + 1) % btns.length];
      else if (e.key === 'ArrowLeft') n = btns[(i - 1 + btns.length) % btns.length];
      else if (e.key === 'Home') n = btns[0];
      else if (e.key === 'End') n = btns[btns.length - 1];
      if (n) { e.preventDefault(); n.focus(); select(n); }
    });
  };
  return { html, mount, active };
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');

/* Tabs that write the selection into the URL, so Back, refresh, bookmarking
   and deep links all land on the right panel. */
export function tabsUrl(names, onSelect, initial, param = 'tab') {
  const t = tabs(names, name => {
    const [path, qs] = (location.hash || '#/').slice(1).split('?');
    const q = new URLSearchParams(qs || '');
    q.set(param, name);
    const next = `#${path}?${q}`;
    if (next !== location.hash) history.replaceState(null, '', next);
    onSelect(name);
  }, initial);
  return t;
}

/* --- hero band ------------------------------------------------------------- */
export const hero = ({ title, sub, actions, art }) => `
  <section class="hero"${art ? ` style="--hero-art:${art}"` : ''}>
    <h1>${esc(title)}</h1>
    ${sub ? `<p>${esc(sub)}</p>` : ''}
    ${actions ? `<div class="hero__actions">${actions}</div>` : ''}
  </section>`;

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
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'false');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* --- reading a modal's fields ---------------------------------------------
   onConfirm receives the scrim; readForm() turns its controls into an object
   keyed by the visible label, so a caller can persist what the user typed.
   -------------------------------------------------------------------------- */
export function readForm(scrim) {
  const out = {};
  scrim.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'button' || el.type === 'submit') return;
    const label = el.labels && el.labels[0]
      ? el.labels[0].textContent.trim()
      : (el.getAttribute('aria-label') || el.placeholder || el.id || '');
    if (!label) return;
    out[label] = el.type === 'checkbox' ? el.checked : el.value.trim();
  });
  return out;
}

/** Mark a field invalid inside a modal and focus the first offender. */
export function invalid(scrim, labels, message) {
  scrim.querySelectorAll('.field__error').forEach(n => n.remove());
  scrim.querySelectorAll('[aria-invalid]').forEach(n => n.removeAttribute('aria-invalid'));
  let first = null;
  [].concat(labels).forEach(l => {
    const el = [...scrim.querySelectorAll('input, select, textarea')].find(x =>
      (x.labels && x.labels[0] && x.labels[0].textContent.trim() === l));
    if (!el) return;
    el.setAttribute('aria-invalid', 'true');
    const msg = document.createElement('div');
    msg.className = 'field__error';
    msg.textContent = message || 'This field is required';
    el.insertAdjacentElement('afterend', msg);
    if (!first) first = el;
  });
  if (first) first.focus();
  return false;
}

/** Require the named labels to be non-empty. Returns values, or false. */
export function requireFields(scrim, labels) {
  const v = readForm(scrim);
  const missing = labels.filter(l => !v[l]);
  if (missing.length) return invalid(scrim, missing);
  return v;
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
  const opener = document.activeElement;
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  const close = () => {
    if (!scrim.isConnected) return;
    scrim.remove();
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('hashchange', close);
    document.body.style.overflow = prevOverflow;
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
  };

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); return close(); }
    if (e.key !== 'Tab') return;
    const nodes = [...scrim.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  scrim.addEventListener('click', e => {
    if (e.target === scrim || e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-confirm]')) {
      const ok = onConfirm ? onConfirm(scrim) : true;
      if (ok !== false) close();
    }
  });

  const prevOverflow = document.body.style.overflow;
  document.addEventListener('keydown', onKey, true);
  // a modal must never outlive the view that opened it
  window.addEventListener('hashchange', close);
  document.body.style.overflow = 'hidden';
  document.body.appendChild(scrim);
  const target = scrim.querySelector(FOCUSABLE);
  if (target) target.focus();
  scrim.close = close;
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
    /* Selection is held here, not in the DOM, so sorting, paging, filtering
       and searching no longer silently discard the user's picks. */
    this.selected = new Set();
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

  /* --- selection --------------------------------------------------------- */
  isSelected(id) { return this.selected.has(String(id)); }
  toggle(id, on) {
    const k = String(id);
    if (on === undefined) on = !this.selected.has(k);
    if (on) this.selected.add(k); else this.selected.delete(k);
    if (this.o.onSelectionChange) this.o.onSelectionChange([...this.selected]);
  }
  /** Every row matching the current filters — not merely the visible page. */
  selectableIds() { return this.sorted(this.filtered()).map(r => String(r.id)); }
  selectAll(on) {
    const ids = this.selectableIds();
    if (on) ids.forEach(i => this.selected.add(i));
    else ids.forEach(i => this.selected.delete(i));
    if (this.o.onSelectionChange) this.o.onSelectionChange([...this.selected]);
  }
  selection() { return [...this.selected]; }
  clearSelection() { this.selected.clear(); this.paint(); }

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
    const cols = this.o.selectable
      ? [{ key: '__sel', label: '', sortable: false, filter: false, className: 'dt__sel',
           render: r => `<input type="checkbox" data-sel="${esc(r.id)}"${
             this.isSelected(r.id) ? ' checked' : ''} aria-label="Select row ${esc(r.id)}">` }]
        .concat(this.o.columns)
      : this.o.columns;

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
            <tr>${cols.map(c => {
              const on = this.sortKey === c.key;
              const canSort = c.sortable !== false;
              const ariaSort = on ? (this.sortDir === 'asc' ? 'ascending' : 'descending') : (canSort ? 'none' : null);
              if (c.key === '__sel') {
                const ids = this.selectableIds();
                const all = ids.length && ids.every(i => this.selected.has(i));
                const some = !all && ids.some(i => this.selected.has(i));
                return `<th scope="col" class="dt__sel"><input type="checkbox" data-selall${
                  all ? ' checked' : ''}${some ? ' data-indeterminate' : ''
                } aria-label="Select all ${ids.length} matching rows"></th>`;
              }
              return `<th scope="col" class="${c.className || ''}${canSort ? ' sortable' : ''}${
                on ? (this.sortDir === 'asc' ? ' sorted-asc' : ' sorted-desc') : ''
              }"${ariaSort ? ` aria-sort="${ariaSort}"` : ''} data-sort="${canSort ? esc(c.key) : ''}">${
                canSort
                  ? `<button type="button" class="dt__sort">${esc(c.label)}</button>`
                  : esc(c.label)
              }</th>`;
            }).join('')}</tr>
            ${this.o.columnFilters ? `<tr class="dt__filters">${cols.map(c => `<td class="${c.className || ''}" style="border-bottom:1px solid var(--line);padding:6px 10px">${
              c.filter === false ? '' :
              `<input type="search" data-colq="${esc(c.key)}" value="${esc(this.colQ[c.key] || '')}" aria-label="Filter by ${esc(c.label)}" style="width:100%;min-width:80px;padding:5px 8px;border:1px solid var(--line-strong);border-radius:3px;font-size:12px">`
            }</td>`).join('')}</tr>` : ''}
          </thead>
          <tbody>
            ${rows.length ? rows.map(r => `<tr${this.o.onRowClick ? ' style="cursor:pointer" tabindex="0"' : ''} data-row="${esc(r.id ?? '')}">${
              cols.map(c => `<td class="${c.className || ''}">${this.cellHtml(c, r)}</td>`).join('')
            }</tr>`).join('') : `<tr><td colspan="${cols.length}">${emptyState('No matching records found', 'Adjust your filters and try again.')}</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="dt__foot">
        <span>Showing ${total ? start + 1 : 0} to ${Math.min(start + this.size, total)} of ${num(total)} entries${
          total !== this.o.rows.length ? ` (filtered from ${num(this.o.rows.length)})` : ''}</span>
        ${this.o.selectable && this.selected.size
          ? `<strong style="color:var(--flare)">${num(this.selected.size)} selected</strong>
             <button class="btn-mini" data-clearsel>Clear</button>` : ''}
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
    const selAll = root.querySelector('[data-selall]');
    if (selAll && selAll.hasAttribute('data-indeterminate')) selAll.indeterminate = true;

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
      if (e.target.closest('[data-clearsel]')) { this.selected.clear(); return this.paint(); }
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'csv') return this.exportCsv();
      if (act && act.dataset.act === 'print') return this.print();

      const box = e.target.closest('[data-sel]');
      if (box) { e.stopPropagation(); this.toggle(box.dataset.sel, box.checked); this.paint(); return; }
      if (e.target.closest('[data-selall]')) {
        e.stopPropagation(); this.selectAll(e.target.checked); this.paint(); return;
      }

      const tr = e.target.closest('tbody tr[data-row]');
      // inputs and labels inside a row must never navigate away from it
      if (tr && this.o.onRowClick && !e.target.closest('a,button,input,select,textarea,label')) {
        const row = this.o.rows.find(r => String(r.id) === tr.dataset.row);
        if (row) this.o.onRowClick(row, e);
      }
    });

    root.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tr = e.target.closest('tbody tr[data-row]');
      if (tr && this.o.onRowClick && e.target === tr) {
        e.preventDefault();
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
    document.body.appendChild(a);
    a.click();
    a.remove();
    // give the download a tick to start before the blob is released
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
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
  let s = String(v ?? '');
  // A leading =, +, -, @ or control char makes Excel/Sheets evaluate the cell.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
