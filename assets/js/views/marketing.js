import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, modal, toast } from '../ui.js';

export default function marketing(view) {
  const sent = D.campaigns.filter(c => c.status === 'Sent');
  const openRate = sent.length ? Math.round(D.sum(sent, c => c.opened) / D.sum(sent, c => c.sent) * 100) : 0;
  const expSignups = D.signups.filter(s => s.interest === 'Expedition').length;
  const amtSignups = D.signups.filter(s => s.interest === 'AMT').length;

  view.innerHTML = `
    ${pageHead({
      title: 'Marketing',
      sub: 'Email automations and campaigns, customer journeys, blogs, surveys and the metrics behind them.',
      actions: `<button class="btn-mini" id="journey">${icon('compass')} New journey</button>
                <button class="btn" id="campaign">New campaign</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Expedition sign-ups', value: num(expSignups), accent: 'var(--flare)' })}
      ${stat({ label: 'AMT sign-ups', value: num(amtSignups), accent: 'var(--sap)' })}
      ${stat({ label: 'Emails sent', value: num(D.sum(sent, c => c.sent)), accent: 'var(--rain)' })}
      ${stat({ label: 'Open rate', value: openRate + '%', accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Attributed revenue', value: usd0(D.sum(D.campaigns, c => c.revenue)), accent: 'var(--lagoon)' })}
    </div>

    <div class="tabs" id="tabs">
      ${['Campaigns & automations','Blogs','Surveys','Metrics'].map((t, i) =>
        `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="mkBody"></div>`;

  const body = view.querySelector('#mkBody');
  const views = {
    'Campaigns & automations': () => {
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'Campaigns & automations', rows: D.campaigns, pageSize: 15, sortKey: 'date', sortDir: 'desc',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'kind', label: 'Type', render: c => badge(c.kind === 'Automation' ? 'Active' : c.kind === 'Journey' ? 'Approved' : 'Draft', c.kind === 'Automation' ? 'approved' : c.kind === 'Journey' ? 'review' : 'draft') },
          { key: 'audience', label: 'Audience' },
          { key: 'sent', label: 'Sent', className: 'num', render: c => num(c.sent) },
          { key: 'opened', label: 'Opened', className: 'num',
            render: c => `${num(c.opened)} <span class="muted">(${Math.round(c.opened / c.sent * 100)}%)</span>` },
          { key: 'clicked', label: 'Clicked', className: 'num', render: c => num(c.clicked) },
          { key: 'conversions', label: 'Conversions', className: 'num' },
          { key: 'revenue', label: 'Revenue', className: 'num', render: c => usd0(c.revenue) },
          { key: 'date', label: 'Date', render: c => shortDate(c.date) },
          { key: 'status', label: 'Status', render: c => badge(c.status === 'Running' ? 'Active' : c.status) }
        ]
      }).mount(body.querySelector('#t'));
    },
    Blogs: () => {
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'Blog posts', rows: D.blogs, pageSize: 15, sortKey: 'published', sortDir: 'desc',
        columns: [
          { key: 'title', label: 'Post' },
          { key: 'category', label: 'Category' },
          { key: 'author', label: 'Author' },
          { key: 'published', label: 'Published', render: b => shortDate(b.published) },
          { key: 'views', label: 'Views', className: 'num', render: b => num(b.views) },
          { key: 'status', label: 'Status', render: b => badge(b.status === 'Published' ? 'Live' : b.status) },
          { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Edit</button>` }
        ]
      }).mount(body.querySelector('#t'));
    },
    Surveys: () => {
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'Surveys', rows: D.surveys, pageSize: 15, columnFilters: false, sortKey: 'created', sortDir: 'desc',
        columns: [
          { key: 'title', label: 'Survey' },
          { key: 'sent', label: 'Sent', className: 'num' },
          { key: 'responses', label: 'Responses', className: 'num' },
          { key: 'rate', label: 'Response rate', className: 'num', value: s => Math.round(s.responses / s.sent * 100),
            render: s => Math.round(s.responses / s.sent * 100) + '%' },
          { key: 'created', label: 'Created', render: s => shortDate(s.created) },
          { key: 'status', label: 'Status', render: s => badge(s.status === 'Closed' ? 'Draft' : s.status) },
          { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Results</button>` }
        ]
      }).mount(body.querySelector('#t'));
    },
    Metrics: () => {
      const bySource = {};
      D.signups.forEach(s => (bySource[s.source] = (bySource[s.source] || 0) + 1));
      const max = Math.max(...Object.values(bySource), 1);
      body.innerHTML = `<div class="grid grid--2">
        ${card(`<ul class="timeline">
          ${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([s, n]) => `
            <li style="display:block;padding:8px 0">
              <div class="row row--between" style="font-size:13px"><span>${esc(s)}</span><span class="muted">${n}</span></div>
              <div class="progress" style="margin-top:5px"><i style="width:${Math.round(n / max * 100)}%"></i></div></li>`).join('')}
        </ul>`, { title: 'Sign-ups by source', icon: 'chart' })}
        ${card(`<ul class="timeline">
          ${['All Donors','Lapsed Donors','Past Team Members','Church Network','Recruiting Leads'].map(a => {
            const rows = D.campaigns.filter(c => c.audience === a);
            const s = D.sum(rows, c => c.sent), o = D.sum(rows, c => c.opened);
            return `<li><div class="timeline__body"><strong>${esc(a)}</strong>
              <div class="muted" style="font-size:12px">${rows.length} campaigns · ${num(s)} sent</div></div>
              <span class="timeline__when">${s ? Math.round(o / s * 100) : 0}%</span></li>`;
          }).join('')}
        </ul>`, { title: 'Open rate by audience', icon: 'bell' })}
      </div>`;
    }
  };
  views['Campaigns & automations']();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    views[b.dataset.tab]();
  });

  view.querySelector('#campaign').addEventListener('click', () => modal({
    title: 'New campaign', confirm: 'Create campaign', wide: true,
    body: `<div class="form-grid">
      <div class="field span-2"><label>Campaign name</label><input placeholder="Year-End Giving 2026"></div>
      <div class="field"><label>Type</label><select><option>Campaign</option><option>Automation</option><option>Journey</option></select></div>
      <div class="field"><label>Audience</label><select>${['All Donors','Lapsed Donors','Past Team Members','Church Network','Recruiting Leads'].map(a => `<option>${a}</option>`).join('')}</select></div>
      <div class="field"><label>Send date</label><input type="date"></div>
      <div class="field"><label>From</label><input value="Overland Missions"></div>
      <div class="field span-3"><label>Subject line</label><input placeholder="What your giving made possible this year"></div>
    </div>`,
    onConfirm: () => toast('Campaign created as a draft')
  }));
  view.querySelector('#journey').addEventListener('click', () => toast('Customer journey builder opened'));
}
