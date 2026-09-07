import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd0, shortDate, stat, num, modal, toast } from '../ui.js';

export default function crm(view, { query }) {
  const bucket = query.get('bucket') || 'All';
  const rows = bucket === 'All' ? D.contacts : D.contactsIn(bucket);

  view.innerHTML = `
    ${pageHead({
      title: 'CRM — Contacts',
      sub: 'Every relationship Overland tracks, in the six buckets from the mind map: recruiting, MPD, church network, personal, ministry and staff.',
      actions: `<button class="btn-mini" id="quickNote">${icon('edit')} Add quick note</button>
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
          actions: `<a class="btn-mini" href="#/crm-activity">All</a>` })}
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
      <div class="field"><label>First name</label><input></div>
      <div class="field"><label>Last name</label><input></div>
      <div class="field"><label>Bucket</label><select>${D.CONTACT_BUCKETS.map(b => `<option>${b}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Email</label><input type="email"></div>
      <div class="field"><label>Phone</label><input></div>
      <div class="field"><label>City</label><input></div>
      <div class="field"><label>State/Region</label><input></div>
      <div class="field"><label>Church</label><input></div>
      <div class="field span-3"><label>How you met</label><textarea></textarea></div>
    </div>`,
    onConfirm: () => toast('Contact added')
  }));
  view.querySelector('#quickNote').addEventListener('click', () => modal({
    title: 'Add a quick note', confirm: 'Save note',
    body: `<div class="stack">
      <div class="field"><label>Contact</label><input list="cl" placeholder="Search contacts">
        <datalist id="cl">${D.contacts.slice(0, 80).map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></div>
      <div class="field"><label>Note</label><textarea style="min-height:120px" placeholder="What was said, what happens next."></textarea></div>
      <div class="field"><label>Set a reminder</label><input type="date"></div>
    </div>`,
    onConfirm: () => toast('Note saved to the contact timeline')
  }));
}

export const stageKind = s => ({
  New: 'draft', Contacted: 'review', 'Meeting Set': 'review',
  Committed: 'approved', Giving: 'paid', Lapsed: 'pending', Cold: 'denied'
}[s] || 'draft');
