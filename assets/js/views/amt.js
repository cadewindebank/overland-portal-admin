import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, progress, modal, toast } from '../ui.js';

/* AMT — Advanced Mission Training. In the mind map AMT sits alongside
   Expeditions with its own trips, tasks, resources, management and admin. */
export default function amt(view) {
  const amtTrips = D.expeditions.filter(e => /AMT/i.test(e.name));
  const amtApps = D.applications.filter(a => a.amt === 'Yes');
  const cohortSize = D.sum(amtTrips, e => e.roster.length);

  view.innerHTML = `
    ${pageHead({
      title: 'AMT',
      sub: 'Advanced Mission Training — cohorts, their trips, costs, travel booking and readiness.',
      actions: `<a class="btn-mini" href="#/applications?amt=1">${icon('clipboard')} AMT applicants</a>
                <button class="btn" id="newCohort">New cohort</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Active cohorts', value: num(amtTrips.filter(e => e.status !== 'Closed').length), accent: 'var(--flare)' })}
      ${stat({ label: 'Students', value: num(cohortSize), accent: 'var(--rain)' })}
      ${stat({ label: 'AMT applicants', value: num(amtApps.length), accent: 'var(--sap)',
               meta: `${amtApps.filter(a => a.status === 'Submitted').length} new` })}
      ${stat({ label: 'Raised toward AMT', value: usd0(D.sum(amtTrips, e => e.raised)), accent: 'var(--emerald-pine)',
               meta: 'of ' + usd0(D.sum(amtTrips, e => e.goal)) })}
    </div>

    <div class="grid grid--2" style="margin-bottom:18px">
      ${amtTrips.map(e => `
        <a href="#/expeditions/${e.id}" class="card" style="text-decoration:none;color:inherit;display:block">
          <div class="row row--between" style="align-items:flex-start">
            <div><div class="eyebrow">${esc(e.sector)}</div>
              <h3 style="margin:2px 0 0;font-size:16px">${esc(e.name)}</h3></div>
            ${badge(e.status)}
          </div>
          <div class="muted" style="font-size:12.5px;margin:6px 0 12px">
            ${esc(e.country)} · ${shortDate(e.start)} – ${shortDate(e.end)} · ${e.days} days · cost ${usd0(e.cost)}
          </div>
          ${progress(e.pct, e.pct >= 100)}
          <div class="row row--between" style="font-size:12.5px;margin-top:6px">
            <span class="muted">${e.roster.length}/${e.capacity} students · leader ${esc(e.leader)}</span>
            <span><strong>${e.pct}%</strong> funded</span>
          </div>
        </a>`).join('')}
    </div>

    <div class="tabs" id="tabs">
      ${['Students','Trips','AMT costs','Travel booking'].map((t, i) =>
        `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="amtBody"></div>`;

  const body = view.querySelector('#amtBody');
  const students = amtTrips.flatMap(e => e.roster.map(m => ({ ...m, id: e.id + '-' + m.userId, cohort: e.name, cost: e.cost, expeditionId: e.id })));

  const mount = opts => { body.innerHTML = '<div id="t"></div>'; new DataTable(Object.assign({ pageSize: 15 }, opts)).mount(body.querySelector('#t')); };
  const tabs = {
    Students: () => mount({
      title: 'AMT students', rows: students, sortKey: 'pct',
      onRowClick: m => { location.hash = '#/people/' + m.userId; },
      columns: [
        { key: 'name', label: 'Student', render: m => `<a href="#/people/${m.userId}">${esc(m.name)}</a>` },
        { key: 'cohort', label: 'Cohort', render: m => `<a href="#/expeditions/${m.expeditionId}">${esc(m.cohort)}</a>` },
        { key: 'role', label: 'Role' },
        { key: 'raised', label: 'Raised', className: 'num', render: m => usd0(m.raised) },
        { key: 'pct', label: 'Funded', className: 'num', render: m => m.pct + '%' },
        { key: 'passport', label: 'Passport', className: 'center', value: m => m.passport ? 'Yes' : 'No', render: m => tick(m.passport) },
        { key: 'insurance', label: 'Insurance', className: 'center', value: m => m.insurance ? 'Yes' : 'No', render: m => tick(m.insurance) },
        { key: 'flight', label: 'Flight', className: 'center', value: m => m.flight ? 'Yes' : 'No', render: m => tick(m.flight) },
        { key: 'forms', label: 'Forms', className: 'center', value: m => m.forms ? 'Yes' : 'No', render: m => tick(m.forms) }
      ]
    }),
    Trips: () => mount({
      title: 'AMT trips', rows: amtTrips, columnFilters: false, sortKey: 'start', sortDir: 'desc',
      onRowClick: e => { location.hash = '#/expeditions/' + e.id; },
      columns: [
        { key: 'name', label: 'Cohort', render: e => `<a href="#/expeditions/${e.id}">${esc(e.name)}</a>` },
        { key: 'country', label: 'Country' },
        { key: 'start', label: 'Departs', render: e => shortDate(e.start) },
        { key: 'days', label: 'Days', className: 'num' },
        { key: 'team', label: 'Students', className: 'num', value: e => e.roster.length, render: e => `${e.roster.length} / ${e.capacity}` },
        { key: 'cost', label: 'Cost', className: 'num', render: e => usd0(e.cost) },
        { key: 'pct', label: 'Funded', className: 'num', render: e => e.pct + '%' },
        { key: 'status', label: 'Status', render: e => badge(e.status) }
      ]
    }),
    'AMT costs': () => {
      body.innerHTML = card(`
        <div class="dt__scroll"><table class="dt__table">
          <thead><tr><th>Cohort</th><th class="num">Students</th><th class="num">Cost / student</th>
            <th class="num">Total cost</th><th class="num">Raised</th><th class="num">Outstanding</th></tr></thead>
          <tbody>${amtTrips.map(e => `<tr>
            <td><a href="#/expeditions/${e.id}">${esc(e.name)}</a></td>
            <td class="num">${e.roster.length}</td>
            <td class="num">${usd0(e.cost)}</td>
            <td class="num">${usd0(e.goal)}</td>
            <td class="num">${usd0(e.raised)}</td>
            <td class="num"><strong style="color:${e.goal - e.raised > 0 ? '#a32718' : 'var(--emerald-pine)'}">${usd0(Math.max(0, e.goal - e.raised))}</strong></td>
          </tr>`).join('')}</tbody>
          <tfoot><tr style="border-top:2px solid var(--shadow);font-weight:600">
            <td>Total</td><td class="num">${cohortSize}</td><td class="num">—</td>
            <td class="num">${usd0(D.sum(amtTrips, e => e.goal))}</td>
            <td class="num">${usd0(D.sum(amtTrips, e => e.raised))}</td>
            <td class="num">${usd0(D.sum(amtTrips, e => Math.max(0, e.goal - e.raised)))}</td></tr></tfoot>
        </table></div>`, { title: 'AMT costs', icon: 'dollar' });
    },
    'Travel booking': () => mount({
      title: 'Travel booking', rows: students, sortKey: 'flight',
      columns: [
        { key: 'name', label: 'Student', render: m => `<a href="#/people/${m.userId}">${esc(m.name)}</a>` },
        { key: 'cohort', label: 'Cohort' },
        { key: 'passport', label: 'Passport', className: 'center', value: m => m.passport ? 'Yes' : 'No', render: m => tick(m.passport) },
        { key: 'flight', label: 'Flight booked', className: 'center', value: m => m.flight ? 'Yes' : 'No',
          render: m => m.flight ? badge('Approved', 'approved') : badge('Pending') },
        { key: 'insurance', label: 'Insurance', className: 'center', value: m => m.insurance ? 'Yes' : 'No', render: m => tick(m.insurance) },
        { key: 'act', label: '', sortable: false, filter: false,
          render: m => m.flight ? `<button class="btn-mini">Itinerary</button>` : `<button class="btn-mini btn-mini--go">Book</button>` }
      ]
    })
  };
  tabs.Students();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });

  view.querySelector('#newCohort').addEventListener('click', () => modal({
    title: 'New AMT cohort', confirm: 'Create cohort',
    body: `<div class="form-grid form-grid--2">
      <div class="field span-2"><label>Cohort name</label><input placeholder="2027 AMT Zambia January"></div>
      <div class="field"><label>Country</label><input placeholder="Zambia"></div>
      <div class="field"><label>Start date</label><input type="date"></div>
      <div class="field"><label>Length (days)</label><input type="number" value="90"></div>
      <div class="field"><label>Cost per student</label><input type="number" value="7100"></div>
    </div>`,
    onConfirm: () => toast('AMT cohort created')
  }));
}

const tick = v => v ? `<span style="color:var(--emerald-pine)">✓</span>` : `<span style="color:var(--input-grey)">—</span>`;
