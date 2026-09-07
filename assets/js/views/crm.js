import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd0, shortDate, stat, num, modal, toast,
         textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { currentUser } from '../auth.js';

export default function crm(view, { query }) {
  const render = () => crm(view, { query });
  const me = currentUser();
  const bucket = query.get('bucket') || 'All';
  const owner = query.get('owner');
  let rows = bucket === 'All' ? D.contacts : D.contactsIn(bucket);
  if (owner) rows = rows.filter(c => c.owner === owner);

  view.innerHTML = `
    ${pageHead({
      title: 'CRM — Contacts',
      sub: owner
        ? `Contacts owned by ${owner}.`
        : 'Every relationship Overland tracks, in the six buckets from the mind map: recruiting, MPD, church network, personal, ministry and staff.',
      actions: `${owner ? `<a class="btn-mini" href="#/crm">Clear owner filter</a>` : ''}
                <a class="btn-mini" href="#/reminders">${icon('bell')} Reminders &amp; events</a>
                <button class="btn-mini" id="quickNote">${icon('edit')} Add quick note</button>
                <button class="btn" id="addContact">Add contact</button>`
    })}

    <div class="grid grid--3" style="margin-bottom:18px;gap:12px">
      ${['All', ...D.CONTACT_BUCKETS].map(b => {
        const n = b === 'All' ? D.contacts.length : D.contactsIn(b).length;
        const value = b === 'All' ? D.sum(D.contacts, c => c.lifetime) : D.sum(D.contactsIn(b), c => c.lifetime);
        return `<a href="#/crm?bucket=${encodeURIComponent(b)}" class="card" style="text-decoration:none;color:inherit;padding:14px 16px;${
          b === bucket ? 'border-color:var(--flare);box-shadow:inset 3px 0 0 var(--flare)' : ''}">
          <div class="row row--between">
            <div><div style="font-weight:500">${esc(b)}</div>
              <div class="muted" style="font-size:12px">${usd0(value)} lifetime</div></div>
            <div style="font-family:var(--font-display);font-size:26px;line-height:1">${num(n)}</div>
          </div></a>`;
      }).join('')}
    </div>

    <div class="grid grid--main" style="margin-bottom:18px">
      ${card(`<div id="contactTable"></div>`, {
        title: bucket === 'All' ? 'All contacts' : bucket + ' contacts', icon: 'people'
      })}
      <div class="stack">
        ${card(`<ul class="timeline">
          ${D.CONTACT_STAGES.map(s => {
            const n = rows.filter(c => c.stage === s).length;
            const w = rows.length ? Math.round(n / rows.length * 100) : 0;
            return `<li style="display:block;padding:8px 0">
              <div class="row row--between" style="font-size:13px"><span>${esc(s)}</span><span class="muted">${n}</span></div>
              <div class="progress" style="margin-top:5px"><i style="width:${w}%"></i></div></li>`;
          }).join('')}
        </ul>`, { title: 'Pipeline', icon: 'chart' })}

        ${card(`<ul class="timeline">
          ${D.openReminders().filter(r => r.past).slice(0, 6).map(r => `<li>
            <span class="timeline__icon">${icon('clock')}</span>
            <div class="timeline__body"><strong>${esc(r.title)}</strong>
              <div class="muted" style="font-size:12px">${esc(r.contact)} · ${esc(r.channel)}</div></div>
            <span class="timeline__when" style="color:#a32718">${shortDate(r.due)}</span></li>`).join('')
            || '<li><div class="timeline__body muted">Nothing overdue.</div></li>'}
        </ul>`, { title: 'Overdue reminders', icon: 'bell',
          actions: `<a class="btn-mini" href="#/reminders">All</a>` })}
      </div>
    </div>`;

  new DataTable({
    hideTitle: true, title: 'CRM contacts', rows, pageSize: 25, sortKey: 'lastTouch', sortDir: 'desc',
    onRowClick: c => { location.hash = '#/crm/' + c.id; },
    columns: [
      { key: 'name', label: 'Contact', render: c =>
        `<a href="#/crm/${c.id}" style="display:flex;align-items:center;gap:9px">${avatar(c.name, 'avatar--sm')}<span>${esc(c.name)}</span></a>` },
      { key: 'bucket', label: 'Bucket' },
      { key: 'stage', label: 'Stage', render: c => badge(c.stage, stageKind(c.stage)) },
      { key: 'owner', label: 'Owner' },
      { key: 'church', label: 'Church' },
      { key: 'location', label: 'Location', value: c => `${c.city}, ${c.region}`, render: c => esc(`${c.city}, ${c.region}`) },
      { key: 'lifetime', label: 'Lifetime giving', className: 'num', render: c => c.lifetime ? usd0(c.lifetime) : '—' },
      { key: 'lastGift', label: 'Last gift', render: c => c.lastGift ? shortDate(c.lastGift) : '—' },
      { key: 'score', label: 'Score', className: 'num' },
      { key: 'lastTouch', label: 'Last touch', render: c => shortDate(c.lastTouch) }
    ]
  }).mount(view.querySelector('#contactTable'));

  view.querySelector('#addContact').addEventListener('click', () => modal({
    title: 'Add a contact', confirm: 'Add contact', wide: true,
    body: `<div class="form-grid">
      ${textField('First name')}
      ${textField('Last name')}
      ${selectField('Bucket', D.CONTACT_BUCKETS)}
      ${textField('Email', { type: 'email', span: 2 })}
      ${textField('Phone')}
      ${textField('City')}
      ${textField('State/Region')}
      ${textField('Church')}
      ${textareaField('How you met', { span: 3 })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['First name', 'Last name']);
      if (v === false) return false;
      const row = store.create('contacts', {
        name: `${v['First name']} ${v['Last name']}`, first: v['First name'], last: v['Last name'],
        email: v['Email'] || '', phone: v['Phone'] || '', bucket: v['Bucket'], owner: me.name,
        city: v['City'] || '—', region: v['State/Region'] || '—', country: '—',
        church: v['Church'] || '—', birthday: '', stage: 'New', score: 20,
        lifetime: 0, lastGift: null, lapsed: false, recurring: false,
        lastTouch: new Date().toISOString().slice(0, 10),
        tags: [v['Bucket']], notes: 0, relationships: null,
        howWeMet: v['How you met'] || ''
      });
      toast('Contact added');
      location.hash = '#/crm/' + row.id;
    }
  }));
  view.querySelector('#quickNote').addEventListener('click', () => modal({
    title: 'Add a quick note', confirm: 'Save note',
    body: `<div class="stack">
      ${textField('Contact', { list: 'cl', placeholder: 'Search contacts' })}
      <datalist id="cl">${D.contacts.slice(0, 120).map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
      ${textareaField('Note', { style: 'min-height:120px', placeholder: 'What was said, what happens next.' })}
      ${textField('Set a reminder', { type: 'date' })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Contact', 'Note']);
      if (v === false) return false;
      const c = D.contacts.find(x => x.name === v['Contact']);
      if (!c) {
        scrim.querySelector('.modal__body').insertAdjacentHTML('afterbegin',
          '<div class="notice notice--stop">No contact with that name.</div>');
        return false;
      }
      store.update('contacts', c.id, {
        notes: (c.notes || 0) + 1,
        lastTouch: new Date().toISOString().slice(0, 10),
        timeline: [...(c.timeline || []), { when: new Date().toISOString().slice(0, 10), text: v['Note'], who: me.name }]
      });
      if (v['Set a reminder']) {
        store.create('reminders', {
          title: 'Follow up: ' + v['Note'].slice(0, 40), contact: c.name, contactId: c.id,
          owner: me.name, due: v['Set a reminder'], past: false, channel: 'Call', status: 'Open'
        });
      }
      toast('Note saved' + (v['Set a reminder'] ? ' and reminder set' : ''));
      render();
    }
  }));
}

export const stageKind = s => ({
  New: 'draft', Contacted: 'review', 'Meeting Set': 'review',
  Committed: 'approved', Giving: 'paid', Lapsed: 'pending', Cold: 'denied'
}[s] || 'draft');
