import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, progress, modal, toast,
         textField, selectField, textareaField, requireFields } from '../ui.js';
import * as store from '../store.js';

export default function expeditions(view) {
  const active = D.expeditions.filter(e => e.status !== 'Closed');

  view.innerHTML = `
    ${pageHead({
      title: 'Expeditions',
      sub: 'Every trip on the calendar — roster size, funding progress and readiness at a glance.',
      actions: `<a class="btn-mini" href="#/applications">${icon('clipboard')} Applications</a>
                <button class="btn" id="newExp">New expedition</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Open expeditions', value: num(D.expeditions.filter(e => e.status === 'Open').length), accent: 'var(--flare)' })}
      ${stat({ label: 'People on rosters', value: num(D.sum(D.expeditions, e => e.roster.length)), accent: 'var(--rain)' })}
      ${stat({ label: 'Raised toward trips', value: usd0(D.sum(D.expeditions, e => e.raised)), accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Still to raise', value: usd0(D.sum(D.expeditions, e => Math.max(0, e.goal - e.raised))), accent: 'var(--sap)' })}
    </div>

    <div class="grid grid--3" style="margin-bottom:18px">
      ${active.slice(0, 6).map(e => `
        <a href="#/expeditions/${e.id}" class="card" style="text-decoration:none;color:inherit;display:block">
          <div class="row row--between" style="align-items:flex-start">
            <div>
              <div class="eyebrow">${esc(e.sector)}</div>
              <h3 style="margin:2px 0 0;font-size:16px">${esc(e.name)}</h3>
            </div>
            ${badge(e.status)}
          </div>
          <div class="muted" style="font-size:12.5px;margin:6px 0 12px">
            ${esc(e.country)} · ${shortDate(e.start)} · ${e.days} days
          </div>
          <div class="grid grid--3" style="gap:10px;margin-bottom:12px;text-align:center">
            <div><div style="font-family:var(--font-display);font-size:26px;line-height:1">${e.pct}%</div><div class="muted" style="font-size:11px">Funded</div></div>
            <div><div style="font-family:var(--font-display);font-size:26px;line-height:1">${e.roster.length}</div><div class="muted" style="font-size:11px">Team</div></div>
            <div><div style="font-family:var(--font-display);font-size:26px;line-height:1">${e.daysOut}</div><div class="muted" style="font-size:11px">Days out</div></div>
          </div>
          ${progress(e.pct, e.pct >= 100)}
          <div class="muted" style="font-size:12px;margin-top:8px">Leader: ${esc(e.leader)}</div>
        </a>`).join('')}
    </div>

    <div id="expTable"></div>`;

  new DataTable({
    title: 'All expeditions', rows: D.expeditions, pageSize: 10, sortKey: 'start', sortDir: 'desc',
    onRowClick: e => { location.hash = '#/expeditions/' + e.id; },
    columns: [
      { key: 'name', label: 'Expedition', render: e => `<a href="#/expeditions/${e.id}">${esc(e.name)}</a>` },
      { key: 'code', label: 'Code' },
      { key: 'country', label: 'Country' },
      { key: 'sector', label: 'Sector' },
      { key: 'start', label: 'Departs', render: e => shortDate(e.start) },
      { key: 'days', label: 'Days', className: 'num' },
      { key: 'cost', label: 'Trip cost', className: 'num', render: e => usd0(e.cost) },
      { key: 'team', label: 'Team', className: 'num', value: e => e.roster.length, render: e => `${e.roster.length} / ${e.capacity}` },
      { key: 'pct', label: 'Funded', className: 'num', render: e => `${e.pct}%` },
      { key: 'leader', label: 'Leader' },
      { key: 'status', label: 'Status', render: e => badge(e.status) }
    ]
  }).mount(view.querySelector('#expTable'));

  view.querySelector('#newExp').addEventListener('click', () => modal({
    title: 'Create an expedition', confirm: 'Create expedition', wide: true,
    body: `<div class="form-grid">
      ${textField('Expedition name', { placeholder: '2027 AMT Zambia January', span: 2 })}
      ${textField('Code', { placeholder: 'ZAM-2027-1' })}
      ${textField('Country', { placeholder: 'Zambia' })}
      ${selectField('Sector', ['Southern Africa','East Africa','North Africa','Middle East','South America','Global'])}
      ${textField('Departure date', { type: 'date' })}
      ${textField('Length (days)', { type: 'number', value: 10 })}
      ${textField('Trip cost (USD)', { type: 'number', value: 3900 })}
      ${textField('Team capacity', { type: 'number', value: 16 })}
      ${textareaField('Notes for applicants', { placeholder: 'What this team will be doing and who it is for.', span: 3 })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Expedition name', 'Country', 'Departure date']);
      if (v === false) return false;
      const days = Number(v['Length (days)']) || 10;
      const start = new Date(v['Departure date'] + 'T00:00:00');
      const row = store.create('expeditions', {
        name: v['Expedition name'], code: v['Code'] || v['Country'].slice(0, 3).toUpperCase(),
        country: v['Country'], sector: v['Sector'], start: v['Departure date'],
        end: new Date(start.getTime() + days * 86400000).toISOString().slice(0, 10),
        days, cost: Number(v['Trip cost (USD)']) || 0,
        capacity: Number(v['Team capacity']) || 12,
        status: 'Open', daysOut: Math.round((start - new Date('2026-09-07')) / 86400000),
        leader: '\u2014', roster: [], raised: 0, goal: 0, pct: 0,
        resources: [], notes: v['Notes for applicants'] || ''
      });
      toast('Expedition created');
      location.hash = '#/expeditions/' + row.id;
    }
  }));
}
