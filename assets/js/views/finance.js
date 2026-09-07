import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, dateTime, stat, num, modal, toast,
         tabsUrl, textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { APPROVAL_LIMIT, needsDualAuth } from '../policy.js';
import { currentUser } from '../auth.js';

export default function finance(view, { query }) {
  const render = () => finance(view, { query });
  const me = currentUser();
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

    <div id="tabHost"></div>
    <div id="finBody"></div>`;

  const body = view.querySelector('#finBody');
  let table = null;
  const mount = opts => {
    body.innerHTML = '<div id="t"></div>';
    table = new DataTable(Object.assign({ pageSize: 15 }, opts));
    table.mount(body.querySelector('#t'));
    return table;
  };

  const tabPanels = {
    Authorize: () => mount({
      title: 'Authorize (all)', rows: toAuthorise, sortKey: 'submitted', sortDir: 'desc',
      selectable: true,
      onRowClick: r => { location.hash = '#/requests/' + r.id; },
      columns: [
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
          render: p => p.status === 'Paid'
            ? `<button class="btn-mini" data-register="${p.id}">Register</button>`
            : `<button class="btn-mini btn-mini--go" data-run="${p.id}">Review &amp; run</button>` }
      ]
    }),
    MPL: () => {
      body.innerHTML = `<div class="row" style="margin-bottom:12px">
          <button class="btn" id="reconcile">Reconcile selected</button>
          <span class="muted" style="font-size:12.5px">${unreconciled.length} lines unreconciled
            (${usd0(D.sum(unreconciled, l => l.amount))})</span>
        </div><div id="t"></div>`;
      const t = new DataTable({
      title: 'Ministry expense lines (MPL)', rows: D.mplLines, pageSize: 15, selectable: true, sortKey: 'date', sortDir: 'desc',
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
      });
      t.mount(body.querySelector('#t'));
      body.querySelector('#reconcile').addEventListener('click', () => {
        const sel = t.selection();
        if (!sel.length) return toast('Select the lines you have reconciled');
        store.updateMany('mplLines', sel, { reconciled: true });
        toast(`${sel.length} lines reconciled`);
        render();
      });
    },
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
    Receipts: () => {
      body.innerHTML = `<div class="row" style="margin-bottom:12px">
          <button class="btn" id="genEoy">Generate end-of-year receipts</button>
          <button class="btn-mini" id="genWeekly">Generate weekly batch</button>
        </div><div id="t"></div>`;
      const t = new DataTable({
      title: 'Receipt batches', rows: D.receiptBatches, pageSize: 15, columnFilters: false, sortKey: 'generated', sortDir: 'desc',
      columns: [
        { key: 'kind', label: 'Kind' },
        { key: 'period', label: 'Period' },
        { key: 'count', label: 'Receipts', className: 'num', render: b => num(b.count) },
        { key: 'amount', label: 'Amount', className: 'num', render: b => usd0(b.amount) },
        { key: 'generated', label: 'Generated', render: b => shortDate(b.generated) },
        { key: 'delivered', label: 'Delivered', className: 'center', value: b => b.delivered ? 'Yes' : 'No',
          render: b => b.delivered ? badge('Sent') : badge('Pending') },
        { key: 'status', label: 'Status', render: b => badge(b.status === 'Generating' ? 'In Review' : b.status) },
        { key: 'act', label: '', sortable: false, filter: false,
          render: b => `<button class="btn-mini" data-dl="${b.id}">Download</button>` }
      ]
      });
      t.mount(body.querySelector('#t'));
      body.querySelector('#genEoy').addEventListener('click', () => generateReceipts('End of Year'));
      body.querySelector('#genWeekly').addEventListener('click', () => generateReceipts('Weekly'));
    },
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
          render: b => b.status === 'Posted' ? '' : `<button class="btn-mini" data-post="${b.id}">Review &amp; post</button>` }
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
        { key: 'issue', label: 'Issue', render: q => q.issue ? `<span style="color:#a32718">${esc(q.issue)}</span>` : '—' },
        { key: 'act', label: '', sortable: false, filter: false,
          render: q => q.synced ? '' : `<button class="btn-mini" data-sync="${q.id}">Sync now</button>` }
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

  const strip = tabsUrl(TABS, name => (tabPanels[name] || tabPanels.Authorize)(), tab, 'tab');
  view.querySelector('#tabHost').innerHTML = strip.html;
  strip.mount(view);
  (tabPanels[strip.active] || tabPanels.Authorize)();
  body.addEventListener('click', e => {
    const post = e.target.closest('[data-post]');
    if (post) {
      store.update('easyScanQueue', post.dataset.post, { status: 'Posted' });
      toast('Batch posted to the ledger'); return render();
    }
    const sync = e.target.closest('[data-sync]');
    if (sync) {
      store.update('qbCustomers', sync.dataset.sync,
        { synced: true, issue: null, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') });
      toast('Customer synced to QuickBooks'); return render();
    }
    const dl = e.target.closest('[data-dl]');
    if (dl) {
      const b = D.receiptBatches.find(x => String(x.id) === dl.dataset.dl);
      downloadBatch(b); return;
    }
    const run = e.target.closest('[data-run]');
    if (run) return openPayroll(run.dataset.run);
    const reg = e.target.closest('[data-register]');
    if (reg) {
      const p = D.payrollRuns.find(x => String(x.id) === reg.dataset.register);
      const rows = [['Period', 'People', 'Gross', 'Withholding', 'Net', 'Run date'],
        [p.period, p.people, p.gross.toFixed(2), p.taxes.toFixed(2), p.net.toFixed(2), p.runDate]];
      const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `payroll-register-${p.period.replace(/\W+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      toast(`${p.period} payroll register downloaded`);
    }
  });

  /* --- receipt generation — previously impossible anywhere in the portal --- */
  function generateReceipts(kind) {
    const years = [...new Set(D.donations.map(d => d.date.slice(0, 4)))].sort().reverse();
    modal({
      title: kind === 'End of Year' ? 'Generate end-of-year tax receipts' : 'Generate a weekly receipt batch',
      confirm: 'Generate batch',
      body: `${selectField('Period', kind === 'End of Year' ? years : ['This week', 'Last week'])}
        ${selectField('Include', ['Receiptable gifts only', 'All gifts'])}
        <div class="notice notice--warn">Receipts are legal documents. Generating a batch marks
          every included gift as receipted and writes the batch to the audit log.</div>`,
      onConfirm: scrim => {
        const v = readForm(scrim);
        const year = v['Period'];
        const gifts = D.donations.filter(d =>
          d.amount > 0 && !['Refunded', 'Voided'].includes(d.status) &&
          (kind !== 'End of Year' || d.date.startsWith(year)));
        if (!gifts.length) {
          scrim.querySelector('.modal__body').insertAdjacentHTML('afterbegin',
            '<div class="notice notice--stop">No gifts match that period.</div>');
          return false;
        }
        const donors = new Set(gifts.map(g => g.donor));
        store.create('receiptBatches', {
          kind, period: kind === 'End of Year' ? `FY${year}` : v['Period'],
          count: donors.size, amount: D.sum(gifts, g => g.amount),
          generated: new Date().toISOString().slice(0, 10),
          delivered: false, status: 'Generating'
        });
        store.updateMany('donations', gifts.filter(g => !g.receipted).map(g => g.id), { receipted: true });
        toast(`${donors.size} receipts generated covering ${usd0(D.sum(gifts, g => g.amount))}`);
        render();
      }
    });
  }

  function downloadBatch(b) {
    if (!b) return;
    const rows = [['Batch', 'Kind', 'Period', 'Receipts', 'Amount', 'Generated'],
      [b.id, b.kind, b.period, b.count, b.amount, b.generated]];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `receipts-${b.period.replace(/\W+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    toast('Receipt batch downloaded');
  }

  function openPayroll(id) {
    const p = D.payrollRuns.find(x => String(x.id) === String(id));
    if (!p) return;
    modal({
      title: `Payroll — ${p.period}`, confirm: p.status === 'Draft' ? 'Approve and run' : 'Mark paid', wide: true,
      body: `<div class="grid grid--4" style="text-align:center;margin-bottom:14px">
          <div><div class="eyebrow">People</div><div style="font-family:var(--font-display);font-size:28px">${p.people}</div></div>
          <div><div class="eyebrow">Gross</div><div style="font-family:var(--font-display);font-size:28px">${usd0(p.gross)}</div></div>
          <div><div class="eyebrow">Withholding</div><div style="font-family:var(--font-display);font-size:28px">${usd0(p.taxes)}</div></div>
          <div><div class="eyebrow">Net</div><div style="font-family:var(--font-display);font-size:28px">${usd0(p.net)}</div></div>
        </div>
        <div class="notice notice--warn">Running payroll is irreversible from this screen.</div>
        ${textareaField('Run note', {})}`,
      onConfirm: () => {
        store.update('payrollRuns', p.id, { status: p.status === 'Draft' ? 'Pending' : 'Paid' });
        toast(`${p.period} payroll ${p.status === 'Draft' ? 'approved' : 'marked paid'}`);
        render();
      }
    });
  }

  view.querySelector('#authorizeAll').addEventListener('click', () => {
    const picked = (table && table.selection().length)
      ? table.selection().map(id => D.findRequest(id)).filter(Boolean)
      : toAuthorise;
    const usingSelection = !!(table && table.selection().length);
    const limit = APPROVAL_LIMIT[me.role] ?? 0;
    const over = picked.filter(r => r.amount > limit);
    const dual = picked.filter(r => needsDualAuth(r.amount));

    modal({
      title: usingSelection ? `Authorize ${picked.length} selected` : 'Authorize every pending request',
      confirm: 'Authorize',
      body: `<p style="margin-top:0"><strong>${picked.length}</strong> requests totalling
          <strong>${usd0(D.sum(picked, r => r.amount))}</strong>.</p>
        ${usingSelection
          ? '<div class="notice notice--go">Only the rows you selected will be authorised.</div>'
          : '<div class="notice notice--warn">No rows are selected, so this covers <strong>every</strong> pending financial request. Tick rows first to authorise a subset.</div>'}
        ${over.length ? `<div class="notice notice--warn">${over.length} exceed your ${usd0(limit)} limit and will be skipped.</div>` : ''}
        ${dual.length ? `<div class="notice notice--warn">${dual.length} need a second authoriser.</div>` : ''}
        <p class="muted">Every authorisation is written to the audit log against your account.</p>
        ${textareaField('Authorisation note', {})}`,
      onConfirm: scrim => {
        const note = readForm(scrim)['Authorisation note'] || '';
        let ok = 0, skipped = 0, second = 0;
        picked.forEach(r => {
          if (r.amount > limit) { skipped++; return; }
          const next = needsDualAuth(r.amount) ? 'Awaiting 2nd approval' : 'Approved';
          next === 'Approved' ? ok++ : second++;
          store.update('requests', r.id, {
            status: next, approvedBy: me.name,
            thread: [...r.thread, { who: me.name, when: new Date().toISOString().slice(0, 16).replace('T', ' '),
              text: note || 'Authorised from the finance console.' }]
          });
        });
        toast(`${ok} authorised${second ? `, ${second} awaiting 2nd approval` : ''}${skipped ? `, ${skipped} over limit` : ''}`);
        render();
      }
    });
  });

  view.querySelector('#close').addEventListener('click', () => modal({
    title: 'Close the period', confirm: 'Close period',
    body: `<div class="notice notice--warn">Closing a period locks it against further posting.
        Reopening requires an administrator.</div>
      ${selectField('Period', ['September 2026', 'August 2026', 'July 2026'])}
      <p class="muted">Open items in this period:</p>
      <ul style="margin:0;padding-left:18px">
        <li>${toAuthorise.length} requests awaiting authorisation</li>
        <li>${unreconciled.length} unreconciled MPL lines (${usd0(D.sum(unreconciled, l => l.amount))})</li>
        <li>${exceptions.length} Easy Scan exceptions</li>
      </ul>
      ${textareaField('Close-out note', {})}`,
    onConfirm: scrim => {
      const v = readForm(scrim);
      if (toAuthorise.length || exceptions.length) {
        return invalidClose(scrim, toAuthorise.length, exceptions.length);
      }
      toast(`${v['Period']} closed for posting`);
    }
  }));

  function invalidClose(scrim, a, b) {
    const host = scrim.querySelector('.modal__body');
    if (!host.querySelector('.notice--stop')) {
      host.insertAdjacentHTML('afterbegin',
        `<div class="notice notice--stop">Cannot close: ${a} requests are still awaiting authorisation
         and ${b} scan exceptions are unresolved. Clear these first.</div>`);
    }
    return false;
  }
}
