import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, stat, num, barChart, modal, toast,
         textField, selectField, requireFields } from '../ui.js';
import * as store from '../store.js';

export default function donations(view) {
  const render = () => donations(view);
  const ytd = D.donations.filter(d => d.date >= '2026-01-01');
  const recurring = D.donations.filter(d => d.recurring);
  const unreceipted = D.donations.filter(d => !d.receipted);
  const byFund = {};
  D.donations.forEach(d => (byFund[d.fund] = (byFund[d.fund] || 0) + d.amount));

  view.innerHTML = `
    ${pageHead({
      title: 'Donations',
      sub: 'All incoming funds — gifts, internal transactions, adjustments and refunds.',
      actions: `<button class="btn-mini" id="receiptBtn">${icon('file')} Issue receipts</button>
                <button class="btn" id="recordBtn">Record a gift</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Giving YTD', value: usd0(D.sum(ytd, d => d.amount)), accent: 'var(--emerald-pine)', meta: `${num(ytd.length)} gifts` })}
      ${stat({ label: 'Average gift', value: usd0(D.sum(ytd, d => d.amount) / Math.max(1, ytd.length)), accent: 'var(--rain)' })}
      ${stat({ label: 'Recurring donors', value: num(new Set(recurring.map(d => d.donorId)).size), accent: 'var(--flare)',
               meta: `${usd0(D.sum(recurring, d => d.amount))} lifetime` })}
      ${stat({ label: 'Unreceipted', value: num(unreceipted.length), accent: 'var(--sap)', meta: usd0(D.sum(unreceipted, d => d.amount)) })}
      ${stat({ label: 'Refunds', value: num(D.donations.filter(d => d.type === 'Refund').length), accent: 'var(--bark)' })}
    </div>

    <div class="grid grid--main" style="margin-bottom:18px">
      ${card(barChart(D.givingByMonth), { title: 'Monthly giving', icon: 'chart' })}
      ${card(`<ul class="timeline">
        ${Object.entries(byFund).sort((a, b) => b[1] - a[1]).map(([f, v]) => `
          <li><div class="timeline__body"><strong>${esc(f)}</strong></div>
              <span class="timeline__when">${usd0(v)}</span></li>`).join('')}
      </ul>`, { title: 'By fund', icon: 'give' })}
    </div>

    <div id="donTable"></div>`;

  const dt = new DataTable({
    title: 'Incoming funds', rows: D.donations, pageSize: 25, sortKey: 'date', sortDir: 'desc',
    onRowClick: d => { location.hash = '#/donations/' + d.id; },
    columns: [
      { key: 'date', label: 'Transaction date', render: d => `<a href="#/donations/${d.id}">${shortDate(d.date)}</a>` },
      { key: 'amount', label: 'Amount', className: 'num', render: d => usd(d.amount) },
      { key: 'type', label: 'Type' },
      { key: 'fund', label: 'Fund' },
      { key: 'method', label: 'Method' },
      { key: 'repCode', label: 'Rep' },
      { key: 'donor', label: 'Donor', render: d => {
          const c = D.contacts.find(x => x.name === d.donor);
          return `<a class="rowlink" href="${c ? '#/crm/' + c.id : '#/people/' + d.donorId}">${esc(d.donor)}</a>`;
        } },
      { key: 'designation', label: 'Designation' },
      { key: 'recurring', label: 'Recurring', className: 'center', value: d => d.recurring ? 'Yes' : 'No', render: d => d.recurring ? badge('Active') : '—' },
      { key: 'receipted', label: 'Receipt', className: 'center', value: d => d.receipted ? 'Sent' : 'Pending', render: d => badge(d.receipted ? 'Sent' : 'Pending') },
      { key: 'memo', label: 'Memo' }
    ]
  }).mount(view.querySelector('#donTable'));

  view.querySelector('#receiptBtn').addEventListener('click', () => {
    if (!unreceipted.length) return toast('Every gift already has a receipt');
    modal({
      title: `Issue ${unreceipted.length} receipts`, confirm: 'Issue receipts',
      body: `<p style="margin-top:0">Covering ${usd0(D.sum(unreceipted, d => d.amount))} across
        ${new Set(unreceipted.map(d => d.donor)).size} donors.</p>
        <div class="notice notice--warn">Receipts are legal documents. This marks each gift receipted.</div>`,
      onConfirm: () => {
        store.updateMany('donations', unreceipted.map(d => d.id), { receipted: true });
        toast(`${unreceipted.length} receipts issued`);
        render();
      }
    });
  });
  view.querySelector('#recordBtn').addEventListener('click', () => modal({
    title: 'Record a gift', confirm: 'Record gift', wide: true,
    body: `<div class="form-grid">
      ${textField('Donor', { list: 'dl', placeholder: 'Search donors' })}
      <datalist id="dl">${D.contacts.slice(0, 120).map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
      ${textField('Amount (USD)', { type: 'number', placeholder: '250.00' })}
      ${textField('Date received', { type: 'date' })}
      ${selectField('Method', ['Check','ACH','Wire','Stock','DAF','MasterCard','Visa'])}
      ${selectField('Fund', ['General Fund','Staff Support','Expedition Fund','Base Development','Medical Outreach','Aviation','Water Projects'])}
      ${textField('Designation', { placeholder: 'Staff name or project' })}
      ${textField('Memo', { placeholder: "Appears on the donor's receipt", span: 3 })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Donor', 'Amount (USD)', 'Date received']);
      if (v === false) return false;
      const amt = Number(v['Amount (USD)']);
      if (!(amt > 0)) {
        scrim.querySelector('.modal__body').insertAdjacentHTML('afterbegin',
          '<div class="notice notice--stop">Enter an amount greater than zero.</div>');
        return false;
      }
      const c = D.contacts.find(x => x.name === v['Donor']);
      const u = D.users.find(x => x.name === v['Donor']);
      const row = store.create('donations', {
        date: v['Date received'], amount: amt, type: 'Donation',
        fund: v['Fund'], method: v['Method'], recurring: false,
        donor: v['Donor'], donorId: u ? u.id : (c ? c.id : null),
        rep: v['Designation'] || '\u2014', repCode: 'A' + Math.floor(1000 + Math.random() * 4000),
        designation: v['Designation'] || v['Fund'], receipted: true,
        memo: v['Memo'] || '', status: 'Posted'
      });
      if (c) store.update('contacts', c.id, {
        lifetime: (c.lifetime || 0) + amt, lastGift: v['Date received'], lapsed: false,
        stage: 'Giving'
      }, { silent: true });
      toast('Gift recorded and receipt queued');
      location.hash = '#/donations/' + row.id;
    }
  }));
  void dt;
}
