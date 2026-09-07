import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, usd, shortDate, stat, num, progress, barChart, modal, toast } from '../ui.js';
import { stageKind } from './crm.js';

export default function fundraising(view) {
  const lapsed = D.lapsedDonors();
  const givers = D.contacts.filter(c => c.lifetime > 0);
  const goalTotal = D.sum(D.mpders, m => m.monthlyGoal);
  const raisedTotal = D.sum(D.mpders, m => m.monthlyRaised);

  // map view — group givers by region
  const byRegion = {};
  givers.forEach(c => { byRegion[c.region] = (byRegion[c.region] || 0) + c.lifetime; });
  const regionRows = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxRegion = regionRows.length ? regionRows[0][1] : 1;

  view.innerHTML = `
    ${pageHead({
      title: 'Fundraising',
      sub: 'Goals, giving history, lapsed donors, MPD planning, donation-page performance and lead scoring.',
      actions: `<button class="btn-mini" id="planMpd">${icon('chart')} Plan MPD</button>
                <button class="btn" id="newPage">Create donation page</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Monthly support goal', value: usd0(goalTotal), accent: 'var(--rain)' })}
      ${stat({ label: 'Monthly raised', value: usd0(raisedTotal), accent: 'var(--emerald-pine)',
               meta: Math.round(raisedTotal / goalTotal * 100) + '% of goal' })}
      ${stat({ label: 'Active givers', value: num(givers.filter(c => !c.lapsed).length), accent: 'var(--flare)' })}
      ${stat({ label: 'Lapsed donors', value: num(lapsed.length), accent: 'var(--sap)',
               meta: usd0(D.sum(lapsed, c => c.lifetime)) + ' lifetime at risk' })}
      ${stat({ label: 'Page revenue', value: usd0(D.sum(D.donationPages, p => p.raised)), accent: 'var(--lagoon)' })}
    </div>

    <div class="grid grid--main" style="margin-bottom:18px">
      ${card(barChart(D.givingByMonth), { title: 'Past giving history', icon: 'chart' })}
      ${card(`
        <p class="muted" style="margin-top:0;font-size:12.5px">Lifetime giving by donor region.</p>
        <ul class="timeline">
          ${regionRows.map(([r, v]) => `<li style="display:block;padding:8px 0">
            <div class="row row--between" style="font-size:13px"><span>${esc(r)}</span><span class="muted">${usd0(v)}</span></div>
            <div class="progress" style="margin-top:5px"><i style="width:${Math.round(v / maxRegion * 100)}%"></i></div></li>`).join('')}
        </ul>`, { title: 'Map view', icon: 'compass' })}
    </div>

    <div class="tabs" id="tabs">
      ${['Lapsed donors','Lead scoring','Donation page stats','MPD goals'].map((t, i) =>
        `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="fundTable"></div>`;

  const TABLES = {
    'Lapsed donors': () => ({
      title: 'Donors who stopped giving', rows: lapsed, sortKey: 'lifetime', sortDir: 'desc',
      onRowClick: c => { location.hash = '#/crm/' + c.id; },
      columns: [
        { key: 'name', label: 'Donor', render: c => `<a href="#/crm/${c.id}">${esc(c.name)}</a>` },
        { key: 'owner', label: 'Owner' },
        { key: 'lifetime', label: 'Lifetime', className: 'num', render: c => usd0(c.lifetime) },
        { key: 'lastGift', label: 'Last gift', render: c => shortDate(c.lastGift) },
        { key: 'recurring', label: 'Was recurring', className: 'center', value: c => c.recurring ? 'Yes' : 'No',
          render: c => c.recurring ? badge('Active') : '—' },
        { key: 'score', label: 'Score', className: 'num' },
        { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Add to campaign</button>` }
      ]
    }),
    'Lead scoring': () => ({
      title: 'Lead scoring', rows: [...D.contacts].sort((a, b) => b.score - a.score).slice(0, 120), sortKey: 'score', sortDir: 'desc',
      onRowClick: c => { location.hash = '#/crm/' + c.id; },
      columns: [
        { key: 'name', label: 'Contact', render: c => `<a href="#/crm/${c.id}">${esc(c.name)}</a>` },
        { key: 'bucket', label: 'Bucket' },
        { key: 'stage', label: 'Stage', render: c => badge(c.stage, stageKind(c.stage)) },
        { key: 'score', label: 'Score', className: 'num',
          render: c => `<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
            <div class="progress" style="width:70px"><i style="width:${c.score}%"></i></div><strong>${c.score}</strong></div>` },
        { key: 'lifetime', label: 'Lifetime', className: 'num', render: c => c.lifetime ? usd0(c.lifetime) : '—' },
        { key: 'owner', label: 'Owner' },
        { key: 'lastTouch', label: 'Last touch', render: c => shortDate(c.lastTouch) }
      ]
    }),
    'Donation page stats': () => ({
      title: 'Donation page stats', rows: D.donationPages, sortKey: 'raised', sortDir: 'desc',
      columns: [
        { key: 'owner', label: 'Owner', render: p => `<a href="#/people/${p.userId}">${esc(p.owner)}</a>` },
        { key: 'display', label: 'Display name' },
        { key: 'slug', label: 'Link', render: p => `<span class="rowlink">/donate/${esc(p.slug)}</span>` },
        { key: 'views', label: 'Views', className: 'num', render: p => num(p.views) },
        { key: 'raised', label: 'Raised', className: 'num', render: p => usd0(p.raised) },
        { key: 'rpv', label: 'Per view', className: 'num', value: p => Math.round(p.raised / Math.max(1, p.views) * 100) / 100,
          render: p => usd(p.raised / Math.max(1, p.views)) },
        { key: 'status', label: 'Status', render: p => badge(p.status) }
      ]
    }),
    'MPD goals': () => ({
      title: 'MPD goals', rows: D.mpders, sortKey: 'pct',
      onRowClick: m => { location.hash = '#/people/' + m.userId; },
      columns: [
        { key: 'name', label: 'MPDer', render: m => `<a href="#/people/${m.userId}">${esc(m.name)}</a>` },
        { key: 'coach', label: 'Coach' },
        { key: 'phase', label: 'Phase', render: m => badge(m.phase, m.phase === 'At Risk' ? 'denied' : m.phase === 'Fully Funded' ? 'approved' : 'review') },
        { key: 'monthlyGoal', label: 'Monthly goal', className: 'num', render: m => usd0(m.monthlyGoal) },
        { key: 'monthlyRaised', label: 'Raised', className: 'num', render: m => usd0(m.monthlyRaised) },
        { key: 'pct', label: 'Funded', className: 'num',
          render: m => `<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
            <div class="progress${m.pct >= 100 ? ' progress--go' : ''}" style="width:70px"><i style="width:${Math.min(100, m.pct)}%"></i></div><strong>${m.pct}%</strong></div>` },
        { key: 'partners', label: 'Partners', className: 'num' },
        { key: 'lapsedPartners', label: 'Lapsed', className: 'num' }
      ]
    })
  };

  const build = name => new DataTable(Object.assign({ pageSize: 15 }, TABLES[name]())).mount(view.querySelector('#fundTable'));
  build('Lapsed donors');
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    build(b.dataset.tab);
  });

  view.querySelector('#planMpd').addEventListener('click', () => modal({
    title: 'Plan MPD', confirm: 'Save plan', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label>MPDer</label><select>${D.mpders.slice(0, 40).map(m => `<option>${esc(m.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Monthly goal (USD)</label><input type="number" value="4200"></div>
      <div class="field"><label>Target date</label><input type="date"></div>
      <div class="field"><label>Appointments / week</label><input type="number" value="8"></div>
      <div class="field"><label>Asks / week</label><input type="number" value="5"></div>
      <div class="field"><label>Coach</label><select>${D.users.slice(0, 12).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="field span-3"><label>Plan notes</label><textarea placeholder="Who they are asking, in what order, and by when."></textarea></div>
    </div>`,
    onConfirm: () => toast('MPD plan saved')
  }));
  view.querySelector('#newPage').addEventListener('click', () => { location.hash = '#/donation-pages'; });
  void progress;
}
