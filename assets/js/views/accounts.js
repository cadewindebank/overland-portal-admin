import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, stat, num, modal, toast } from '../ui.js';
import * as store from '../store.js';

export default function accounts(view) {
  const render = () => accounts(view);
  const rows = D.users.filter(u => u.type === 'Staff').map(u => {
    const gifts = D.donations.filter(d => d.designation === u.name);
    const pendingOut = D.requests.filter(r => r.requesterId === u.id && r.amount != null && ['Pending', 'In Review', 'Approved'].includes(r.status));
    return {
      id: u.id, name: u.name, department: u.department, base: u.base,
      balance: u.balance,
      incoming: D.sum(gifts, g => g.amount),
      committed: D.sum(pendingOut, r => r.amount),
      available: u.balance - D.sum(pendingOut, r => r.amount),
      donors: new Set(gifts.map(g => g.donorId)).size,
      lastGift: gifts.length ? gifts.map(g => g.date).sort().pop() : null,
      health: u.balance < 0 ? 'Denied' : (u.balance < 2500 ? 'Expiring' : 'Current')
    };
  });

  const negative = rows.filter(r => r.balance < 0);

  view.innerHTML = `
    ${pageHead({
      title: 'Accounts & Balances',
      sub: 'Ministry partner development balances per staff account, and what is already committed against them.',
      actions: `<button class="btn-mini" id="statements">${icon('file')} Send statements</button>
                <button class="btn" id="disburse">Run disbursement</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Total on account', value: usd0(D.sum(rows, r => r.balance)), accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Committed', value: usd0(D.sum(rows, r => r.committed)), accent: 'var(--sap)', meta: 'Approved but not yet paid' })}
      ${stat({ label: 'Available', value: usd0(D.sum(rows, r => r.available)), accent: 'var(--rain)' })}
      ${stat({ label: 'Accounts in deficit', value: num(negative.length), accent: 'var(--flare)',
               meta: negative.length ? usd0(D.sum(negative, r => r.balance)) : 'None' })}
    </div>

    ${negative.length ? card(`
      <ul class="timeline">
        ${negative.slice(0, 6).map(r => `<li>
          <span class="timeline__icon">${icon('alert')}</span>
          <div class="timeline__body"><a href="#/people/${r.id}"><strong>${esc(r.name)}</strong></a>
            <div class="muted" style="font-size:12px">${esc(r.department)} · ${esc(r.base)}</div></div>
          <span class="timeline__when" style="color:#a32718">${usd(r.balance)}</span>
        </li>`).join('')}
      </ul>`, { title: 'Accounts needing attention', icon: 'alert' }) : ''}

    <div style="margin-top:18px" id="accTable"></div>`;

  const dt = new DataTable({
    title: 'Support accounts', rows, pageSize: 25, sortKey: 'balance', sortDir: 'asc',
    onRowClick: r => { location.hash = '#/people/' + r.id; },
    columns: [
      { key: 'name', label: 'Staff', render: r => `<a href="#/people/${r.id}">${esc(r.name)}</a>` },
      { key: 'department', label: 'Department' },
      { key: 'base', label: 'Base' },
      { key: 'incoming', label: 'Incoming (lifetime)', className: 'num', render: r => usd0(r.incoming) },
      { key: 'donors', label: 'Donors', className: 'num' },
      { key: 'balance', label: 'Balance', className: 'num',
        render: r => `<strong style="color:${r.balance < 0 ? '#a32718' : 'inherit'}">${usd(r.balance)}</strong>` },
      { key: 'committed', label: 'Committed', className: 'num', render: r => usd0(r.committed) },
      { key: 'available', label: 'Available', className: 'num', render: r => usd0(r.available) },
      { key: 'lastGift', label: 'Last gift', render: r => r.lastGift ? shortDate(r.lastGift) : '—' },
      { key: 'health', label: 'Health', render: r => badge(r.health === 'Denied' ? 'Denied' : r.health) }
    ]
  }).mount(view.querySelector('#accTable'));

  view.querySelector('#statements').addEventListener('click', () => modal({
    title: 'Send monthly statements', confirm: 'Send statements',
    body: `<p style="margin-top:0">${rows.length} staff accounts will receive a statement for
        ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>
      ${rows.filter(r => r.balance < 0).length
        ? `<div class="notice notice--warn">${rows.filter(r => r.balance < 0).length} accounts are in deficit
           and their statement will show a negative balance.</div>` : ''}`,
    onConfirm: () => toast(`${rows.length} statements queued`)
  }));
  view.querySelector('#disburse').addEventListener('click', () => modal({
    title: 'Run a disbursement', confirm: 'Run disbursement',
    body: `<p class="muted" style="margin-top:0">This will pay out every approved MPD and flex pay request against available balances.</p>
      <div class="form-grid form-grid--2">
        <div class="field"><label>Pay period</label><select><option>September 2026</option><option>August 2026</option></select></div>
        <div class="field"><label>Payment date</label><input type="date"></div>
      </div>
      <div class="hr"></div>
      <div class="row row--between"><span>Requests included</span><strong>${D.requests.filter(r => r.status === 'Approved' && r.amount).length}</strong></div>
      <div class="row row--between"><span>Total to disburse</span><strong>${usd0(D.sum(D.requests.filter(r => r.status === 'Approved' && r.amount), r => r.amount))}</strong></div>`,
    onConfirm: () => {
      const approved = D.requests.filter(r => r.status === 'Approved' && r.amount);
      if (!approved.length) return toast('Nothing is approved and waiting to be paid');
      store.updateMany('requests', approved.map(r => r.id), { status: 'Paid' });
      approved.forEach(r => {
        const u = D.findUser(r.requesterId);
        if (u) store.update('users', u.id, { balance: u.balance - r.amount }, { silent: true });
      });
      toast(`${approved.length} requests paid, ${usd0(D.sum(approved, r => r.amount))} disbursed`);
      render();
    }
  }));
  void dt;
}
