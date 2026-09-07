import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd, usd0, shortDate, stat, num, progress, deflist, modal, toast, initials } from '../ui.js';

export default function expedition(view, { params }) {
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
          actions: `<button class="btn-mini" id="emailTeam">${icon('bell')} Email team</button>`
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
      { key: 'passport', label: 'Passport', className: 'center', render: m => tick(m.passport) },
      { key: 'insurance', label: 'Insurance', className: 'center', render: m => tick(m.insurance) },
      { key: 'flight', label: 'Flight', className: 'center', render: m => tick(m.flight) },
      { key: 'forms', label: 'Forms', className: 'center', render: m => tick(m.forms) }
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

  view.querySelector('#lockBtn').addEventListener('click', () =>
    toast(e.status === 'Locked' ? 'Roster unlocked' : 'Roster locked — changes now require an administrator'));
  view.querySelector('#emailTeam').addEventListener('click', () => modal({
    title: `Email the ${e.name} team`, confirm: 'Send to ' + e.roster.length + ' people',
    body: `<div class="stack">
      <div class="field"><label>Subject</label><input value="${esc(e.name)} — update"></div>
      <div class="field"><label>Message</label><textarea style="min-height:150px" placeholder="Write your update to the team."></textarea></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" checked> Also post to the portal alerts feed</label>
    </div>`,
    onConfirm: () => toast('Email queued to ' + e.roster.length + ' team members')
  }));
  view.querySelector('#addMember').addEventListener('click', () => modal({
    title: 'Add a team member',
    confirm: 'Add to roster',
    body: `<div class="stack">
      <div class="field"><label>Person</label><input list="peopleList" placeholder="Start typing a name">
        <datalist id="peopleList">${D.users.slice(0, 60).map(u => `<option value="${esc(u.name)}">`).join('')}</datalist></div>
      <div class="field"><label>Role on the team</label><select><option>Team Member</option><option>Co-Leader</option><option>Leader</option></select></div>
    </div>`,
    onConfirm: () => toast('Team member added to the roster')
  }));
  view.querySelector('#filesBtn').addEventListener('click', () => { location.hash = '#/media'; });
  view.querySelector('#addRes').addEventListener('click', () => toast('Resource upload opened'));
}

const tick = v => v
  ? `<span style="color:var(--emerald-pine)">✓</span>`
  : `<span style="color:var(--input-grey)">—</span>`;
