import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, dateTime, stat, num, modal, toast } from '../ui.js';
import * as store from '../store.js';

export default function mpd(view) {
  const render = () => mpd(view);
  const pending = D.pendingFunds();
  const atRisk = D.mpders.filter(m => m.phase === 'At Risk' || m.pct < 60);
  const coaches = {};
  D.mpders.forEach(m => (coaches[m.coach] = (coaches[m.coach] || 0) + 1));

  view.innerHTML = `
    ${pageHead({
      title: 'MPD',
      sub: 'Ministry partner development — coaches and MPDers, funds requests, pay approval, audit and reporting.',
      actions: `<button class="btn-mini" id="audit">${icon('history')} Run MPD audit</button>
                <button class="btn" id="approveAll">Approve pay run</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'MPDers', value: num(D.mpders.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Fully funded', value: num(D.mpders.filter(m => m.pct >= 100).length), accent: 'var(--emerald-pine)',
               meta: Math.round(D.mpders.filter(m => m.pct >= 100).length / D.mpders.length * 100) + '% of staff' })}
      ${stat({ label: 'At risk', value: num(atRisk.length), accent: 'var(--flare)', meta: 'Under 60% funded' })}
      ${stat({ label: 'Funds requests pending', value: num(pending.length), accent: 'var(--sap)',
               meta: usd0(D.sum(pending, r => r.requested)) })}
      ${stat({ label: 'Monthly support raised', value: usd0(D.sum(D.mpders, m => m.monthlyRaised)), accent: 'var(--lagoon)',
               meta: 'of ' + usd0(D.sum(D.mpders, m => m.monthlyGoal)) + ' goal' })}
    </div>

    <div class="tabs" id="tabs">
      ${['Funds requests','MPDers','Coaches','Audit','Reports'].map((t, i) =>
        `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="mpdBody"></div>`;

  const body = view.querySelector('#mpdBody');
  const tabs = {
    'Funds requests': () => {
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'MPD funds requests', rows: D.fundsRequests, pageSize: 15, sortKey: 'submitted', sortDir: 'desc',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'mpder', label: 'MPDer', render: r => `<a href="#/people/${r.userId}">${esc(r.mpder)}</a>` },
          { key: 'coach', label: 'Coach' },
          { key: 'period', label: 'Period' },
          { key: 'requested', label: 'Requested', className: 'num', render: r => usd(r.requested) },
          { key: 'available', label: 'Available', className: 'num',
            render: r => `<span style="color:${r.available < r.requested ? '#a32718' : 'inherit'}">${usd(r.available)}</span>` },
          { key: 'submitted', label: 'Submitted', render: r => dateTime(r.submitted) },
          { key: 'status', label: 'Status', render: r => badge(r.status) },
          { key: 'act', label: '', sortable: false, filter: false,
            render: r => r.status === 'Pending' ? `<button class="btn-mini btn-mini--go" data-ok="${r.id}">Approve</button>` : '' }
        ]
      }).mount(body.querySelector('#t'));
    },
    MPDers: () => {
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'MPDers', rows: D.mpders, pageSize: 20, sortKey: 'pct',
        onRowClick: m => { location.hash = '#/people/' + m.userId; },
        columns: [
          { key: 'name', label: 'MPDer', render: m => `<a href="#/people/${m.userId}">${esc(m.name)}</a>` },
          { key: 'coach', label: 'Coach' },
          { key: 'phase', label: 'Phase', render: m => badge(m.phase, m.phase === 'At Risk' ? 'denied' : m.phase === 'Fully Funded' ? 'approved' : 'review') },
          { key: 'monthlyGoal', label: 'Goal', className: 'num', render: m => usd0(m.monthlyGoal) },
          { key: 'monthlyRaised', label: 'Raised', className: 'num', render: m => usd0(m.monthlyRaised) },
          { key: 'pct', label: 'Funded', className: 'num',
            render: m => `<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
              <div class="progress${m.pct >= 100 ? ' progress--go' : ''}" style="width:64px"><i style="width:${Math.min(100, m.pct)}%"></i></div><strong>${m.pct}%</strong></div>` },
          { key: 'partners', label: 'Partners', className: 'num' },
          { key: 'newThisMonth', label: 'New', className: 'num' },
          { key: 'lapsedPartners', label: 'Lapsed', className: 'num' },
          { key: 'appointments', label: 'Appts', className: 'num' },
          { key: 'lastCoaching', label: 'Last coaching', render: m => shortDate(m.lastCoaching) }
        ]
      }).mount(body.querySelector('#t'));
    },
    Coaches: () => {
      const rows = Object.entries(coaches).map(([name, n], i) => {
        const mine = D.mpders.filter(m => m.coach === name);
        return {
          id: 'CH' + i, name, mpders: n,
          funded: mine.filter(m => m.pct >= 100).length,
          atRisk: mine.filter(m => m.pct < 60).length,
          avgPct: Math.round(D.sum(mine, m => m.pct) / Math.max(1, mine.length)),
          overdue: mine.filter(m => m.lastCoaching < '2026-07-07').length
        };
      });
      body.innerHTML = '<div id="t"></div>';
      new DataTable({
        title: 'MPD coaches', rows, pageSize: 15, columnFilters: false, sortKey: 'mpders', sortDir: 'desc',
        columns: [
          { key: 'name', label: 'Coach' },
          { key: 'mpders', label: 'MPDers', className: 'num' },
          { key: 'funded', label: 'Fully funded', className: 'num' },
          { key: 'atRisk', label: 'At risk', className: 'num',
            render: r => `<span style="color:${r.atRisk ? '#a32718' : 'inherit'}">${r.atRisk}</span>` },
          { key: 'avgPct', label: 'Avg funded', className: 'num', render: r => r.avgPct + '%' },
          { key: 'overdue', label: 'Coaching overdue', className: 'num' }
        ]
      }).mount(body.querySelector('#t'));
    },
    Audit: () => {
      body.innerHTML = card(`
        <p class="muted" style="margin-top:0">The MPD audit checks each account for the conditions that put support at risk.</p>
        <ul class="timeline">
          ${[
            [D.mpders.filter(m => m.pct < 60).length, 'Under 60% funded', 'Support level below the field minimum'],
            [D.mpders.filter(m => m.lapsedPartners > 5).length, 'More than five lapsed partners', 'Attrition outpacing new partners'],
            [D.mpders.filter(m => m.appointments < 4).length, 'Fewer than four appointments this month', 'Activity below the coaching standard'],
            [D.mpders.filter(m => m.lastCoaching < '2026-07-07').length, 'No coaching in 60 days', 'Coach follow-up overdue'],
            [D.fundsRequests.filter(r => r.available < r.requested).length, 'Requests exceeding available balance', 'Would put the account in deficit']
          ].map(([n, title, sub]) => `<li>
            <span class="timeline__icon">${icon(n ? 'alert' : 'checkCircle')}</span>
            <div class="timeline__body"><strong>${esc(title)}</strong>
              <div class="muted" style="font-size:12px">${esc(sub)}</div></div>
            <span class="timeline__when" style="color:${n ? '#a32718' : 'var(--emerald-pine)'}">${n}</span></li>`).join('')}
        </ul>`, { title: 'MPD audit — September 2026', icon: 'shield' });
    },
    Reports: () => {
      const byPhase = {};
      D.mpders.forEach(m => (byPhase[m.phase] = (byPhase[m.phase] || 0) + 1));
      body.innerHTML = `<div class="grid grid--2">
        ${card(`<ul class="timeline">
          ${Object.entries(byPhase).map(([p, n]) => `<li>
            <div class="timeline__body">${esc(p)}</div><span class="timeline__when">${n}</span></li>`).join('')}
        </ul>`, { title: 'MPDers by phase', icon: 'chart' })}
        ${card(`<ul class="timeline">
          ${[['Total monthly goal', usd0(D.sum(D.mpders, m => m.monthlyGoal))],
             ['Total monthly raised', usd0(D.sum(D.mpders, m => m.monthlyRaised))],
             ['Average funded', Math.round(D.sum(D.mpders, m => m.pct) / D.mpders.length) + '%'],
             ['Total partners', num(D.sum(D.mpders, m => m.partners))],
             ['New partners this month', num(D.sum(D.mpders, m => m.newThisMonth))],
             ['Lapsed partners', num(D.sum(D.mpders, m => m.lapsedPartners))]
          ].map(([k, v]) => `<li><div class="timeline__body">${esc(k)}</div><span class="timeline__when">${v}</span></li>`).join('')}
        </ul>`, { title: 'Summary', icon: 'chart',
          actions: '<button class="btn-mini" id="exportRep">Export</button>' })}
      </div>`;
      /* delegated on `body` above so it survives tab re-renders */
    }
  };
  tabs['Funds requests']();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });
  body.addEventListener('click', e => {
    const ok = e.target.closest('[data-ok]');
    if (ok) {
      const fr = D.fundsRequests.find(x => String(x.id) === ok.dataset.ok);
      if (fr.available < fr.requested) {
        return modal({
          title: 'Approve over available balance?', confirm: 'Approve anyway',
          body: `<div class="notice notice--stop">${esc(fr.mpder)} has ${usd(fr.available)} available but
            requested ${usd(fr.requested)} — approving puts the account
            ${usd(fr.requested - fr.available)} into deficit.</div>`,
          onConfirm: () => { store.update('fundsRequests', fr.id, { status: 'Approved' });
            toast('Funds request approved'); render(); }
        });
      }
      store.update('fundsRequests', fr.id, { status: 'Approved' });
      toast('Funds request approved');
      return render();
    }
    const ex = e.target.closest('#exportRep');
    if (ex) exportReport();
  });

  function exportReport() {
    const rows = [['MPDer','Coach','Phase','Monthly goal','Raised','Funded %','Partners','Lapsed']]
      .concat(D.mpders.map(m => [m.name, m.coach, m.phase, m.monthlyGoal, Math.round(m.monthlyRaised), m.pct, m.partners, m.lapsedPartners]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mpd-report.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    toast('MPD report exported');
  }

  view.querySelector('#audit').addEventListener('click', () => {
    const flagged = D.mpders.filter(m => m.pct < 60 || m.lapsedPartners > 5 || m.appointments < 4);
    flagged.slice(0, 10).forEach(m => store.create('tasks', {
      title: `MPD coaching check-in with ${m.name}`, assignee: m.coach, related: 'MPD',
      due: '2026-09-21', overdue: false, priority: m.pct < 40 ? 'Urgent' : 'High', status: 'Open'
    }, { silent: true }));
    toast(`Audit complete — ${flagged.length} accounts flagged, ${Math.min(10, flagged.length)} coaching tasks raised`);
    render();
  });
  view.querySelector('#approveAll').addEventListener('click', () => modal({
    title: 'Approve the MPD pay run', confirm: 'Approve pay run',
    body: `<p style="margin-top:0">${pending.length} pending requests totalling <strong>${usd0(D.sum(pending, r => r.requested))}</strong>.</p>
      <p class="muted">${D.fundsRequests.filter(r => r.available < r.requested).length} of them exceed the requester's available balance and will be held back.</p>`,
    onConfirm: () => {
      const payable = pending.filter(r => r.available >= r.requested);
      const held = pending.filter(r => r.available < r.requested);
      store.updateMany('fundsRequests', payable.map(r => r.id), { status: 'Approved' });
      toast(`${payable.length} approved${held.length ? `, ${held.length} held over available balance` : ''}`);
      render();
    }
  }));
}
