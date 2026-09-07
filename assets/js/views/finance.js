import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, dateTime, stat, num, modal, toast } from '../ui.js';

export default function finance(view, { query }) {
  const tab = query.get('tab') || 'Authorize';
  const toAuthorise = D.requests.filter(r => r.amount != null && ['Pending', 'In Review'].includes(r.status));
  const unreconciled = D.mplLines.filter(l => !l.reconciled);
  const exceptions = D.easyScanQueue.filter(b => b.status === 'Exception');

  const TABS = ['Authorize', 'Payroll', 'MPL', 'Transfers', 'Reimburse', 'Receipts', 'Easy Scan', 'QB Customers', 'Reports'];

  view.innerHTML = `
    ${pageHead({
      title: 'Finance',
      sub: 'The admin finance console — authorisation, payroll, ministry expense lines, interbank transfers, receipts and the QuickBooks bridge.',
      actions: `<button class="btn-mini" id="close">${icon('checkCircle')} Close period</button>
                <button class="btn" id="authorizeAll">Authorize all</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Awaiting authorisation', value: usd0(D.sum(toAuthorise, r => r.amount)), accent: 'var(--flare)',
               meta: `${toAuthorise.length} items` })}
      ${stat({ label: 'Next payroll', value: usd0(D.payrollRuns[0].gross), accent: 'var(--rain)',
               meta: `${D.payrollRuns[0].people} people · ${D.payrollRuns[0].status}` })}
      ${stat({ label: 'Unreconciled MPL', value: num(unreconciled.length), accent: 'var(--sap)',
               meta: usd0(D.sum(unreconciled, l => l.amount)) })}
      ${stat({ label: 'In transit (interbank)', value: usd0(D.sum(D.interbankTransfers.filter(t => t.status === 'In Transit'), t => t.amount)), accent: 'var(--lagoon)' })}
      ${stat({ label: 'Scan exceptions', value: num(exceptions.length), accent: 'var(--bark)', meta: 'Need manual posting' })}
    </div>

    <div class="tabs" id="tabs">
      ${TABS.map(t => `<button data-tab="${t}"${t === tab ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="finBody"></div>`;

  const body = view.querySelector('#finBody');
  const mount = opts => { body.innerHTML = '<div id="t"></div>'; new DataTable(Object.assign({ pageSize: 15 }, opts)).mount(body.querySelector('#t')); };

  const tabs = {
    Authorize: () => mount({
      title: 'Authorize (all)', rows: toAuthorise, sortKey: 'submitted', sortDir: 'desc',
      onRowClick: r => { location.hash = '#/requests/' + r.id; },
      columns: [
        { key: 'sel', label: '', sortable: false, filter: false, render: r => `<input type="checkbox" data-sel="${r.id}" aria-label="Select ${r.id}">` },
        { key: 'id', label: 'ID', render: r => `<a href="#/requests/${r.id}">${r.id}</a>` },
        { key: 'typeLabel', label: 'Type' },
        { key: 'requester', label: 'Requester' },
        { key: 'summary', label: 'Summary' },
        { key: 'amount', label: 'Amount', className: 'num', render: r => usd(r.amount) },
        { key: 'currency', label: 'Ccy' },
        { key: 'submitted', label: 'Submitted', render: r => dateTime(r.submitted) },
        { key: 'status', label: 'Status', render: r => badge(r.status) }
      ]
    }),
    Payroll: () => mount({
      title: 'Payroll runs', rows: D.payrollRuns, columnFilters: false, sortKey: 'runDate', sortDir: 'desc',
      columns: [
        { key: 'period', label: 'Period' },
        { key: 'people', label: 'People', className: 'num' },
        { key: 'gross', label: 'Gross', className: 'num', render: p => usd0(p.gross) },
        { key: 'taxes', label: 'Taxes & withholding', className: 'num', render: p => usd0(p.taxes) },
        { key: 'net', label: 'Net', className: 'num', render: p => usd0(p.net) },
        { key: 'runDate', label: 'Run date', render: p => shortDate(p.runDate) },
        { key: 'status', label: 'Status', render: p => badge(p.status) },
        { key: 'act', label: '', sortable: false, filter: false,
          render: p => p.status === 'Paid' ? `<button class="btn-mini">Register</button>` : `<button class="btn-mini btn-mini--go" data-run="${p.id}">Review & run</button>` }
      ]
    }),
    MPL: () => mount({
      title: 'Ministry expense lines (MPL)', rows: D.mplLines, sortKey: 'date', sortDir: 'desc',
      columns: [
        { key: 'date', label: 'Date', render: l => shortDate(l.date) },
        { key: 'staff', label: 'Staff', render: l => `<a href="#/people/${l.userId}">${esc(l.staff)}</a>` },
        { key: 'category', label: 'Category' },
        { key: 'account', label: 'Account' },
        { key: 'amount', label: 'Amount', className: 'num', render: l => usd(l.amount) },
        { key: 'receipt', label: 'Receipt', className: 'center', value: l => l.receipt ? 'Yes' : 'No',
          render: l => l.receipt ? '<span style="color:var(--emerald-pine)">✓</span>' : '<span style="color:#a32718">—</span>' },
        { key: 'reconciled', label: 'Reconciled', className: 'center', value: l => l.reconciled ? 'Yes' : 'No',
          render: l => l.reconciled ? badge('Approved', 'approved') : badge('Pending') },
        { key: 'memo', label: 'Memo' }
      ]
    }),
    Transfers: () => mount({
      title: 'Interbank & audit transfers', rows: D.interbankTransfers, columnFilters: false, sortKey: 'initiated', sortDir: 'desc',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'from', label: 'From account' },
        { key: 'to', label: 'To account' },
        { key: 'amount', label: 'Amount (USD)', className: 'num', render: t => usd0(t.amount) },
        { key: 'rate', label: 'FX rate', className: 'num' },
        { key: 'initiated', label: 'Initiated', render: t => shortDate(t.initiated) },
        { key: 'audited', label: 'Audited', className: 'center', value: t => t.audited ? 'Yes' : 'No',
          render: t => t.audited ? badge('Approved', 'approved') : badge('Pending') },
        { key: 'status', label: 'Status', render: t => badge(t.status === 'Settled' ? 'Paid' : t.status === 'In Transit' ? 'In Review' : 'Pending') }
      ]
    }),
    Reimburse: () => mount({
      title: 'Reimbursements', rows: D.requests.filter(r => r.type === 'flex' || r.type === 'transfer'), sortKey: 'submitted', sortDir: 'desc',
      onRowClick: r => { location.hash = '#/requests/' + r.id; },
      columns: [
        { key: 'id', label: 'ID', render: r => `<a href="#/requests/${r.id}">${r.id}</a>` },
        { key: 'requester', label: 'Requester' },
        { key: 'summary', label: 'Reason' },
        { key: 'amount', label: 'Amount', className: 'num', render: r => r.amount == null ? '—' : usd(r.amount) },
        { key: 'department', label: 'Department' },
        { key: 'submitted', label: 'Submitted', render: r => dateTime(r.submitted) },
        { key: 'status', label: 'Status', render: r => badge(r.status) }
      ]
    }),
    Receipts: () => mount({
      title: 'Receipt batches', rows: D.receiptBatches, columnFilters: false, sortKey: 'generated', sortDir: 'desc',
      columns: [
        { key: 'kind', label: 'Kind' },
        { key: 'period', label: 'Period' },
        { key: 'count', label: 'Receipts', className: 'num', render: b => num(b.count) },
        { key: 'amount', label: 'Amount', className: 'num', render: b => usd0(b.amount) },
        { key: 'generated', label: 'Generated', render: b => shortDate(b.generated) },
        { key: 'delivered', label: 'Delivered', className: 'center', value: b => b.delivered ? 'Yes' : 'No',
          render: b => b.delivered ? badge('Sent') : badge('Pending') },
        { key: 'status', label: 'Status', render: b => badge(b.status === 'Generating' ? 'In Review' : b.status) },
        { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Download</button>` }
      ]
    }),
    'Easy Scan': () => mount({
      title: 'Easy Scan queue', rows: D.easyScanQueue, columnFilters: false, sortKey: 'received', sortDir: 'desc',
      columns: [
        { key: 'batch', label: 'Batch' },
        { key: 'type', label: 'Type' },
        { key: 'items', label: 'Items', className: 'num' },
        { key: 'amount', label: 'Amount', className: 'num', render: b => usd0(b.amount) },
        { key: 'operator', label: 'Operator' },
        { key: 'received', label: 'Received', render: b => shortDate(b.received) },
        { key: 'status', label: 'Status',
          render: b => badge(b.status === 'Posted' ? 'Paid' : b.status === 'Exception' ? 'Denied' : 'Pending') },
        { key: 'act', label: '', sortable: false, filter: false,
          render: b => b.status === 'Posted' ? '' : `<button class="btn-mini" data-post="${b.id}">Review & post</button>` }
      ]
    }),
    'QB Customers': () => mount({
      title: 'QuickBooks customers', rows: D.qbCustomers, sortKey: 'ytd', sortDir: 'desc',
      columns: [
        { key: 'name', label: 'Customer' },
        { key: 'qbId', label: 'QB ID' },
        { key: 'balance', label: 'Balance', className: 'num', render: q => usd(q.balance) },
        { key: 'ytd', label: 'YTD', className: 'num', render: q => usd0(q.ytd) },
        { key: 'lastSync', label: 'Last sync', render: q => dateTime(q.lastSync) },
        { key: 'synced', label: 'Synced', className: 'center', value: q => q.synced ? 'Yes' : 'No',
          render: q => q.synced ? badge('Active') : badge('Missing', 'denied') },
        { key: 'issue', label: 'Issue', render: q => q.issue ? `<span style="color:#a32718">${esc(q.issue)}</span>` : '—' }
      ]
    }),
    Reports: () => {
      const byCat = {};
      D.mplLines.forEach(l => (byCat[l.category] = (byCat[l.category] || 0) + l.amount));
      body.innerHTML = `<div class="grid grid--2">
        ${card(`<ul class="timeline">
          ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `
            <li><div class="timeline__body">${esc(c)}</div><span class="timeline__when">${usd0(v)}</span></li>`).join('')}
        </ul>`, { title: 'Ministry expense by category', icon: 'chart' })}
        ${card(`<ul class="timeline">
          ${[['Payroll YTD', usd0(D.sum(D.payrollRuns.filter(p => p.status === 'Paid'), p => p.gross))],
             ['Receipts issued', num(D.sum(D.receiptBatches, b => b.count))],
             ['Interbank moved', usd0(D.sum(D.interbankTransfers, t => t.amount))],
             ['MPL total', usd0(D.sum(D.mplLines, l => l.amount))],
             ['MPL unreconciled', usd0(D.sum(unreconciled, l => l.amount))],
             ['QB records out of sync', num(D.qbCustomers.filter(q => !q.synced).length)]
          ].map(([k, v]) => `<li><div class="timeline__body">${esc(k)}</div><span class="timeline__when">${v}</span></li>`).join('')}
        </ul>`, { title: 'Finance summary', icon: 'bank' })}
      </div>`;
    }
  };

  (tabs[tab] || tabs.Authorize)();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });
  body.addEventListener('click', e => {
    if (e.target.closest('[data-post]')) toast('Batch posted to the ledger');
    if (e.target.closest('[data-run]')) toast('Payroll run opened for review');
  });

  view.querySelector('#authorizeAll').addEventListener('click', () => modal({
    title: 'Authorize all pending financial requests', confirm: 'Authorize',
    body: `<p style="margin-top:0"><strong>${toAuthorise.length}</strong> requests totalling <strong>${usd0(D.sum(toAuthorise, r => r.amount))}</strong>.</p>
      <p class="muted">Every authorisation is written to the audit log against your account.</p>
      <div class="field" style="margin-top:14px"><label>Authorisation note</label><textarea></textarea></div>`,
    onConfirm: () => toast(`${toAuthorise.length} requests authorised`)
  }));
  view.querySelector('#close').addEventListener('click', () => toast('September 2026 closed for posting'));
}
