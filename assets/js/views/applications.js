import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, modal, toast, deflist, shortDate } from '../ui.js';
import * as store from '../store.js';

export default function applications(view, { query } = {}) {
  const render = () => applications(view, { query });
  const open = D.openApplications();

  view.innerHTML = `
    ${pageHead({
      title: 'Expedition Applications',
      sub: 'Applications waiting on a reference, a background check, an interview or a decision.',
      actions: `<button class="btn-mini" id="bulkRef">${icon('bell')} Chase references</button>
                <button class="btn" id="exportApps">Export</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${['Submitted','In Review','Interview','Accepted','Waitlisted'].map((s, i) => stat({
        label: s, value: num(D.applications.filter(a => a.status === s).length),
        accent: ['var(--flare)','var(--rain)','var(--sap)','var(--emerald-pine)','var(--lagoon)'][i]
      })).join('')}
    </div>

    <div class="tabs" id="tabs">
      ${['Needs action','All applications'].map((t, i) => `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="appTable"></div>`;

  let dt;
  const build = rows => {
    dt = new DataTable({
      title: 'Expedition applications', rows, pageSize: 15, sortKey: 'submitted', sortDir: 'desc',
      onRowClick: a => openApp(a),
      columns: [
        { key: 'name', label: 'Applicant', render: a => `<a href="#/people/${a.userId}">${esc(a.name)}</a>` },
        { key: 'email', label: 'Email' },
        { key: 'expedition', label: 'Expedition', render: a => `<a href="#/expeditions/${a.expeditionId}">${esc(a.expedition)}</a>` },
        { key: 'amt', label: 'AMT', className: 'center' },
        { key: 'submitted', label: 'Submitted', render: a => dateTime(a.submitted) },
        { key: 'reference', label: 'Reference', render: a => badge(a.reference) },
        { key: 'background', label: 'Background', render: a => badge(a.background) },
        { key: 'status', label: 'Status', render: a => badge(a.status) },
        { key: 'act', label: '', sortable: false, filter: false, render: a => `<button class="btn-mini" data-open="${a.id}">Review</button>` }
      ]
    }).mount(view.querySelector('#appTable'));
  };
  build(open);
  // bound ONCE on the persistent host — rebinding per tab switch stacked
  // listeners and opened one modal per switch
  view.querySelector('#appTable').addEventListener('click', ev => {
    const b = ev.target.closest('[data-open]');
    if (b) openApp(D.applications.find(x => x.id === b.dataset.open));
  });

  view.querySelector('#tabs').addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    build(b.dataset.tab === 'Needs action' ? open : D.applications);
  });
  view.querySelector('#exportApps').addEventListener('click', () => dt.exportCsv());
  view.querySelector('#bulkRef').addEventListener('click', () => {
    const n = D.applications.filter(a => a.reference === 'Pending').length;
    toast(`Reference reminder sent for ${n} applications`);
  });

  function openApp(a) {
    if (!a) return;
    modal({
      title: `${a.name} — ${a.expedition}`, wide: true, confirm: 'Accept applicant', cancel: 'Close',
      body: `
        ${deflist([
          ['Submitted', dateTime(a.submitted)],
          ['Expedition', `<a href="#/expeditions/${a.expeditionId}">${esc(a.expedition)}</a>`],
          ['AMT applicant', esc(a.amt)],
          ['Reference', badge(a.reference)],
          ['Background check', badge(a.background)],
          ['Current status', badge(a.status)]
        ])}
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:6px">About the applicant</h3>
        <p class="muted" style="margin-top:0">${esc(a.about)}</p>
        <h3 class="section-title" style="margin-bottom:6px">Trip history</h3>
        <p class="muted" style="margin-top:0">${esc(a.history)}</p>
        <h3 class="section-title" style="margin-bottom:6px">Testimony</h3>
        <p class="muted" style="margin-top:0">${esc(a.testimony)}</p>
        <div class="hr"></div>
        <div class="field"><label>Reviewer note</label><textarea placeholder="Recorded on the application and visible to expedition leaders."></textarea></div>
        <div class="row" style="margin-top:14px">
          <button class="btn-mini" data-set="Interview">Move to interview</button>
          <button class="btn-mini" data-set="Waitlisted">Waitlist</button>
          <button class="btn-mini btn-mini--danger" data-set="Declined">Decline</button>
        </div>`,
      onConfirm: () => acceptOntoRoster(a)
    }).addEventListener('click', ev => {
      const b = ev.target.closest('[data-set]');
      if (b) {
        store.update('applications', a.id, { status: b.dataset.set });
        toast(`${a.name} moved to \u201c${b.dataset.set}\u201d`);
        ev.currentTarget.remove();
        render();
      }
    });
  }

  /* Accepting used to be a toast. It now actually puts the person on the
     roster, which is the whole point of the review. */
  function acceptOntoRoster(a) {
    const e = D.findExpedition(a.expeditionId);
    if (!e) { toast('That expedition no longer exists'); return; }
    if (e.roster.some(m => m.userId === a.userId)) {
      store.update('applications', a.id, { status: 'Accepted' });
      toast(`${a.name} is already on the roster`);
      return render();
    }
    if (e.roster.length >= e.capacity) {
      store.update('applications', a.id, { status: 'Waitlisted' });
      toast(`${e.name} is full — ${a.name} was waitlisted instead`);
      return render();
    }
    const u = D.findUser(a.userId);
    const roster = [...e.roster, {
      userId: a.userId, name: a.name,
      city: u ? u.city : '—', region: u ? u.region : '—',
      role: 'Team Member', raised: 0, pct: 0,
      passport: !!(u && u.passportExpiry), flight: false,
      insurance: !!(u && u.insurance === 'Current'), forms: false
    }];
    const goal = e.cost * roster.length;
    const raised = roster.reduce((s2, m) => s2 + m.raised, 0);
    store.update('expeditions', e.id, {
      roster, goal, raised, pct: goal ? Math.round((raised / goal) * 100) : 0
    });
    store.update('applications', a.id, { status: 'Accepted' });
    store.create('tasks', {
      title: `Collect deposit and documents from ${a.name}`,
      assignee: e.leader, related: e.name,
      due: e.start, overdue: false, priority: 'High', status: 'Open'
    });
    toast(`${a.name} added to ${e.name} — a follow-up task was created`);
    render();
  }
}
