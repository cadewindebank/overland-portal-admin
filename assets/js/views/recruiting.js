import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast } from '../ui.js';

export default function recruiting(view) {
  const open = D.signups.filter(s => !s.converted);
  const pastMembers = D.contacts.filter(c => c.tags.includes('Past Team Member'));
  const byRegion = {};
  D.signups.forEach(s => {
    const c = D.findContact(s.contactId);
    if (c) byRegion[c.region] = (byRegion[c.region] || 0) + 1;
  });

  view.innerHTML = `
    ${pageHead({
      title: 'Recruiting',
      sub: 'Sign-up sheets, past team members and assigned contacts — everyone in the pipeline toward an expedition or AMT.',
      actions: `<button class="btn-mini" id="assign">${icon('people')} Assign contacts</button>
                <button class="btn" id="sheet">New sign-up sheet</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Open sign-ups', value: num(open.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Converted to applicants', value: num(D.signups.filter(s => s.converted).length), accent: 'var(--emerald-pine)',
               meta: Math.round(D.signups.filter(s => s.converted).length / D.signups.length * 100) + '% conversion' })}
      ${stat({ label: 'Unassigned', value: num(D.signups.filter(s => !s.assigned).length), accent: 'var(--sap)' })}
      ${stat({ label: 'Past team members', value: num(pastMembers.length), accent: 'var(--rain)',
               meta: 'Warmest re-recruiting pool' })}
    </div>

    <div class="grid grid--main" style="margin-bottom:18px">
      ${card('<div id="suTable"></div>', { title: 'Sign-up sheet', icon: 'clipboard' })}
      <div class="stack">
        ${card(`<ul class="timeline">
          ${Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([r, n]) => `
            <li><div class="timeline__body">${esc(r)}</div><span class="timeline__when">${n}</span></li>`).join('')}
        </ul>`, { title: 'Map view — sign-ups by region', icon: 'compass' })}

        ${card(`<ul class="timeline">
          ${['Expedition', 'AMT'].map(k => {
            const n = D.signups.filter(s => s.interest === k).length;
            return `<li><div class="timeline__body"><strong>${k}</strong>
              <div class="muted" style="font-size:12px">${D.signups.filter(s => s.interest === k && s.converted).length} converted</div></div>
              <span class="timeline__when">${n}</span></li>`;
          }).join('')}
        </ul>`, { title: 'Interest', icon: 'compass' })}
      </div>
    </div>

    ${card('<div id="pastTable"></div>', { title: 'Past team members', icon: 'people' })}`;

  new DataTable({
    hideTitle: true, title: 'Recruiting sign-ups', rows: D.signups, pageSize: 15, sortKey: 'created', sortDir: 'desc',
    onRowClick: s => { location.hash = '#/crm/' + s.contactId; },
    columns: [
      { key: 'name', label: 'Name', render: s => `<a href="#/crm/${s.contactId}">${esc(s.name)}</a>` },
      { key: 'email', label: 'Email' },
      { key: 'interest', label: 'Interest' },
      { key: 'target', label: 'Target trip' },
      { key: 'source', label: 'Source' },
      { key: 'assigned', label: 'Assigned to', render: s => s.assigned ? esc(s.assigned) : '<span class="muted">Unassigned</span>' },
      { key: 'created', label: 'Signed up', render: s => shortDate(s.created) },
      { key: 'status', label: 'Status', render: s => badge(s.status === 'Not now' ? 'Draft' : s.status === 'Applied' ? 'Approved' : s.status, s.status === 'Not now' ? 'draft' : s.status === 'Applied' ? 'approved' : 'review') }
    ]
  }).mount(view.querySelector('#suTable'));

  new DataTable({
    hideTitle: true, title: 'Past team members', rows: pastMembers, pageSize: 10, columnFilters: false, sortKey: 'lastTouch', sortDir: 'desc',
    onRowClick: c => { location.hash = '#/crm/' + c.id; },
    columns: [
      { key: 'name', label: 'Contact', render: c => `<a href="#/crm/${c.id}">${esc(c.name)}</a>` },
      { key: 'location', label: 'Location', value: c => `${c.city}, ${c.region}`, render: c => esc(`${c.city}, ${c.region}`) },
      { key: 'church', label: 'Church' },
      { key: 'owner', label: 'Owner' },
      { key: 'lastTouch', label: 'Last touch', render: c => shortDate(c.lastTouch) },
      { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Invite back</button>` }
    ]
  }).mount(view.querySelector('#pastTable'));

  view.querySelector('#sheet').addEventListener('click', () => modal({
    title: 'New sign-up sheet', confirm: 'Create sheet',
    body: `<div class="stack">
      <div class="field"><label>Sheet name</label><input placeholder="Cornerstone Church — vision night"></div>
      <div class="field"><label>Points at</label><select>${D.expeditions.map(e => `<option>${esc(e.name)}</option>`).join('')}<option>General interest</option></select></div>
      <div class="field"><label>Assign new sign-ups to</label><select>${D.users.slice(0, 20).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: () => toast('Sign-up sheet created — share link copied')
  }));
  view.querySelector('#assign').addEventListener('click', () =>
    toast(`${D.signups.filter(s => !s.assigned).length} unassigned sign-ups distributed`));
}
