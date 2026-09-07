import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, modal, toast,
         textField, selectField, textareaField, requireFields } from '../ui.js';
import * as store from '../store.js';

export default function marketing(view) {
  const render = () => marketing(view);
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
          { key: 'act', label: '', sortable: false, filter: false,
            render: b => `<button class="btn-mini" data-blog="${b.id}">Edit</button>` }
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
          { key: 'act', label: '', sortable: false, filter: false,
            render: s => `<button class="btn-mini" data-survey="${s.id}">Results</button>` }
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
  body.addEventListener('click', e => {
    const bl = e.target.closest('[data-blog]');
    if (bl) {
      const b = D.blogs.find(x => String(x.id) === bl.dataset.blog);
      return modal({
        title: 'Edit post', confirm: 'Save post', wide: true,
        body: `${textField('Title', { value: b.title })}
          <div class="form-grid form-grid--2">
            ${selectField('Category', ['Field Stories','Expeditions','Ministry','Updates'], { value: b.category })}
            ${selectField('Status', ['Draft','Scheduled','Published'], { value: b.status })}
          </div>
          ${textareaField('Body', { style: 'min-height:160px' })}`,
        onConfirm: scrim => {
          const v = requireFields(scrim, ['Title']);
          if (v === false) return false;
          store.update('blogs', b.id, { title: v['Title'], category: v['Category'], status: v['Status'] });
          toast('Post saved');
          render();
        }
      });
    }
    const sv = e.target.closest('[data-survey]');
    if (sv) {
      const s = D.surveys.find(x => String(x.id) === sv.dataset.survey);
      const rate = Math.round(s.responses / Math.max(1, s.sent) * 100);
      return modal({
        title: s.title, confirm: s.status === 'Open' ? 'Close survey' : 'Reopen survey',
        body: `<div class="grid grid--3" style="text-align:center;margin-bottom:14px">
            <div><div class="eyebrow">Sent</div><div style="font-family:var(--font-display);font-size:28px">${num(s.sent)}</div></div>
            <div><div class="eyebrow">Responses</div><div style="font-family:var(--font-display);font-size:28px">${num(s.responses)}</div></div>
            <div><div class="eyebrow">Rate</div><div style="font-family:var(--font-display);font-size:28px">${rate}%</div></div>
          </div>
          <div class="progress"><i style="width:${rate}%"></i></div>
          <p class="muted" style="margin-top:14px">Responses are stored with the survey and exportable as CSV.</p>`,
        onConfirm: () => {
          store.update('surveys', s.id, { status: s.status === 'Open' ? 'Closed' : 'Open' });
          toast(`Survey ${s.status === 'Open' ? 'closed' : 'reopened'}`);
          render();
        }
      });
    }
  });

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
      ${textField('Campaign name', { placeholder: 'Year-End Giving 2026', span: 2 })}
      ${selectField('Type', ['Campaign', 'Automation', 'Journey'])}
      ${selectField('Audience', ['All Donors','Lapsed Donors','Past Team Members','Church Network','Recruiting Leads'])}
      ${textField('Send date', { type: 'date' })}
      ${textField('From', { value: 'Overland Missions' })}
      ${textField('Subject line', { placeholder: 'What your giving made possible this year', span: 3 })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Campaign name', 'Subject line']);
      if (v === false) return false;
      store.create('campaigns', {
        name: v['Campaign name'], kind: v['Type'], audience: v['Audience'],
        status: 'Draft', sent: 0, opened: 0, clicked: 0, conversions: 0, revenue: 0,
        date: v['Send date'] || new Date().toISOString().slice(0, 10),
        subject: v['Subject line'], from: v['From']
      });
      toast('Campaign created as a draft');
      render();
    }
  }));
  view.querySelector('#journey').addEventListener('click', () => modal({
    title: 'New customer journey', confirm: 'Create journey',
    body: `${textField('Journey name', { placeholder: 'New donor welcome' })}
      ${selectField('Trigger', ['First gift received', 'Sign-up sheet submitted', 'Application submitted',
        'Gift lapsed 90 days', 'Expedition completed'])}
      ${selectField('Audience', ['All Donors','Lapsed Donors','Past Team Members','Church Network','Recruiting Leads'])}
      ${textareaField('Steps', { placeholder: 'Day 0 thank-you · Day 3 story · Day 14 ask' })}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Journey name', 'Trigger']);
      if (v === false) return false;
      store.create('campaigns', {
        name: v['Journey name'], kind: 'Journey', audience: v['Audience'], status: 'Running',
        sent: 0, opened: 0, clicked: 0, conversions: 0, revenue: 0,
        date: new Date().toISOString().slice(0, 10), trigger: v['Trigger']
      });
      toast('Journey created and running');
      render();
    }
  }));
}
