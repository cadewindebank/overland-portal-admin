import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, modal, toast, deflist } from '../ui.js';

export default function donationPages(view) {
  const submitted = D.donationPages.filter(p => p.status === 'Submitted');

  view.innerHTML = `
    ${pageHead({
      title: 'Donation Pages',
      sub: 'Personal giving pages created by staff. Review a submission before it goes live at portal.overlandmissions.com/donate/…',
      actions: `<button class="btn" id="newPage">Create a page</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Live pages', value: num(D.donationPages.filter(p => p.status === 'Live').length), accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Awaiting review', value: num(submitted.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Raised through pages', value: usd0(D.sum(D.donationPages, p => p.raised)), accent: 'var(--rain)' })}
      ${stat({ label: 'Page views', value: num(D.sum(D.donationPages, p => p.views)), accent: 'var(--lagoon)' })}
    </div>

    ${submitted.length ? card(`
      <div class="stack">
        ${submitted.map(p => `
          <div class="row row--between" style="border:1px solid var(--line);border-radius:3px;padding:14px;gap:14px">
            <div style="min-width:0">
              <strong>${esc(p.display)}</strong>
              <div class="muted" style="font-size:12.5px">portal.overlandmissions.com/donate/${esc(p.slug)} · rep ${esc(p.repCode)}</div>
            </div>
            <div class="row" style="gap:8px">
              <button class="btn-mini" data-preview="${p.id}">Preview</button>
              <button class="btn-mini btn-mini--danger" data-recall="${p.id}">Recall</button>
              <button class="btn-mini btn-mini--go" data-publish="${p.id}">Publish</button>
            </div>
          </div>`).join('')}
      </div>`, { title: `Awaiting review (${submitted.length})`, icon: 'flag' }) : ''}

    <div style="margin-top:18px" id="pagesTable"></div>`;

  new DataTable({
    title: 'Donation pages', rows: D.donationPages, pageSize: 15, sortKey: 'raised', sortDir: 'desc',
    columns: [
      { key: 'owner', label: 'Owner', render: p => `<a href="#/people/${p.userId}">${esc(p.owner)}</a>` },
      { key: 'display', label: 'Display name' },
      { key: 'slug', label: 'Page link', render: p => `<a class="rowlink" href="#/donation-pages">/donate/${esc(p.slug)}</a>` },
      { key: 'repCode', label: 'Rep code' },
      { key: 'views', label: 'Views', className: 'num', render: p => num(p.views) },
      { key: 'raised', label: 'Raised', className: 'num', render: p => usd0(p.raised) },
      { key: 'updated', label: 'Updated', render: p => shortDate(p.updated) },
      { key: 'status', label: 'Status', render: p => badge(p.status) },
      { key: 'act', label: '', sortable: false, filter: false, render: p => `<button class="btn-mini" data-view="${p.id}">Open</button>` }
    ]
  }).mount(view.querySelector('#pagesTable'));

  view.addEventListener('click', e => {
    const pub = e.target.closest('[data-publish]');
    const rec = e.target.closest('[data-recall]');
    const prv = e.target.closest('[data-preview]');
    const opn = e.target.closest('[data-view]');
    if (pub) return toast('Page published — now live');
    if (rec) return toast('Page recalled to the owner with a note');
    const p = D.donationPages.find(x => x.id === (prv?.dataset.preview || opn?.dataset.view));
    if (p) modal({
      title: p.display, confirm: p.status === 'Live' ? 'Recall page' : 'Publish page', cancel: 'Close',
      body: deflist([
        ['Owner', `<a href="#/people/${p.userId}">${esc(p.owner)}</a>`],
        ['Status', badge(p.status)],
        ['Page link', `portal.overlandmissions.com/donate/${esc(p.slug)}`],
        ['Rep code', esc(p.repCode)],
        ['Views', num(p.views)],
        ['Raised', usd0(p.raised)],
        ['Last updated', shortDate(p.updated)]
      ]) + `<div class="hr"></div><div class="field"><label>Reviewer note</label><textarea placeholder="Sent to the page owner."></textarea></div>`,
      onConfirm: () => toast(p.status === 'Live' ? 'Page recalled' : 'Page published')
    });
  });

  view.querySelector('#newPage').addEventListener('click', () => modal({
    title: 'Create a donation page', confirm: 'Create page',
    body: `<div class="stack">
      <div class="field"><label>Page owner</label><input list="ownerList" placeholder="Search staff"><datalist id="ownerList">${D.users.filter(u => u.type === 'Staff').slice(0, 40).map(u => `<option value="${esc(u.name)}">`).join('')}</datalist></div>
      <div class="field"><label>Display name</label><input placeholder="Jane Mwansa | Field Staff"></div>
      <div class="field"><label>Page slug</label><input placeholder="mwansajane"><div class="field__hint">portal.overlandmissions.com/donate/<strong>slug</strong></div></div>
      <div class="field"><label>Rep code</label><input placeholder="V002410"></div>
    </div>`,
    onConfirm: () => toast('Donation page created as a draft')
  }));
}
