import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, badge, esc, usd, usd0, shortDate, deflist, modal, toast,
         textareaField, textField, selectField, requireFields, readForm, avatar } from '../ui.js';
import * as store from '../store.js';
import { currentUser, can } from '../auth.js';

/* A single gift: the record a finance operator needs to refund, adjust or
   re-receipt. Previously donations could only be seen in a table row. */
export default function donation(view, { params }) {
  const render = () => donation(view, { params });
  const g = D.donations.find(d => String(d.id) === String(params[0]));
  if (!g) { view.innerHTML = `<div class="card">${esc('No such donation: ' + params[0])}</div>`; return; }

  const me = currentUser();
  const donorUser = D.findUser(g.donorId);
  const contact = D.contacts.find(c => c.name === g.donor);
  const related = D.donations.filter(d => d.donor === g.donor && d.id !== g.id);
  const lifetime = D.sum(D.donations.filter(d => d.donor === g.donor), d => d.amount);
  const voided = ['Refunded', 'Voided'].includes(g.status);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'Donations', href: '#/donations' }, { label: g.id }],
      title: usd(g.amount),
      sub: `${esc(g.type)} from ${esc(g.donor)} · ${shortDate(g.date)} · ${esc(g.method)}`,
      actions: `${voided ? `<span class="muted" style="font-size:12.5px">${esc(g.status)}</span>`
        : `<button class="btn-mini" id="receipt">${icon('file')} Re-issue receipt</button>
           <button class="btn-mini" id="adjust">Adjust</button>
           <button class="btn-mini btn-mini--danger" id="refund"${can('giving.refund') ? '' : ' disabled'}>Refund</button>`}`
    })}

    ${voided ? `<div class="notice notice--stop">This gift was ${g.status.toLowerCase()}
      ${g.voidedBy ? `by ${esc(g.voidedBy)}` : ''}${g.voidReason ? ` — ${esc(g.voidReason)}` : ''}.</div>` : ''}

    <div class="grid grid--main">
      <div class="stack">
        ${card(deflist([
          ['Amount', `<strong>${usd(g.amount)}</strong>`],
          ['Received', shortDate(g.date)],
          ['Type', esc(g.type)],
          ['Fund', esc(g.fund)],
          ['Method', esc(g.method)],
          ['Recurring', g.recurring ? badge('Active') : '—'],
          ['Designation', esc(g.designation)],
          ['Rep code', esc(g.repCode)],
          ['Receipt', g.receipted ? badge('Sent') : badge('Pending')],
          ['Memo', esc(g.memo)],
          ['Status', badge(voided ? 'Denied' : 'Paid')]
        ]), { title: 'Gift', icon: 'give' })}

        ${card(related.length ? `<div class="dt__scroll"><table class="dt__table">
          <thead><tr><th scope="col">Date</th><th scope="col" class="num">Amount</th>
            <th scope="col">Fund</th><th scope="col">Method</th></tr></thead>
          <tbody>${related.slice(0, 10).map(d => `<tr>
            <td><a href="#/donations/${d.id}">${shortDate(d.date)}</a></td>
            <td class="num">${usd(d.amount)}</td><td>${esc(d.fund)}</td><td>${esc(d.method)}</td></tr>`).join('')}
          </tbody></table></div>`
          : '<p class="muted" style="margin:0">This is the only gift from this donor.</p>',
          { title: `Other gifts from ${esc(g.donor)}`, icon: 'history' })}
      </div>

      <div class="stack">
        ${card(`
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            ${avatar(g.donor, 'avatar--lg')}
            <div><div style="font-weight:600">${esc(g.donor)}</div>
              <div class="muted" style="font-size:12.5px">${usd0(lifetime)} lifetime</div></div>
          </div>
          <div class="stack" style="gap:8px">
            ${contact ? `<a class="btn-mini w-100" style="justify-content:center" href="#/crm/${contact.id}">Open CRM contact</a>` : ''}
            ${donorUser ? `<a class="btn-mini w-100" style="justify-content:center" href="#/people/${donorUser.id}">Open portal account</a>` : ''}
            ${!contact && !donorUser ? '<p class="muted" style="margin:0;font-size:12.5px">No linked CRM contact.</p>' : ''}
          </div>`, { title: 'Donor', icon: 'person' })}

        ${card(`<ul class="timeline">
          ${(g.history || [{ when: g.date, text: 'Gift recorded' }]).map(h => `<li>
            <span class="timeline__icon">${icon('history')}</span>
            <div class="timeline__body">${esc(h.text)}${h.who ? `<div class="muted" style="font-size:12px">${esc(h.who)}</div>` : ''}</div>
            <span class="timeline__when">${shortDate(h.when)}</span></li>`).join('')}
        </ul>`, { title: 'History', icon: 'history' })}
      </div>
    </div>`;

  const stamp = () => new Date().toISOString().slice(0, 10);
  const push = (text) => [...(g.history || [{ when: g.date, text: 'Gift recorded' }]),
    { when: stamp(), text, who: me.name }];

  const $ = s => view.querySelector(s);

  if ($('#refund')) $('#refund').addEventListener('click', () => modal({
    title: `Refund ${usd(g.amount)}`, confirm: 'Refund this gift',
    body: `<div class="notice notice--stop">A refund reverses the gift and withdraws the receipt.
      This is written to the audit log against your account.</div>
      ${selectField('Refund type', ['Full refund', 'Void (never settled)'])}
      ${textareaField('Reason', { placeholder: 'Why this gift is being reversed.' })}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Reason']);
      if (v === false) return false;
      const kind = readForm(scrim)['Refund type'] === 'Void (never settled)' ? 'Voided' : 'Refunded';
      store.update('donations', g.id, {
        status: kind, receipted: false, voidedBy: me.name, voidReason: v['Reason'],
        history: push(`${kind} — ${v['Reason']}`)
      });
      store.create('donations', {
        date: stamp(), amount: -g.amount, type: 'Refund', fund: g.fund, method: g.method,
        recurring: false, donor: g.donor, donorId: g.donorId, rep: g.rep, repCode: g.repCode,
        designation: g.designation, receipted: false,
        memo: `Reversal of ${g.id}`, status: 'Posted'
      });
      toast(`${kind} — a reversing entry was posted`);
      render();
    }
  }));

  if ($('#adjust')) $('#adjust').addEventListener('click', () => modal({
    title: 'Adjust gift ' + g.id, confirm: 'Save adjustment',
    body: `${textField('Amount', { type: 'number', value: g.amount })}
      ${selectField('Fund', ['General Fund','Staff Support','Expedition Fund','Base Development','Medical Outreach','Aviation','Water Projects'], { value: g.fund })}
      ${textField('Designation', { value: g.designation })}
      ${textareaField('Reason for the adjustment', {})}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Amount', 'Reason for the adjustment']);
      if (v === false) return false;
      store.update('donations', g.id, {
        amount: Number(v['Amount']), fund: v['Fund'], designation: v['Designation'],
        history: push(`Adjusted to ${usd(Number(v['Amount']))} — ${v['Reason for the adjustment']}`)
      });
      toast('Gift adjusted');
      render();
    }
  }));

  if ($('#receipt')) $('#receipt').addEventListener('click', () => {
    store.update('donations', g.id, { receipted: true, history: push('Receipt re-issued') });
    toast(`Receipt re-issued to ${g.donor}`);
    render();
  });
}
