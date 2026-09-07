import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd, usd0, shortDate, stat, num, progress, deflist, modal, toast, initials,
         tabsUrl, textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { currentUser } from '../auth.js';

export default function expedition(view, { params, query }) {
  const render = () => expedition(view, { params, query });
  const me = currentUser();
  const e = D.findExpedition(params[0]);
  if (!e) { view.innerHTML = `<div class="card">${esc('No such expedition: ' + params[0])}</div>`; return; }

  const apps = D.applications.filter(a => a.expeditionId === e.id);
  const ready = e.roster.filter(m => m.passport && m.insurance && m.forms).length;

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'Expeditions', href: '#/expeditions' }, { label: e.name }],
      title: e.name,
      sub: `${esc(e.country)} · ${esc(e.sector)} · ${shortDate(e.start)} – ${shortDate(e.end)} (${e.days} days)`,
      actions: `<button class="btn-mini" id="filesBtn">${icon('file')} Uploaded files</button>
                <button class="btn-mini" id="lockBtn">${icon('shield')} ${e.status === 'Locked' ? 'Unlock' : 'Lock'} roster</button>
                <button class="btn" id="addMember">Add team member</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Funded', value: e.pct + '%', accent: 'var(--flare)', meta: `${usd0(e.raised)} of ${usd0(e.goal)}` })}
      ${stat({ label: 'Team', value: `${e.roster.length}/${e.capacity}`, accent: 'var(--rain)', meta: `${e.capacity - e.roster.length} places open` })}
      ${stat({ label: 'Departs in', value: e.daysOut > 0 ? e.daysOut : '—', accent: 'var(--sap)', meta: e.daysOut > 0 ? 'days' : 'Trip has departed' })}
      ${stat({ label: 'Travel ready', value: `${ready}/${e.roster.length}`, accent: 'var(--emerald-pine)', meta: 'Passport, insurance & forms' })}
      ${stat({ label: 'Applications', value: num(apps.length), accent: 'var(--lagoon)', meta: `${apps.filter(a => a.status === 'Submitted').length} new` })}
    </div>

    <div class="grid grid--main">
      <div class="stack">
        ${card(`
          <div class="member-grid">
            ${e.roster.map(m => `
              <a href="#/people/${m.userId}" class="member" style="text-decoration:none;color:inherit">
                <span class="member__photo"><span class="member__initials">${esc(initials(m.name))}</span>
                  <span class="member__tag ${m.role === 'Team Member' ? '' : 'member__tag--lead'}${m.pct >= 100 ? ' member__tag--pct' : ''}">${m.pct >= 100 ? '100%' : esc(m.role)}</span>
                </span>
                <span class="member__body">
                  <span class="member__name">${esc(m.name)}</span>
                  <span class="member__loc">${esc(m.city + ', ' + m.region)}</span>
                  <span style="display:flex;gap:7px;justify-content:center;margin-top:8px">
                    ${['passport','flight','insurance','forms'].map(k =>
                      `<span title="${k}" style="color:${m[k] ? 'var(--emerald-pine)' : 'var(--line-strong)'};display:inline-flex">${
                        icon(k === 'flight' ? 'plane' : k === 'passport' ? 'passport' : k === 'insurance' ? 'shield' : 'file')}</span>`).join('')}
                  </span>
                  <span style="display:block;font-size:12px;margin-top:8px" class="muted">${usd0(m.raised)} raised</span>
                </span>
              </a>`).join('')}
          </div>`, {
          title: `Roster — ${e.roster.length} people`, icon: 'people',
          actions: `<button class="btn-mini" id="chaseDocs">${icon('alert')} Chase missing documents</button>
                  <button class="btn-mini" id="emailTeam">${icon('bell')} Email team</button>`
        })}

        ${card('<div id="rosterTable"></div>', { title: 'Roster finances & readiness', icon: 'dollar' })}
        ${card('<div id="appsTable"></div>', { title: 'Applications for this expedition', icon: 'clipboard' })}
      </div>

      <div class="stack">
        ${card(deflist([
          ['Code', esc(e.code)],
          ['Status', badge(e.status)],
          ['Country', esc(e.country)],
          ['Sector', esc(e.sector)],
          ['Dates', `${shortDate(e.start)} – ${shortDate(e.end)}`],
          ['Trip cost', usd0(e.cost)],
          ['Team leader', esc(e.leader)],
          ['Capacity', `${e.roster.length} of ${e.capacity}`]
        ]) + `<div style="margin-top:14px">${progress(e.pct, e.pct >= 100)}
          <div class="row row--between" style="font-size:12.5px;margin-top:6px">
            <span class="muted">${usd0(e.raised)} raised</span><span>${usd0(Math.max(0, e.goal - e.raised))} to go</span></div>
        </div>`, { title: 'Details', icon: 'compass' })}

        ${card(`<ul class="timeline">
          ${e.resources.map(r => `<li>
            <span class="timeline__icon">${icon('file')}</span>
            <div class="timeline__body"><a href="#/media">${esc(r)}</a>
              <div class="muted" style="font-size:12px">PDF · updated ${shortDate(e.start)}</div></div>
          </li>`).join('')}
        </ul>
        <button class="btn-mini w-100" style="margin-top:12px;justify-content:center" id="addRes">${icon('plus')} Add resource</button>`,
        { title: 'Expedition resources', icon: 'book' })}

        ${card(`<ul class="timeline">
          <li><span class="timeline__icon">${icon('check')}</span><div class="timeline__body">Applications opened<div class="muted" style="font-size:12px">${shortDate(e.start)}</div></div></li>
          <li><span class="timeline__icon">${icon('clock')}</span><div class="timeline__body">Roster locks 45 days out<div class="muted" style="font-size:12px">Deposits due</div></div></li>
          <li><span class="timeline__icon">${icon('plane')}</span><div class="timeline__body">Flights ticketed 30 days out</div></li>
          <li><span class="timeline__icon">${icon('compass')}</span><div class="timeline__body">Departure<div class="muted" style="font-size:12px">${shortDate(e.start)}</div></div></li>
        </ul>`, { title: 'Milestones', icon: 'clock' })}
      </div>
    </div>`;

  new DataTable({
    hideTitle: true, title: `${e.name} — roster`, rows: e.roster.map(m => ({ ...m, id: m.userId })),
    pageSize: 10, columnFilters: false, sortKey: 'pct', sortDir: 'asc',
    onRowClick: m => { location.hash = '#/people/' + m.userId; },
    columns: [
      { key: 'name', label: 'Member', render: m => `<a href="#/people/${m.userId}">${esc(m.name)}</a>` },
      { key: 'role', label: 'Role', render: m => badge(m.role, m.role === 'Team Member' ? 'draft' : 'role') },
      { key: 'raised', label: 'Raised', className: 'num', render: m => usd(m.raised) },
      { key: 'remaining', label: 'Remaining', className: 'num', value: m => Math.max(0, e.cost - m.raised), render: m => usd(Math.max(0, e.cost - m.raised)) },
      { key: 'pct', label: 'Funded', className: 'num', render: m => `${m.pct}%` },
      { key: 'passport', label: 'Passport', className: 'center', value: m => m.passport ? 'Yes' : 'No',
        render: m => docCell(m, 'passport') },
      { key: 'insurance', label: 'Insurance', className: 'center', value: m => m.insurance ? 'Yes' : 'No',
        render: m => docCell(m, 'insurance') },
      { key: 'flight', label: 'Flight', className: 'center', value: m => m.flight ? 'Yes' : 'No',
        render: m => docCell(m, 'flight') },
      { key: 'forms', label: 'Forms', className: 'center', value: m => m.forms ? 'Yes' : 'No',
        render: m => docCell(m, 'forms') },
      { key: 'act', label: '', sortable: false, filter: false,
        render: m => `<button class="btn-mini" data-member="${m.userId}">Manage</button>` }
    ]
  }).mount(view.querySelector('#rosterTable'));

  new DataTable({
    hideTitle: true, title: `${e.name} — applications`, rows: apps, pageSize: 8, columnFilters: false, sortKey: 'submitted', sortDir: 'desc',
    columns: [
      { key: 'name', label: 'Applicant', render: a => `<a href="#/people/${a.userId}">${esc(a.name)}</a>` },
      { key: 'submitted', label: 'Submitted', render: a => shortDate(a.submitted) },
      { key: 'amt', label: 'AMT', className: 'center' },
      { key: 'reference', label: 'Reference', render: a => badge(a.reference) },
      { key: 'background', label: 'Background', render: a => badge(a.background) },
      { key: 'status', label: 'Status', render: a => badge(a.status) }
    ]
  }).mount(view.querySelector('#appsTable'));

  const setRoster = roster => {
    const goal = e.cost * roster.length;
    const raised = roster.reduce((s2, m) => s2 + m.raised, 0);
    store.update('expeditions', e.id, {
      roster, goal, raised, pct: goal ? Math.round((raised / goal) * 100) : 0
    });
  };

  view.querySelector('#rosterTable').addEventListener('click', ev => {
    const doc = ev.target.closest('[data-doc]');
    if (doc) {
      const { doc: key, uid } = doc.dataset;
      const roster = e.roster.map(m => m.userId === uid ? { ...m, [key]: !m[key] } : m);
      setRoster(roster);
      const m = roster.find(x => x.userId === uid);
      toast(`${m.name}: ${key} marked ${m[key] ? 'received' : 'outstanding'}`);
      return render();
    }
    const mem = ev.target.closest('[data-member]');
    if (mem) return manageMember(mem.dataset.member);
  });

  function manageMember(uid) {
    const m = e.roster.find(x => x.userId === uid);
    if (!m) return;
    modal({
      title: `${m.name} on ${e.name}`, confirm: 'Save', wide: true,
      body: `${selectField('Role', ['Team Member', 'Co-Leader', 'Leader'], { value: m.role })}
        ${textField('Raised so far', { type: 'number', value: m.raised.toFixed(2) })}
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:8px">Travel readiness</h3>
        <div class="grid grid--2" style="gap:6px">
          ${[['passport', 'Passport on file'], ['insurance', 'Insurance current'],
             ['flight', 'Flight booked'], ['forms', 'Forms complete']].map(([k, l]) =>
            `<label class="check"><input type="checkbox" data-flag="${k}"${m[k] ? ' checked' : ''}><span>${l}</span></label>`).join('')}
        </div>
        <div class="hr"></div>
        <button class="btn-mini btn-mini--danger" data-remove="${uid}">Remove from roster</button>`,
      onConfirm: scrim => {
        const v = readForm(scrim);
        const flags = {};
        scrim.querySelectorAll('[data-flag]').forEach(b => (flags[b.dataset.flag] = b.checked));
        const raised = Number(v['Raised so far']) || 0;
        const roster = e.roster.map(x => x.userId === uid
          ? { ...x, role: v['Role'], raised, pct: Math.min(100, Math.round((raised / e.cost) * 100)), ...flags }
          : x);
        setRoster(roster);
        toast(`${m.name} updated`);
        render();
      }
    }).addEventListener('click', ev => {
      const rm = ev.target.closest('[data-remove]');
      if (!rm) return;
      setRoster(e.roster.filter(x => x.userId !== rm.dataset.remove));
      toast(`${m.name} removed from the roster`);
      ev.currentTarget.remove();
      render();
    });
  }

  view.querySelector('#chaseDocs').addEventListener('click', () => {
    const behind = e.roster.filter(m => !m.passport || !m.insurance || !m.forms || !m.flight);
    if (!behind.length) return toast('Every team member is travel ready');
    modal({
      title: `Chase ${behind.length} team member${behind.length > 1 ? 's' : ''}`, confirm: 'Send reminders',
      body: `<p style="margin-top:0">These people are missing something for ${esc(e.name)}:</p>
        <ul style="margin:0 0 12px;padding-left:18px;max-height:200px;overflow:auto">
          ${behind.map(m => `<li>${esc(m.name)} — ${
            [!m.passport && 'passport', !m.insurance && 'insurance', !m.flight && 'flight', !m.forms && 'forms']
              .filter(Boolean).join(', ')}</li>`).join('')}
        </ul>
        ${textareaField('Message', { placeholder: 'Added to the reminder email.' })}`,
      onConfirm: () => {
        behind.forEach(m => store.create('tasks', {
          title: `Chase documents from ${m.name}`, assignee: e.leader, related: e.name,
          due: e.start, overdue: false, priority: 'High', status: 'Open'
        }, { silent: true }));
        toast(`${behind.length} reminders sent and tasks raised`);
        render();
      }
    });
  });

  view.querySelector('#lockBtn').addEventListener('click', () => {
    const next = e.status === 'Locked' ? 'Open' : 'Locked';
    store.update('expeditions', e.id, { status: next });
    toast(next === 'Locked' ? 'Roster locked — changes now require an administrator' : 'Roster unlocked');
    render();
  });
  view.querySelector('#emailTeam').addEventListener('click', () => modal({
    title: `Email the ${e.name} team`, confirm: 'Send to ' + e.roster.length + ' people',
    body: `<div class="stack">
      ${textField('Subject', { value: e.name + ' — update' })}
      ${textareaField('Message', { style: 'min-height:150px', placeholder: 'Write your update to the team.' })}
      <label class="check"><input type="checkbox" checked>
        <span>Also post to the portal alerts feed</span></label>
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Subject', 'Message']);
      if (v === false) return false;
      if (v['Also post to the portal alerts feed']) {
        store.create('alerts', {
          title: v['Subject'], audience: 'Expedition Members', channel: 'Portal + Email',
          status: 'Sent', sent: new Date().toISOString().slice(0, 16).replace('T', ' '),
          reach: e.roster.length, opened: 0
        }, { silent: true });
      }
      toast('Email queued to ' + e.roster.length + ' team members');
    }
  }));
  view.querySelector('#addMember').addEventListener('click', () => modal({
    title: 'Add a team member',
    confirm: 'Add to roster',
    body: `<div class="stack">
      ${textField('Person', { list: 'peopleList', placeholder: 'Start typing a name' })}
      <datalist id="peopleList">${D.users.slice(0, 120).map(u => `<option value="${esc(u.name)}">`).join('')}</datalist>
      ${selectField('Role on the team', ['Team Member', 'Co-Leader', 'Leader'])}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Person']);
      if (v === false) return false;
      const u = D.users.find(x => x.name === v['Person']);
      if (!u) { return requireFields(scrim, ['Person']) && false; }
      if (e.roster.some(m => m.userId === u.id)) { toast(`${u.name} is already on this roster`); return; }
      setRoster([...e.roster, {
        userId: u.id, name: u.name, city: u.city, region: u.region,
        role: v['Role on the team'], raised: 0, pct: 0,
        passport: !!u.passportExpiry, flight: false,
        insurance: u.insurance === 'Current', forms: false
      }]);
      toast(`${u.name} added to the roster`);
      render();
    }
  }));
  view.querySelector('#filesBtn').addEventListener('click', () => {
    location.hash = '#/media?collection=Expedition%20Media&q=' + encodeURIComponent(e.country);
  });
  view.querySelector('#addRes').addEventListener('click', () => modal({
    title: 'Add an expedition resource', confirm: 'Add resource',
    body: `${textField('Resource name', { placeholder: 'Orientation Packet' })}
      ${selectField('Type', ['Document', 'Checklist', 'Meeting notes', 'Link'])}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Resource name']);
      if (v === false) return false;
      store.update('expeditions', e.id, { resources: [...e.resources, v['Resource name']] });
      toast('Resource added');
      render();
    }
  }));
}

const tick = v => v
  ? `<span style="color:var(--emerald-pine)" aria-label="yes">\u2713</span>`
  : `<span style="color:var(--input-grey)" aria-label="no">\u2014</span>`;

/* Clickable so a manager can clear a missing document from the roster
   itself rather than only reading that it is missing. */
const docCell = (m, key) => `<button class="btn-mini" data-doc="${key}" data-uid="${m.userId}"
  style="min-width:0;padding:3px 8px;letter-spacing:0"
  title="${m[key] ? 'Mark outstanding' : 'Mark received'}"
  aria-label="${m.name}: ${key} ${m[key] ? 'received — mark outstanding' : 'outstanding — mark received'}">${
  m[key] ? '\u2713' : '\u2014'}</button>`;
