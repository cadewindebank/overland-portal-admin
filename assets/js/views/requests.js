import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, dateTime, stat, num, relative, toast, modal } from '../ui.js';

export default function requests(view, { query }) {
  const typeFilter = query.get('type') || '';
  const statusFilter = query.get('status') || '';
  let rows = D.requests;
  if (typeFilter) rows = rows.filter(r => r.type === typeFilter);
  if (statusFilter) rows = rows.filter(r => r.status === statusFilter);

  const pending = D.pendingRequests();
  const byType = D.REQUEST_TYPES.map(t => ({
    ...t,
    total: D.requests.filter(r => r.type === t.key).length,
    open: pending.filter(r => r.type === t.key).length,
    value: D.sum(pending.filter(r => r.type === t.key && r.amount), r => r.amount)
  }));

  view.innerHTML = `
    ${pageHead({
      title: 'Request Queue',
      sub: 'Every form submitted through the portal — wires, transfers, pay requests, media, projects, insurance and incidents.',
      actions: `<button class="btn-mini" id="bulkAssign">${icon('people')} Bulk assign</button>
                <button class="btn" id="approveAll">Approve selected</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Open requests', value: num(pending.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Urgent', value: num(pending.filter(r => r.priority === 'Urgent').length), accent: 'var(--bark)' })}
      ${stat({ label: 'Value awaiting approval', value: usd0(D.sum(pending.filter(r => r.amount), r => r.amount)), accent: 'var(--sap)' })}
      ${stat({ label: 'Unassigned', value: num(pending.filter(r => !r.assignee).length), accent: 'var(--rain)' })}
    </div>

    <div class="grid grid--3" style="margin-bottom:18px;gap:12px">
      ${byType.map(t => `
        <a href="#/requests?type=${t.key}" class="card" style="text-decoration:none;color:inherit;padding:14px 16px;${
          t.key === typeFilter ? 'border-color:var(--flare);box-shadow:inset 3px 0 0 var(--flare)' : ''}">
          <div class="row" style="gap:10px;align-items:flex-start">
            <span style="color:var(--slate);display:inline-flex">${icon(t.icon)}</span>
            <div style="min-width:0;flex:1">
              <div style="font-weight:500">${esc(t.label)}</div>
              <div class="muted" style="font-size:12px">${esc(t.queue)} queue</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:var(--font-display);font-size:24px;line-height:1;color:${t.open ? 'var(--flare)' : 'var(--input-grey)'}">${t.open}</div>
              <div class="muted" style="font-size:11px">of ${t.total}</div>
            </div>
          </div>
          ${t.value ? `<div class="muted" style="font-size:12px;margin-top:8px">${usd0(t.value)} awaiting approval</div>` : ''}
        </a>`).join('')}
    </div>

    <div class="row" style="margin-bottom:12px">
      <span class="eyebrow">Filter</span>
      <a class="btn-mini${!typeFilter && !statusFilter ? ' is-active' : ''}" href="#/requests">All</a>
      ${['Pending','In Review','Approved','Paid','Denied'].map(s =>
        `<a class="btn-mini" href="#/requests?status=${encodeURIComponent(s)}"${s === statusFilter ? ' style="border-color:var(--flare);color:var(--flare)"' : ''}>${s}</a>`).join('')}
      ${typeFilter ? `<span class="muted" style="margin-left:8px">Showing <strong>${esc(D.REQUEST_TYPES.find(t => t.key === typeFilter)?.label || typeFilter)}</strong> · <a href="#/requests">clear</a></span>` : ''}
    </div>

    <div id="reqTable"></div>`;

  const dt = new DataTable({
    title: 'Request queue', rows, pageSize: 25, sortKey: 'submitted', sortDir: 'desc',
    onRowClick: r => { location.hash = '#/requests/' + r.id; },
    columns: [
      { key: 'sel', label: '', sortable: false, filter: false,
        render: r => `<input type="checkbox" data-sel="${r.id}" aria-label="Select ${r.id}">` },
      { key: 'id', label: 'ID', render: r => `<a href="#/requests/${r.id}">${r.id}</a>` },
      { key: 'typeLabel', label: 'Type' },
      { key: 'queue', label: 'Queue' },
      { key: 'requester', label: 'Requester', render: r => `<a class="rowlink" href="#/people/${r.requesterId}">${esc(r.requester)}</a>` },
      { key: 'summary', label: 'Summary' },
      { key: 'amount', label: 'Amount', className: 'num', value: r => r.amount || 0, render: r => r.amount == null ? '—' : usd(r.amount) },
      { key: 'submitted', label: 'Submitted', render: r => `<span title="${esc(dateTime(r.submitted))}">${relative(r.submitted)}</span>` },
      { key: 'assignee', label: 'Assignee', render: r => r.assignee ? esc(r.assignee) : '<span class="muted">Unassigned</span>' },
      { key: 'priority', label: 'Priority', render: r => r.priority === 'Urgent' ? badge('Urgent') : esc(r.priority) },
      { key: 'status', label: 'Status', render: r => badge(r.status) }
    ]
  }).mount(view.querySelector('#reqTable'));

  const selected = () => [...view.querySelectorAll('[data-sel]:checked')].map(i => i.dataset.sel);

  view.querySelector('#approveAll').addEventListener('click', () => {
    const s = selected();
    if (!s.length) return toast('Select one or more requests first');
    modal({
      title: `Approve ${s.length} request${s.length > 1 ? 's' : ''}`, confirm: 'Approve all',
      body: `<p class="muted" style="margin-top:0">These requests will move to <strong>Approved</strong> and enter the next disbursement run.</p>
        <ul style="margin:0;padding-left:18px">${s.map(id => {
          const r = D.findRequest(id);
          return `<li>${esc(r.id)} — ${esc(r.summary)}${r.amount ? ` (${usd(r.amount)})` : ''}</li>`;
        }).join('')}</ul>
        <div class="hr"></div>
        <div class="field"><label>Approval note</label><textarea placeholder="Recorded on each request and visible to the requester."></textarea></div>`,
      onConfirm: () => toast(`${s.length} requests approved`)
    });
  });
  view.querySelector('#bulkAssign').addEventListener('click', () => {
    const s = selected();
    if (!s.length) return toast('Select one or more requests first');
    modal({
      title: `Assign ${s.length} request${s.length > 1 ? 's' : ''}`, confirm: 'Assign',
      body: `<div class="field"><label>Assign to</label><select>${D.users.slice(0, 20).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>`,
      onConfirm: () => toast(`${s.length} requests assigned`)
    });
  });
  void dt;
}
