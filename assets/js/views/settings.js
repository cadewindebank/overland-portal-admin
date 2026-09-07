import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, esc, toast, badge, num, deflist, textField, selectField } from '../ui.js';

export default function settings(view) {
  view.innerHTML = `
    ${pageHead({
      title: 'Settings',
      sub: 'Portal configuration — branding, routing, form links and integrations.',
      actions: `<button class="btn" id="save">Save changes</button>`
    })}

    <div class="grid grid--2">
      <div class="stack">
        ${card(`
          <div class="form-grid form-grid--2">
            ${textField('Organisation name', { value: 'Overland Missions', span: 2 })}
            ${textField('Portal URL', { value: 'portal.overlandmissions.com', span: 2 })}
            ${textField('Support email', { value: 'support@example.org', type: 'email' })}
            ${selectField('Default timezone', ['UTC', 'America/New_York', 'Africa/Lusaka'], { value: 'America/New_York' })}
            ${selectField('Fiscal year start', ['January', 'October'], { value: 'October' })}
            ${selectField('Default currency', ['USD'])}
          </div>`, { title: 'Organisation', icon: 'settings' })}

        ${card(`
          <p class="muted" style="margin-top:0">The brand tokens the portal renders with. These mirror the public site.</p>
          <div class="grid grid--4" style="gap:10px">
            ${[['Shadow','#0f0e0d'],['Flare','#ec4300'],['Bone','#ddd7ce'],['Sand','#baa283'],
               ['Slate','#393d36'],['Rain','#324360'],['Sap','#b4894c'],['Vine','#354c21'],
               ['Emerald Pine','#005744'],['Lagoon','#638791'],['Sprout','#859671'],['Bark','#865c42']].map(([n, hex]) => `
              <div style="border:1px solid var(--line);border-radius:3px;overflow:hidden">
                <div style="height:42px;background:${hex}"></div>
                <div style="padding:6px 8px"><div style="font-size:12px;font-weight:500">${n}</div>
                  <div class="muted" style="font-size:11px;font-variant-numeric:tabular-nums">${hex}</div></div>
              </div>`).join('')}
          </div>
          <div class="hr"></div>
          ${deflist([
            ['Display type', 'IBM Plex Sans Condensed SemiBold'],
            ['Body type', 'Work Sans'],
            ['Numerals & stats', 'Teko'],
            ['Primary button', 'Flare, uppercase, 11px / 1.12px tracking']
          ])}`, { title: 'Brand', icon: 'image' })}
      </div>

      <div class="stack">
        ${card(`
          <p class="muted" style="margin-top:0">Where each submitted form is routed for review.</p>
          ${D.REQUEST_TYPES.map(t => `
            <div class="row row--between" style="padding:10px 0;border-bottom:1px solid var(--line);gap:12px">
              <span style="display:flex;align-items:center;gap:9px;min-width:0">
                <span style="color:var(--slate);display:inline-flex">${icon(t.icon)}</span>${esc(t.label)}</span>
              <select data-route="${esc(t.key)}" style="max-width:180px"
                aria-label="Routing queue for ${esc(t.label)}">${['Finance','Media','Operations','People & Care','Leadership'].map(q =>
                `<option${q === t.queue ? ' selected' : ''}>${q}</option>`).join('')}</select>
            </div>`).join('')}`, { title: 'Form routing', icon: 'inbox' })}

        ${card(`
          <div class="stack">
            ${[
              ['Payment processor', 'Connected', 'Card and ACH giving'],
              ['Accounting export', 'Connected', 'Nightly journal sync'],
              ['Email delivery', 'Connected', 'Transactional and alert email'],
              ['Identity provider', 'Not connected', 'Single sign-on for staff'],
              ['Background checks', 'Connected', 'Applicant screening'],
              ['Travel insurance (TTc)', 'Connected', 'Policy issue and renewal']
            ].map(([n, s, d]) => `
              <div class="row row--between" style="padding:10px 0;border-bottom:1px solid var(--line);gap:12px">
                <div><strong>${esc(n)}</strong><div class="muted" style="font-size:12px">${esc(d)}</div></div>
                ${badge(s === 'Connected' ? 'Active' : 'Missing', s === 'Connected' ? 'approved' : 'draft')}
              </div>`).join('')}
          </div>`, { title: 'Integrations', icon: 'grid' })}

        ${card(`
          ${deflist([
            ['Accounts', num(D.users.length)],
            ['Expeditions', num(D.expeditions.length)],
            ['Donation records', num(D.donations.length)],
            ['Requests', num(D.requests.length)],
            ['Audit events retained', num(D.auditLog.length)],
            ['Data since', '1 January 2021']
          ])}
          <p class="muted" style="font-size:12.5px;margin-bottom:0">Balances accumulated before 1 January 2021 appear as a beginning balance on each account.</p>`,
          { title: 'Data', icon: 'chart' })}
      </div>
    </div>`;

  view.querySelector('#save').addEventListener('click', () => {
    const values = {};
    view.querySelectorAll('input, select').forEach(el => {
      const label = el.labels && el.labels[0] ? el.labels[0].textContent.trim() : el.id;
      if (label) values[label] = el.type === 'checkbox' ? el.checked : el.value;
    });
    try { localStorage.setItem('om.portal.settings', JSON.stringify(values)); } catch (_) {}
    const routed = view.querySelectorAll('[data-route]').length;
    toast(`Settings saved — ${routed} form routes and ${Object.keys(values).length} fields`);
  });

  // restore anything saved previously
  try {
    const saved = JSON.parse(localStorage.getItem('om.portal.settings') || '{}');
    view.querySelectorAll('input, select').forEach(el => {
      const label = el.labels && el.labels[0] ? el.labels[0].textContent.trim() : el.id;
      if (label && saved[label] !== undefined) {
        if (el.type === 'checkbox') el.checked = saved[label]; else el.value = saved[label];
      }
    });
  } catch (_) {}
}
