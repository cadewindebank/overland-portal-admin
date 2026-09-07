import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, stat, card, usd0, num, esc, badge, relative, barChart, progress, DataTable, shortDate } from '../ui.js';

export default function dashboard(view) {
  const pending = D.pendingRequests();
  const urgent = pending.filter(r => r.priority === 'Urgent');
  const financialPending = pending.filter(r => r.amount != null);
  const ytd = D.sum(D.donations.filter(d => d.date >= '2026-01-01'), d => d.amount);
  const lastYtd = D.sum(D.donations.filter(d => d.date >= '2025-01-01' && d.date < '2026-01-01'), d => d.amount);
  const delta = lastYtd ? Math.round(((ytd - lastYtd) / lastYtd) * 100) : 0;
  const activeExp = D.expeditions.filter(e => e.status !== 'Closed');
  const overdueTasks = D.openTasks().filter(t => t.overdue);
  const expiringPassports = D.users.filter(u => u.passportExpiry && u.passportExpiry < '2027-03-07').length;

  view.innerHTML = `
    ${pageHead({
      title: 'Operations Dashboard',
      sub: `Everything awaiting a decision across giving, expeditions and the field, as of ${shortDate('2026-09-07')}.`,
      actions: `<a class="btn-mini" href="#/audit">${icon('history')} Audit log</a>
                <a class="btn" href="#/requests">Review queue</a>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Pending requests', value: num(pending.length), accent: 'var(--flare)',
               meta: `${urgent.length} marked urgent` })}
      ${stat({ label: 'Awaiting disbursement', value: usd0(D.sum(financialPending, r => r.amount)), accent: 'var(--sap)',
               meta: `${financialPending.length} financial requests` })}
      ${stat({ label: 'Giving YTD', value: usd0(ytd), accent: 'var(--emerald-pine)',
               delta: (delta >= 0 ? '+' : '') + delta + '% vs. last year' })}
      ${stat({ label: 'Active expeditions', value: num(activeExp.length), accent: 'var(--rain)',
               meta: `${num(D.sum(activeExp, e => e.roster.length))} people on rosters` })}
      ${stat({ label: 'Open applications', value: num(D.openApplications().length), accent: 'var(--lagoon)',
               meta: `${D.applications.filter(a => a.status === 'Interview').length} at interview stage` })}
    </div>

    <div class="grid grid--main">
      <div class="stack">
        ${card(`<div id="queueTable"></div>`, {
          title: 'Requests needing a decision', icon: 'inbox',
          actions: `<a class="btn-mini" href="#/requests">Open full queue</a>`
        })}

        ${card(barChart(D.givingByMonth), {
          title: 'Giving — trailing 12 months', icon: 'chart',
          actions: `<a class="btn-mini" href="#/donations">All donations</a>`
        })}

        ${card(`
          <div class="grid grid--2">
            ${activeExp.slice(0, 4).map(e => `
              <a href="#/expeditions/${e.id}" style="text-decoration:none;color:inherit;display:block;border:1px solid var(--line);border-radius:3px;padding:14px">
                <div class="row row--between" style="gap:8px">
                  <strong style="font-size:14.5px">${esc(e.name)}</strong>${badge(e.status)}
                </div>
                <div class="muted" style="font-size:12.5px;margin:2px 0 10px">
                  ${esc(e.country)} · departs ${shortDate(e.start)} · ${e.daysOut > 0 ? e.daysOut + ' days out' : 'in progress'}
                </div>
                ${progress(e.pct, e.pct >= 100)}
                <div class="row row--between" style="font-size:12.5px;margin-top:6px">
                  <span class="muted">${usd0(e.raised)} of ${usd0(e.goal)}</span>
                  <span><strong>${e.pct}%</strong> funded · ${e.roster.length}/${e.capacity} team</span>
                </div>
              </a>`).join('')}
          </div>`, {
          title: 'Expeditions in motion', icon: 'compass',
          actions: `<a class="btn-mini" href="#/expeditions">View all</a>`
        })}
      </div>

      <div class="stack">
        ${card(`
          <ul class="timeline">
            ${attention([
              [overdueTasks.length, `${overdueTasks.length} overdue tasks`, 'Assigned work past its due date.', '#/tasks', 'clock'],
              [urgent.length, `${urgent.length} urgent requests`, 'Flagged urgent by the requester.', '#/requests', 'alert'],
              [expiringPassports, `${expiringPassports} passports expiring`, 'Within the next six months.', '#/people', 'passport'],
              [D.users.filter(u => u.insurance === 'Missing').length, `${D.users.filter(u => u.insurance === 'Missing').length} without insurance`, 'Field staff missing current cover.', '#/staff', 'shield'],
              [D.donationPages.filter(p => p.status === 'Submitted').length, `${D.donationPages.filter(p => p.status === 'Submitted').length} pages to publish`, 'Donation pages awaiting review.', '#/donation-pages', 'flag']
            ])}
          </ul>`, { title: 'Needs attention', icon: 'alert' })}

        ${card(`
          <ul class="timeline">
            ${D.auditLog.slice(0, 9).map(l => `
              <li>
                <span class="timeline__icon">${icon(auditIcon(l.action))}</span>
                <div class="timeline__body">
                  <div><strong>${esc(l.actor)}</strong> ${esc(l.label.toLowerCase())}</div>
                  <div class="muted" style="font-size:12px">${esc(l.target)} · ${esc(l.result)}</div>
                </div>
                <span class="timeline__when">${relative(l.when)}</span>
              </li>`).join('')}
          </ul>`, {
          title: 'Recent activity', icon: 'history',
          actions: `<a class="btn-mini" href="#/audit">All</a>`
        })}
      </div>
    </div>`;

  new DataTable({
    title: 'Decision queue',
    rows: pending.slice(0, 40),
    pageSize: 8,
    columnFilters: false,
    sortKey: 'submitted', sortDir: 'desc',
    onRowClick: r => { location.hash = '#/requests/' + r.id; },
    columns: [
      { key: 'id', label: 'ID', render: r => `<a href="#/requests/${r.id}">${r.id}</a>` },
      { key: 'typeLabel', label: 'Type' },
      { key: 'requester', label: 'Requester' },
      { key: 'summary', label: 'Summary', render: r => `<span title="${esc(r.summary)}">${esc(r.summary.slice(0, 46))}${r.summary.length > 46 ? '…' : ''}</span>` },
      { key: 'amount', label: 'Amount', className: 'num', render: r => r.amount == null ? '—' : usd0(r.amount) },
      { key: 'priority', label: 'Priority', render: r => r.priority === 'Urgent' ? badge('Urgent') : esc(r.priority) },
      { key: 'status', label: 'Status', render: r => badge(r.status) }
    ]
  }).mount(view.querySelector('#queueTable'));
}

function attention(rows) {
  return rows.filter(([n]) => n > 0).map(([n, title, sub, href, ic]) => `
    <li>
      <span class="timeline__icon">${icon(ic)}</span>
      <div class="timeline__body">
        <div><a href="${href}"><strong>${esc(title)}</strong></a></div>
        <div class="muted" style="font-size:12px">${esc(sub)}</div>
      </div>
    </li>`).join('') || '<li><div class="timeline__body muted">Nothing needs attention right now.</div></li>';
}

function auditIcon(a) {
  if (a.startsWith('request')) return 'inbox';
  if (a.startsWith('donation')) return 'give';
  if (a.startsWith('user') || a.startsWith('role')) return 'person';
  if (a.startsWith('passport')) return 'passport';
  if (a.startsWith('expedition')) return 'compass';
  if (a.startsWith('session')) return 'device';
  if (a.startsWith('export')) return 'download';
  return 'history';
}
