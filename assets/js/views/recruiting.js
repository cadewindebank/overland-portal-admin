import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast,
         textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';

export default function recruiting(view) {
  const render = () => recruiting(view);
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
      { key: 'act', label: '', sortable: false, filter: false,
        render: c => `<button class="btn-mini" data-invite="${c.id}">Invite back</button>` }
    ]
  }).mount(view.querySelector('#pastTable'));

  view.querySelector('#pastTable').addEventListener('click', e => {
    const b = e.target.closest('[data-invite]');
    if (!b) return;
    const c = D.findContact(b.dataset.invite);
    modal({
      title: `Invite ${c.name} back`, confirm: 'Send invitation',
      body: `${selectField('Expedition', D.expeditions.filter(x => x.status === 'Open').map(x => x.name))}
        ${textareaField('Personal note', { placeholder: 'Why you would love them on this team.' })}`,
      onConfirm: scrim => {
        const v = readForm(scrim);
        store.create('signups', {
          name: c.name, contactId: c.id, email: c.email,
          interest: 'Expedition', target: v['Expedition'], source: 'Past team member',
          created: new Date().toISOString().slice(0, 10), assigned: c.owner,
          converted: false, status: 'Contacted'
        });
        store.update('contacts', c.id,
          { stage: 'Contacted', lastTouch: new Date().toISOString().slice(0, 10) }, { silent: true });
        toast(`${c.name} invited to ${v['Expedition']}`);
        render();
      }
    });
  });

  view.querySelector('#sheet').addEventListener('click', () => modal({
    title: 'New sign-up sheet', confirm: 'Create sheet',
    body: `<div class="stack">
      ${textField('Sheet name', { placeholder: 'Cornerstone Church — vision night' })}
      ${selectField('Points at', D.expeditions.map(e => e.name).concat(['General interest']))}
      ${selectField('Assign new sign-ups to', D.users.slice(0, 20).map(u => u.name))}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Sheet name']);
      if (v === false) return false;
      toast(`\u201c${v['Sheet name']}\u201d created — new sign-ups route to ${v['Assign new sign-ups to']}`);
    }
  }));
  view.querySelector('#assign').addEventListener('click', () => {
    const un = D.signups.filter(s => !s.assigned);
    if (!un.length) return toast('Every sign-up already has an owner');
    const owners = D.users.filter(u => u.type === 'Staff').slice(0, 8).map(u => u.name);
    un.forEach((s, i) => store.update('signups', s.id, { assigned: owners[i % owners.length] }, { silent: true }));
    toast(`${un.length} sign-ups distributed across ${owners.length} owners`);
    render();
  });
}
