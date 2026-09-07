import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, deflist, badge, esc, avatar, usd, usd0, shortDate, DataTable, modal, toast, relative, num,
         textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { stageKind } from './crm.js';

export default function contact(view, { params }) {
  const render = () => contact(view, { params });
  const c = D.findContact(params[0]);
  if (!c) { view.innerHTML = `<div class="card">${esc('No such contact: ' + params[0])}</div>`; return; }

  const gifts = D.donations.filter(d => d.donor === c.name);
  const rems = D.reminders.filter(r => r.contactId === c.id);
  const su = D.signups.filter(s => s.contactId === c.id);

  const activity = [
    ...rems.map(r => ({ when: r.due, kind: 'bell', text: `Reminder — ${r.title}`, meta: r.channel })),
    ...gifts.slice(0, 6).map(g => ({ when: g.date, kind: 'give', text: `Gave ${usd(g.amount)} to ${g.fund}`, meta: g.method })),
    ...su.map(s => ({ when: s.created, kind: 'clipboard', text: `Signed up for ${s.target}`, meta: s.source })),
    { when: c.lastTouch, kind: 'person', text: 'Last recorded touch', meta: c.owner }
  ].sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 12);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'CRM', href: '#/crm' }, { label: c.bucket, href: '#/crm?bucket=' + encodeURIComponent(c.bucket) }, { label: c.name }],
      title: c.name,
      sub: `${esc(c.bucket)} · owned by ${esc(c.owner)} · ${esc(c.city)}, ${esc(c.region)}`,
      actions: `<button class="btn-mini" id="note">${icon('edit')} Add note</button>
                <button class="btn-mini" id="remind">${icon('bell')} Set reminder</button>
                <button class="btn" id="ask">Log an ask</button>`
    })}

    <div class="grid grid--main">
      <div class="stack">
        ${card(`<ul class="timeline">
          ${activity.map(a => `<li>
            <span class="timeline__icon">${icon(a.kind)}</span>
            <div class="timeline__body"><div>${esc(a.text)}</div>
              <div class="muted" style="font-size:12px">${esc(a.meta || '')}</div></div>
            <span class="timeline__when">${shortDate(a.when)}</span></li>`).join('')}
        </ul>`, { title: 'Activity log', icon: 'history' })}

        ${card(gifts.length ? '<div id="giftT"></div>'
          : '<p class="muted" style="margin:0">No giving recorded against this contact.</p>',
          { title: `Giving history — ${usd0(c.lifetime)} lifetime`, icon: 'give' })}

        ${card(rems.length ? `<ul class="timeline">
          ${rems.map(r => `<li>
            <span class="timeline__icon">${icon('clock')}</span>
            <div class="timeline__body"><strong>${esc(r.title)}</strong>
              <div class="muted" style="font-size:12px">${esc(r.channel)} · ${esc(r.owner)}</div></div>
            <span class="timeline__when" style="color:${r.past && r.status === 'Open' ? '#a32718' : 'inherit'}">${shortDate(r.due)}</span></li>`).join('')}
        </ul>` : '<p class="muted" style="margin:0">No reminders set.</p>',
        { title: 'Reminders & tasks', icon: 'bell' })}
      </div>

      <div class="stack">
        ${card(`
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
            ${avatar(c.name, 'avatar--lg')}
            <div><div style="font-weight:600">${esc(c.name)}</div>
              <div style="margin-top:4px">${badge(c.stage, stageKind(c.stage))}</div></div>
          </div>
          ${deflist([
            ['Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
            ['Phone', esc(c.phone)],
            ['Bucket', esc(c.bucket)],
            ['Owner', esc(c.owner)],
            ['Church', esc(c.church)],
            ['Lead score', `<strong>${c.score}</strong> / 100`]
          ])}`, { title: 'Contact', icon: 'person' })}

        ${card(deflist([
          ['Location', esc(`${c.city}, ${c.region}, ${c.country}`)],
          ['Birthday', esc(c.birthday)],
          ['Recurring giver', c.recurring ? badge('Active') : '—'],
          ['Last gift', c.lastGift ? shortDate(c.lastGift) : '—'],
          ['Status', c.lapsed ? badge('Lapsed', 'pending') : badge('Active')]
        ]), { title: 'Demographics', icon: 'chart' })}

        ${card(`
          <div class="row" style="gap:6px;margin-bottom:12px">
            ${c.tags.map(t => `<span class="badge badge--role">${esc(t)}</span>`).join('')}
          </div>
          ${c.relationships ? `<div class="muted" style="font-size:13px">${icon('people')} ${esc(c.relationships)}</div>`
            : '<div class="muted" style="font-size:13px">No linked relationships.</div>'}
          <button class="btn-mini w-100" style="margin-top:12px;justify-content:center" id="link">${icon('plus')} Link a relationship</button>`,
          { title: 'Tags & relationships', icon: 'grid' })}
      </div>
    </div>`;

  if (gifts.length) new DataTable({
    hideTitle: true, title: `${c.name} — giving`, rows: gifts, pageSize: 8, columnFilters: false, sortKey: 'date', sortDir: 'desc',
    columns: [
      { key: 'date', label: 'Date', render: g => shortDate(g.date) },
      { key: 'amount', label: 'Amount', className: 'num', render: g => usd(g.amount) },
      { key: 'fund', label: 'Fund' },
      { key: 'method', label: 'Method' },
      { key: 'memo', label: 'Memo' }
    ]
  }).mount(view.querySelector('#giftT'));

  view.querySelector('#note').addEventListener('click', () => modal({
    title: 'Add a note', confirm: 'Save note',
    body: textareaField('Note', { style: 'min-height:130px' }),
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Note']);
      if (v === false) return false;
      store.update('contacts', c.id, {
        notes: (c.notes || 0) + 1,
        lastTouch: new Date().toISOString().slice(0, 10),
        timeline: [...(c.timeline || []), { when: new Date().toISOString().slice(0, 10), text: v['Note'], who: 'You' }]
      });
      toast('Note added to the activity log');
      render();
    }
  }));
  view.querySelector('#remind').addEventListener('click', () => modal({
    title: 'Set a reminder', confirm: 'Set reminder',
    body: `<div class="stack">
      ${textField('What', { placeholder: 'Follow up on the partnership ask' })}
      <div class="form-grid form-grid--2">
        ${textField('When', { type: 'date' })}
        ${selectField('Channel', ['Call', 'Email', 'Text', 'In person'])}
      </div></div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['What', 'When']);
      if (v === false) return false;
      store.create('reminders', {
        title: v['What'], contact: c.name, contactId: c.id, owner: 'You',
        due: v['When'], past: v['When'] < '2026-09-07', channel: v['Channel'], status: 'Open'
      });
      toast('Reminder set');
      render();
    }
  }));
  view.querySelector('#ask').addEventListener('click', () => modal({
    title: 'Log an ask', confirm: 'Log ask',
    body: `${textField('Amount asked for', { type: 'number', placeholder: '250' })}
      ${selectField('Frequency', ['Monthly', 'One-time'])}
      ${selectField('Outcome', ['Awaiting reply', 'Committed', 'Declined', 'Asked to follow up'])}
      ${textareaField('What was said', {})}`,
    onConfirm: scrim => {
      const v = readForm(scrim);
      const stage = v['Outcome'] === 'Committed' ? 'Committed'
        : v['Outcome'] === 'Declined' ? 'Cold' : 'Meeting Set';
      store.update('contacts', c.id, {
        stage, lastTouch: new Date().toISOString().slice(0, 10),
        timeline: [...(c.timeline || []), { when: new Date().toISOString().slice(0, 10),
          text: `Ask: ${v['Amount asked for'] || '—'} ${v['Frequency']} — ${v['Outcome']}. ${v['What was said'] || ''}`.trim(),
          who: 'You' }]
      });
      toast('Ask logged against ' + c.name);
      render();
    }
  }));
  view.querySelector('#link').addEventListener('click', () => modal({
    title: 'Link a relationship', confirm: 'Link',
    body: `${textField('Related contact', { list: 'relList', placeholder: 'Search contacts' })}
      <datalist id="relList">${D.contacts.slice(0, 120).map(x => `<option value="${esc(x.name)}">`).join('')}</datalist>
      ${selectField('Relationship', ['Spouse', 'Parent', 'Child', 'Sibling', 'Colleague', 'Referred by', 'Same church'])}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Related contact']);
      if (v === false) return false;
      store.update('contacts', c.id, { relationships: `${v['Relationship']} of ${v['Related contact']}` });
      toast('Relationship linked');
      render();
    }
  }));
  void num;
}
