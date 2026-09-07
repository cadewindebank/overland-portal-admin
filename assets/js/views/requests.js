import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, dateTime, stat, num, relative, toast, modal, readForm, textareaField, selectField } from '../ui.js';
import * as store from '../store.js';
import { APPROVAL_LIMIT, needsDualAuth } from '../policy.js';
import { currentUser } from '../auth.js';

export default function requests(view, { query }) {
  const render = () => requests(view, { query });
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
    selectable: true,
    onRowClick: r => { location.hash = '#/requests/' + r.id; },
    columns: [
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

  const me = currentUser();

  view.querySelector('#approveAll').addEventListener('click', () => {
    const s = dt.selection();
    if (!s.length) return toast('Select one or more requests first');
    const picked = s.map(id => D.findRequest(id)).filter(Boolean);
    const total = D.sum(picked.filter(r => r.amount), r => r.amount);
    const overLimit = picked.filter(r => r.amount && r.amount > APPROVAL_LIMIT[me.role]);
    const dual = picked.filter(r => needsDualAuth(r.amount));

    modal({
      title: `Approve ${picked.length} request${picked.length > 1 ? 's' : ''}`,
      confirm: overLimit.length ? 'Approve what I can' : 'Approve all',
      body: `<p style="margin-top:0">Total <strong>${usd(total)}</strong> across ${picked.length} requests.</p>
        ${overLimit.length ? `<div class="notice notice--warn">
          ${overLimit.length} request${overLimit.length > 1 ? 's exceed' : ' exceeds'} your approval limit of
          ${usd0(APPROVAL_LIMIT[me.role])} and will be left for a higher approver.</div>` : ''}
        ${dual.length ? `<div class="notice notice--warn">
          ${dual.length} request${dual.length > 1 ? 's need' : ' needs'} a second authoriser and will move to
          <strong>Awaiting 2nd approval</strong> rather than Approved.</div>` : ''}
        <ul style="margin:12px 0 0;padding-left:18px;max-height:190px;overflow:auto">${picked.map(r =>
          `<li>${esc(r.id)} — ${esc(r.summary)}${r.amount ? ` (${usd(r.amount)})` : ''}</li>`).join('')}</ul>
        <div class="hr"></div>
        ${textareaField('Approval note', { placeholder: 'Recorded on each request and visible to the requester.' })}`,
      onConfirm: scrim => {
        const note = readForm(scrim)['Approval note'] || '';
        let approved = 0, held = 0, pending2 = 0;
        picked.forEach(r => {
          if (r.amount && r.amount > APPROVAL_LIMIT[me.role]) { held++; return; }
          const next = needsDualAuth(r.amount) ? 'Awaiting 2nd approval' : 'Approved';
          if (next === 'Approved') approved++; else pending2++;
          store.update('requests', r.id, {
            status: next,
            approvedBy: me.name,
            thread: [...r.thread, { who: me.name, when: new Date().toISOString().slice(0, 16).replace('T', ' '),
              text: note || `Approved in a batch of ${picked.length}.` }]
          });
        });
        dt.clearSelection();
        render();
        toast(`${approved} approved${pending2 ? `, ${pending2} awaiting a 2nd approver` : ''}${held ? `, ${held} over your limit` : ''}`);
      }
    });
  });

  view.querySelector('#bulkAssign').addEventListener('click', () => {
    const s = dt.selection();
    if (!s.length) return toast('Select one or more requests first');
    modal({
      title: `Assign ${s.length} request${s.length > 1 ? 's' : ''}`, confirm: 'Assign',
      body: selectField('Assign to', D.users.slice(0, 20).map(u => u.name)),
      onConfirm: scrim => {
        const who = readForm(scrim)['Assign to'];
        store.updateMany('requests', s, { assignee: who });
        dt.clearSelection();
        render();
        toast(`${s.length} requests assigned to ${who}`);
      }
    });
  });
}
