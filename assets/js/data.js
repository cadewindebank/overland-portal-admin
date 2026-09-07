/* ==========================================================================
   Mock dataset for the Overland Missions admin portal.
   Deterministic (seeded) so screenshots and demos are stable.
   Swap this module for real API calls — every view consumes it through the
   small accessor functions at the bottom of the file.
   ========================================================================== */

/* --- seeded PRNG (mulberry32) -------------------------------------------- */
let _s = 20260907;
function rnd() {
  _s |= 0; _s = (_s + 0x6D2B79F5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const money = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) * 100) / 100;
const chance = p => rnd() < p;

/* --- reference lists ------------------------------------------------------ */
export const TODAY = new Date('2026-09-07T09:00:00');

const FIRST = ['Cade','Jasmin','Elijah','Brooke','Macie','Florence','Cody','Matthew','Britney','Chrisolythe','Abigail','Tim','Gale','Brandon','Ryann','Bailey','Steven','Devon','Josh','Naomi','Silas','Priya','Marcus','Hannah','Tobias','Imani','Grace','Owen','Lydia','Caleb','Esther','Jonah','Ruth','Andile','Thandiwe','Mateus','Sofia','Nadia','Karim','Yousef','Lena','Peter','Rachel','Simeon','Delphine','Kofi','Amara','Ezra','Talitha','Dominic'];
const LAST  = ['Rivera','DeMarco','Anderson','TerHaar','Bassi','McGuire','Shaylor','Stotler','Ndunguna','Court','Edwards','Murray','Combrink','Holt','Eshak','Mwansa','Banda','Phiri','Tembo','Chirwa','Okafor','Mensah','Haddad','Nasser','Silva','Costa','Ferreira','Van Dyk','Botha','Pretorius','Kowalski','Fitzgerald','Ramirez','Whitfield','Osei','Abara','Mutale','Zulu','Kalunga','Sibanda'];

const CITIES = [
  ['Lakeland','Colorado','United States'], ['Lakeland','Florida','United States'],
  ['New Brighton','Pennsylvania','United States'], ['Mineral Wells','Texas','United States'],
  ['Hudsonville','Michigan','United States'], ['Gibsonia','Pennsylvania','United States'],
  ['Pittsburgh','Pennsylvania','United States'], ['Mayfield Heights','Ohio','United States'],
  ['Berkeley Springs','West Virginia','United States'], ['Livingstone','Southern','Zambia'],
  ['Lusaka','Lusaka','Zambia'], ['Pemba','Cabo Delgado','Mozambique'],
  ['Cairo','Cairo','Egypt'], ['Beirut','Beirut','Lebanon'],
  ['Iquitos','Loreto','Peru'], ['Cape Town','Western Cape','South Africa'],
  ['Nashville','Tennessee','United States'], ['Greenville','South Carolina','United States']
];

const DEPARTMENTS = ['Field Operations','Expeditions','Development','Finance','Media','People & Care','IT','Base Operations','Aviation','Chaplaincy'];
const BASES = ['Livingstone, Zambia','Pemba, Mozambique','Cairo, Egypt','Beirut, Lebanon','Iquitos, Peru','Lakeland, Florida','Remote'];
const ROLES = ['Administrator','Finance','Expedition Leader','Base Director','Staff','Media','Donor Relations','Read Only'];
const SECTORS = ['Southern Africa','East Africa','North Africa','Middle East','South America','Global'];

/* --- users ---------------------------------------------------------------- */
function makeName() { return [pick(FIRST), pick(LAST)]; }

export const users = [];
const seen = new Set();
for (let i = 0; i < 148; i++) {
  let f, l, key, guard = 0;
  do { [f, l] = makeName(); key = f + l; } while (seen.has(key) && guard++ < 40);
  seen.add(key);
  const [city, region, country] = pick(CITIES);
  const isStaff = i < 62;
  users.push({
    id: 'U' + String(1000 + i),
    first: f, last: l,
    name: `${f} ${l}`,
    username: (l + f[0]).toLowerCase(),
    email: `${f[0].toLowerCase()}${l.toLowerCase().replace(/[^a-z]/g, '')}@example.org`,
    phone: `${int(200, 989)}${int(200, 989)}${int(1000, 9999)}`,
    city, region, country,
    type: isStaff ? 'Staff' : (chance(.55) ? 'Expedition Member' : 'Donor'),
    department: isStaff ? pick(DEPARTMENTS) : '—',
    base: isStaff ? pick(BASES) : '—',
    role: isStaff ? (i < 4 ? 'Administrator' : (i < 10 ? pick(['Finance','Base Director']) : pick(ROLES))) : 'Read Only',
    sector: pick(SECTORS),
    status: chance(.9) ? 'Active' : pick(['Suspended', 'Invited']),
    twoFactor: chance(.42),
    passportExpiry: chance(.85) ? isoDate(int(60, 2400)) : null,
    insurance: chance(.7) ? 'Current' : (chance(.5) ? 'Expiring' : 'Missing'),
    balance: isStaff ? money(-1200, 24000) : 0,
    lastLogin: isoDateTime(-int(0, 60)),
    joined: isoDate(-int(120, 3200))
  });
}
users[0] = Object.assign(users[0], {
  id: 'U1000', first: 'Cade', last: 'Rivera', name: 'Alex Rivera',
  username: 'riveraa', email: 'ariveraa@example.org', phone: '5550100',
  city: 'Lakeland', region: 'Colorado', country: 'United States',
  type: 'Staff', department: 'Chaplaincy', base: 'Lakeland, Florida',
  role: 'Administrator', sector: 'Global', status: 'Active', balance: 8600
});

export const me = users[0];

/* --- expeditions ---------------------------------------------------------- */
const EXPEDITION_DEFS = [
  ['2026 AMT Mozambique May', 'Mozambique', 'Southern Africa', '2026-05-12', 89, 7677, 20],
  ['2026 AMT Zambia May',     'Zambia',     'Southern Africa', '2026-05-04', 74, 6400, 18],
  ['2026 Egypt Team 1',       'Egypt',      'North Africa',    '2026-10-18', 42, 3900, 12],
  ['2026 Peru Amazon Team 2', 'Peru',       'South America',   '2026-11-02', 56, 4250, 14],
  ['2026 Lebanon Team 1',     'Lebanon',    'Middle East',     '2026-12-01', 30, 3100, 10],
  ['2025 Egypt Team 1',       'Egypt',      'North Africa',    '2025-05-14', 10, 3857.89, 9],
  ['2025 North Africa Team 1','Morocco',    'North Africa',    '2025-05-15', 10, 3400, 10],
  ['2027 AMT Zambia Jan',     'Zambia',     'Southern Africa', '2027-01-11', 96, 7100, 22],
  ['2026 Mozambique Medical', 'Mozambique', 'Southern Africa', '2026-09-28', 14, 5200, 16],
  ['2026 Zambia Build Team',  'Zambia',     'Southern Africa', '2026-10-05', 12, 2900, 24]
];

export const expeditions = EXPEDITION_DEFS.map((d, i) => {
  const [name, country, sector, start, days, cost, cap] = d;
  const startDate = new Date(start + 'T20:00:00');
  const roster = [];
  const size = Math.min(cap, int(Math.max(4, cap - 9), cap));
  const usedIdx = new Set();
  for (let r = 0; r < size; r++) {
    let idx; let guard = 0;
    do { idx = int(0, users.length - 1); } while (usedIdx.has(idx) && guard++ < 60);
    usedIdx.add(idx);
    const u = users[idx];
    const raised = money(0, cost * 1.05);
    roster.push({
      userId: u.id, name: u.name, city: u.city, region: u.region,
      role: r === 0 ? 'Leader' : (r === 1 ? 'Leader' : (r < 4 ? 'Co-Leader' : 'Team Member')),
      raised: Math.min(raised, cost),
      pct: Math.min(100, Math.round((raised / cost) * 100)),
      passport: chance(.86), flight: chance(.6), insurance: chance(.72), forms: chance(.55)
    });
  }
  const raisedTotal = roster.reduce((s, m) => s + m.raised, 0);
  const goalTotal = cost * roster.length;
  const daysOut = Math.round((startDate - TODAY) / 86400000);
  return {
    id: 'E' + String(2100 + i),
    code: `${country.slice(0, 3).toUpperCase()}-${start.slice(0, 4)}-${i + 1}`,
    name, country, sector, start,
    end: isoFrom(startDate, days),
    days, cost, capacity: cap,
    status: daysOut < 0 ? 'Closed' : (daysOut < 45 ? 'Locked' : 'Open'),
    daysOut,
    leader: roster[0] ? roster[0].name : '—',
    roster,
    raised: raisedTotal,
    goal: goalTotal,
    pct: goalTotal ? Math.round((raisedTotal / goalTotal) * 100) : 0,
    resources: ['Orientation Packet', 'Team Meeting Notes', 'Support Raising Bible Study', 'Packing & To-Do List', 'Field Risk Assessment'].slice(0, int(3, 5))
  };
});

/* --- expedition applications ---------------------------------------------- */
const APP_STATUS = ['Submitted', 'In Review', 'Interview', 'Accepted', 'Waitlisted', 'Declined'];
export const applications = Array.from({ length: 64 }, (_, i) => {
  const u = pick(users);
  const e = pick(expeditions);
  return {
    id: 'A' + String(4400 + i),
    userId: u.id, name: u.name, email: u.email,
    expedition: e.name, expeditionId: e.id,
    amt: chance(.35) ? 'Yes' : 'No',
    submitted: isoDateTime(-int(1, 320)),
    status: pick(APP_STATUS),
    reference: chance(.8) ? 'Received' : 'Pending',
    background: chance(.7) ? 'Clear' : 'Pending',
    about: 'I first heard about Overland Missions through my home church and have been praying about serving on a team.',
    history: chance(.5) ? 'Yes, I have served on two previous expeditions.' : 'This would be my first expedition.',
    testimony: 'I grew up in a Christian home and made my faith my own in high school.'
  };
});

/* --- donations ------------------------------------------------------------ */
const TX_TYPE = ['Donation', 'Transaction', 'Adjustment', 'Refund'];
const FUNDS = ['General Fund', 'Staff Support', 'Expedition Fund', 'Base Development', 'Medical Outreach', 'Aviation', 'Water Projects'];
const METHODS = ['MasterCard', 'Visa', 'ACH', 'Check', 'Wire', 'Stock', 'DAF'];

export const donations = Array.from({ length: 420 }, (_, i) => {
  const d = pick(users);
  const rep = pick(users.filter(u => u.type === 'Staff'));
  const amt = chance(.08) ? money(1000, 12000) : money(15, 900);
  return {
    id: 'D' + String(70000 + i),
    date: isoDate(-int(0, 640)),
    amount: amt,
    type: chance(.72) ? 'Donation' : pick(TX_TYPE),
    fund: pick(FUNDS),
    method: pick(METHODS),
    recurring: chance(.24),
    donor: d.name, donorId: d.id,
    rep: rep.name, repCode: 'A' + int(1000, 4999),
    designation: chance(.6) ? rep.name : pick(FUNDS),
    receipted: chance(.93),
    memo: pick(['Monthly support', 'Revival Week Offering 2026', 'From Aunt April and Uncle Bob!', 'Generous people!', 'MEMO LEFT BLANK', 'Brazil Boat — OM Conference', 'Thank you for your service'])
  };
});

/* --- donation pages ------------------------------------------------------- */
export const donationPages = Array.from({ length: 34 }, (_, i) => {
  const u = users[i + 1];
  return {
    id: 'P' + String(900 + i),
    userId: u.id,
    owner: u.name,
    slug: (u.last + u.first).toLowerCase(),
    display: `${u.name} | ${pick(['Tribal Chaplaincy', 'Field Staff', 'Aviation', 'Medical Outreach', 'Base Development'])}`,
    repCode: 'V' + String(2400 + i),
    status: chance(.65) ? 'Live' : pick(['Submitted', 'Draft', 'Recalled']),
    views: int(40, 4200),
    raised: money(200, 42000),
    updated: isoDate(-int(1, 300))
  };
});

/* --- requests (the approval queues) --------------------------------------- */
export const REQUEST_TYPES = [
  { key: 'wire',      label: 'Wire Request',       icon: 'wire',      queue: 'Finance' },
  { key: 'transfer',  label: 'Transfer Request',   icon: 'transfer',  queue: 'Finance' },
  { key: 'mpd',       label: 'MPD Pay Request',    icon: 'dollar',    queue: 'Finance' },
  { key: 'flex',      label: 'Flex Pay Request',   icon: 'bank',      queue: 'Finance' },
  { key: 'media',     label: 'Media Request',      icon: 'camera',    queue: 'Media' },
  { key: 'project',   label: 'Project Request',    icon: 'home',      queue: 'Operations' },
  { key: 'insurance', label: 'TTc Insurance',      icon: 'plane',     queue: 'People & Care' },
  { key: 'incident',  label: 'Incident Report',    icon: 'alert',     queue: 'People & Care' },
  { key: 'overflow',  label: 'OMM Overflow',       icon: 'inbox',     queue: 'Operations' }
];

const REQ_STATUS = ['Pending', 'In Review', 'Approved', 'Paid', 'Denied'];

export const requests = Array.from({ length: 176 }, (_, i) => {
  const t = pick(REQUEST_TYPES);
  const u = pick(users);
  const st = chance(.34) ? 'Pending' : pick(REQ_STATUS);
  const financial = ['wire', 'transfer', 'mpd', 'flex'].includes(t.key);
  return {
    id: 'R' + String(58000 + i),
    type: t.key,
    typeLabel: t.label,
    queue: t.queue,
    submitted: isoDateTime(-int(0, 120)),
    requester: u.name, requesterId: u.id,
    department: u.department === '—' ? 'Field' : u.department,
    amount: financial ? money(120, 14500) : null,
    currency: pick(['USD', 'USD', 'USD', 'ZMW', 'MZN', 'EGP']),
    status: st,
    priority: chance(.16) ? 'Urgent' : (chance(.4) ? 'High' : 'Normal'),
    assignee: chance(.7) ? pick(users.slice(0, 12)).name : null,
    expedition: chance(.4) ? pick(expeditions).name : null,
    summary: requestSummary(t.key),
    detail: requestDetail(t.key),
    thread: buildThread(st)
  };
});

function requestSummary(k) {
  return {
    wire: pick(['Wire to Livingstone base — September operating', 'Wire to Pemba — vehicle repair', 'Wire to Cairo partner — facility rent']),
    transfer: pick(['Transfer from expedition surplus to staff account', 'Transfer between staff accounts — team gift', 'Transfer to general fund']),
    mpd: pick(['September MPD pay request', 'October MPD pay request', 'Catch-up pay request — Q3']),
    flex: pick(['Flex pay — medical reimbursement', 'Flex pay — visa renewal costs', 'Flex pay — language school tuition']),
    media: pick(['Photo/video coverage for May Mozambique team', 'Promo edit for Revival Week 2026', 'Headshots for new staff cohort']),
    project: pick(['Borehole drilling — Simonga village', 'Solar install for base clinic', 'Classroom block phase 2']),
    insurance: pick(['TTc travel insurance — Egypt Team 1', 'TTc insurance renewal — field staff', 'TTc insurance — short-term visitors']),
    incident: pick(['Vehicle incident on Nakatindi Road', 'Minor injury during build project', 'Lost passport reported in transit']),
    overflow: pick(['OMM overflow lodging for 6 guests', 'Overflow vehicle request — conference week', 'Overflow catering support'])
  }[k];
}
function requestDetail(k) {
  return {
    wire: 'Funds to be wired to the receiving account on file. Beneficiary details verified against the vendor record. Requesting settlement within five business days.',
    transfer: 'Internal transfer between Overland accounts. No external settlement required. Both parties have acknowledged the transfer in writing.',
    mpd: 'Standard monthly ministry partner development draw against the requester’s available support balance.',
    flex: 'Flex pay drawn against available balance for the itemised expenses attached. Receipts uploaded.',
    media: 'Requesting media team coverage. Deliverables: 1 highlight reel (90s), 25 edited stills, and raw footage archived to the shared drive.',
    project: 'Capital project request with scope, budget and local partner sign-off attached. Requesting review by the operations committee.',
    insurance: 'Travel and trip cancellation insurance for the listed participants. Passport details and dates of travel attached.',
    incident: 'Incident reported per the field safety policy. No serious injury. Local leadership notified and follow-up scheduled.',
    overflow: 'Overflow support request outside the normal booking window. Dates and headcount attached.'
  }[k];
}
function buildThread(status) {
  const t = [{ who: 'System', when: isoDateTime(-int(2, 40)), text: 'Request submitted and routed to the queue.' }];
  if (status !== 'Pending') t.push({ who: pick(users.slice(0, 8)).name, when: isoDateTime(-int(1, 20)), text: 'Picked this up for review — checking the supporting documents.' });
  if (['Approved', 'Paid'].includes(status)) t.push({ who: pick(users.slice(0, 8)).name, when: isoDateTime(-int(0, 8)), text: 'Approved. Documentation is complete and the balance covers the amount.' });
  if (status === 'Denied') t.push({ who: pick(users.slice(0, 8)).name, when: isoDateTime(-int(0, 8)), text: 'Denied — insufficient available balance. Please resubmit after the next disbursement.' });
  return t;
}

/* --- budgets -------------------------------------------------------------- */
export const budgets = [
  ['Field Operations', 'Southern Africa', 480000], ['Expeditions', 'Global', 640000],
  ['Base Development', 'Southern Africa', 310000], ['Media', 'Global', 145000],
  ['Aviation', 'Southern Africa', 220000], ['People & Care', 'Global', 98000],
  ['IT & Systems', 'Global', 132000], ['North Africa Operations', 'North Africa', 205000],
  ['Middle East Operations', 'Middle East', 178000], ['South America Operations', 'South America', 164000]
].map(([name, sector, budget], i) => {
  const spent = Math.round(budget * (0.35 + rnd() * 0.62));
  const committed = Math.round((budget - spent) * rnd() * 0.6);
  return {
    id: 'B' + String(300 + i), name, sector, fy: 'FY2026',
    budget, spent, committed,
    remaining: budget - spent - committed,
    pct: Math.round((spent / budget) * 100),
    owner: pick(users.slice(0, 14)).name
  };
});

/* --- tasks ---------------------------------------------------------------- */
export const tasks = Array.from({ length: 48 }, (_, i) => {
  const due = int(-14, 40);
  return {
    id: 'T' + String(6600 + i),
    title: pick([
      'Verify passport scan', 'Review expedition roster', 'Approve wire batch',
      'Follow up on lapsed recurring gift', 'Confirm insurance renewal',
      'Publish donation page', 'Close out expedition finances', 'Send receipt corrections',
      'Collect background check', 'Update base inventory', 'Schedule team meeting',
      'Reconcile petty cash', 'Onboard new staff account'
    ]),
    assignee: pick(users.slice(0, 20)).name,
    related: chance(.6) ? pick(expeditions).name : pick(['Finance', 'Media', 'People & Care']),
    due: isoDate(due),
    overdue: due < 0,
    priority: chance(.2) ? 'Urgent' : (chance(.45) ? 'High' : 'Normal'),
    status: due < 0 ? 'Open' : pick(['Open', 'Open', 'In Progress', 'Blocked', 'Done'])
  };
});

/* --- alerts --------------------------------------------------------------- */
export const alerts = Array.from({ length: 22 }, (_, i) => ({
  id: 'N' + String(800 + i),
  title: pick([
    'System maintenance window Saturday 02:00 UTC',
    'New cybersecurity policy published',
    'Expedition applications now open for 2027 Zambia',
    'Reminder: submit Q3 expense reports',
    'Passport expiring within 90 days for 6 team members',
    'Payment processor certificate renewal'
  ]),
  audience: pick(['All Users', 'Staff', 'Leaders', 'Expedition Members', 'Donors']),
  channel: pick(['Portal', 'Portal + Email', 'Email']),
  status: pick(['Sent', 'Sent', 'Scheduled', 'Draft']),
  sent: isoDateTime(-int(0, 90)),
  reach: int(40, 2400),
  opened: int(20, 1800)
}));

/* --- media library -------------------------------------------------------- */
export const mediaAssets = Array.from({ length: 30 }, (_, i) => ({
  id: 'M' + String(500 + i),
  name: pick(['Zambia_Village_Sunrise', 'Pemba_Beach_Team', 'Egypt_Cairo_Skyline', 'Amazon_River_Boat', 'Base_Clinic_Build', 'Team_Worship_Night', 'Aviation_Cessna_Takeoff', 'Water_Well_Dedication']) + '_' + int(1, 40),
  kind: pick(['Photo', 'Photo', 'Photo', 'Video', 'Logo', 'Document']),
  collection: pick(['Brand Guide', 'Expedition Media', 'Field Stories', 'Logos & Marks', 'Writing Guide']),
  size: pick(['2.4 MB', '18.9 MB', '440 KB', '112 MB', '6.1 MB']),
  license: pick(['Internal', 'Public', 'Restricted']),
  uploaded: isoDate(-int(3, 700)),
  by: pick(users.slice(0, 20)).name
}));

/* --- audit log ------------------------------------------------------------ */
const AUDIT_ACTIONS = [
  ['user.login', 'Signed in'], ['user.update', 'Updated personal information'],
  ['request.approve', 'Approved a request'], ['request.deny', 'Denied a request'],
  ['donation.refund', 'Issued a refund'], ['role.grant', 'Granted a role'],
  ['page.publish', 'Published a donation page'], ['passport.upload', 'Uploaded a passport scan'],
  ['expedition.lock', 'Locked an expedition roster'], ['export.csv', 'Exported a CSV'],
  ['session.revoke', 'Revoked a device session'], ['policy.publish', 'Published a policy update']
];
export const auditLog = Array.from({ length: 220 }, (_, i) => {
  const [action, label] = pick(AUDIT_ACTIONS);
  const u = pick(users.slice(0, 30));
  return {
    id: 'L' + String(90000 + i),
    when: isoDateTime(-int(0, 45), true),
    actor: u.name, actorId: u.id,
    action, label,
    target: pick(['U1042', 'R58032', 'E2101', 'D70119', 'P0903', 'B0302']),
    ip: `${int(24, 213)}.${int(1, 250)}.${int(1, 250)}.${int(1, 250)}`,
    result: chance(.94) ? 'Success' : 'Denied'
  };
});

/* --- device sessions ------------------------------------------------------ */
export const sessions = Array.from({ length: 26 }, (_, i) => {
  const u = pick(users.slice(0, 40));
  return {
    id: 'S' + String(7700 + i),
    user: u.name, userId: u.id,
    device: pick(['MacBook Pro', 'iPhone 17 Pro', 'Windows 11 Desktop', 'iPad Air', 'Pixel 9', 'Linux Workstation']),
    browser: pick(['Safari 26', 'Chrome 141', 'Firefox 134', 'Edge 140']),
    location: pick(['Lakeland, US', 'Lakeland, US', 'Livingstone, ZM', 'Pemba, MZ', 'Cairo, EG', 'Beirut, LB']),
    ip: `${int(24, 213)}.${int(1, 250)}.${int(1, 250)}.${int(1, 250)}`,
    lastSeen: isoDateTime(-int(0, 20), true),
    current: i === 0,
    trusted: chance(.6)
  };
});

/* --- monthly giving series (for the dashboard chart) ---------------------- */
export const givingByMonth = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']
  .map((m, i) => ({ month: m, total: Math.round(120000 + rnd() * 190000 + (i === 2 ? 160000 : 0)) }));

/* ==========================================================================
   Date helpers
   ========================================================================== */
function isoDate(offsetDays) {
  const d = new Date(TODAY.getTime() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}
function isoFrom(date, days) {
  return new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10);
}
function isoDateTime(offsetDays, withSeconds) {
  const d = new Date(TODAY.getTime() + offsetDays * 86400000 - int(0, 20) * 3600000);
  return withSeconds ? d.toISOString().slice(0, 19).replace('T', ' ') : d.toISOString().slice(0, 16).replace('T', ' ');
}

/* ==========================================================================
   Accessors — the seam where a real API would plug in
   ========================================================================== */
export const findUser       = id => users.find(u => u.id === id);
export const findExpedition = id => expeditions.find(e => e.id === id);
export const findRequest    = id => requests.find(r => r.id === id);
export const pendingRequests = () => requests.filter(r => r.status === 'Pending' || r.status === 'In Review');
export const openApplications = () => applications.filter(a => ['Submitted', 'In Review', 'Interview'].includes(a.status));
export const openTasks = () => tasks.filter(t => t.status !== 'Done');
export const userDonations = id => donations.filter(d => d.donorId === id);
export const userRequests = id => requests.filter(r => r.requesterId === id);
export const userExpeditions = id =>
  expeditions.filter(e => e.roster.some(m => m.userId === id))
             .map(e => ({ ...e, membership: e.roster.find(m => m.userId === id) }));

export const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);

/* ==========================================================================
   Phase 2 — entities from the Overland Missions mind map
   (CRM, MPD, Admin Finance, Marketing, General Admin)
   ========================================================================== */

/* --- CRM contacts --------------------------------------------------------- */
export const CONTACT_BUCKETS = ['Recruiting', 'MPD', 'Church Network', 'Personal', 'Ministry', 'Staff'];
const CHURCHES = ['Grace Fellowship', 'Cornerstone Church', 'Living Water Chapel', 'Redeemer City Church',
  'Faith Bible Church', 'New Hope Assembly', 'The Rock Church', 'Harvest Community'];

export const contacts = Array.from({ length: 260 }, (_, i) => {
  const [f, l] = [pick(FIRST), pick(LAST)];
  const [city, region, country] = pick(CITIES);
  const bucket = pick(CONTACT_BUCKETS);
  const lastGift = chance(.55) ? isoDate(-int(5, 900)) : null;
  const lifetime = lastGift ? money(50, 26000) : 0;
  return {
    id: 'C' + String(30000 + i),
    name: `${f} ${l}`, first: f, last: l,
    email: `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    phone: `${int(200, 989)}${int(200, 989)}${int(1000, 9999)}`,
    bucket,
    owner: pick(users.slice(0, 24)).name,
    city, region, country,
    church: bucket === 'Church Network' || chance(.4) ? pick(CHURCHES) : '—',
    birthday: isoDate(-int(6000, 22000)).slice(5),
    stage: pick(['New', 'Contacted', 'Meeting Set', 'Committed', 'Giving', 'Lapsed', 'Cold']),
    score: int(1, 100),
    lifetime,
    lastGift,
    lapsed: !!lastGift && lastGift < '2025-09-07',
    recurring: chance(.2),
    lastTouch: isoDate(-int(0, 220)),
    tags: [bucket, chance(.3) ? 'Past Team Member' : null, chance(.2) ? 'Monthly Partner' : null].filter(Boolean),
    notes: int(0, 9),
    relationships: chance(.35) ? `Spouse of ${pick(FIRST)} ${l}` : null
  };
});

export const CONTACT_STAGES = ['New', 'Contacted', 'Meeting Set', 'Committed', 'Giving', 'Lapsed', 'Cold'];

/* --- reminders & events --------------------------------------------------- */
export const reminders = Array.from({ length: 54 }, (_, i) => {
  const off = int(-30, 45);
  const c = pick(contacts);
  return {
    id: 'RM' + String(4000 + i),
    title: pick(['Follow up on partnership ask', 'Send thank-you note', 'Call after church visit',
      'Share newsletter', 'Coffee meeting', 'Check in before departure', 'Send year-end receipt']),
    contact: c.name, contactId: c.id,
    owner: pick(users.slice(0, 20)).name,
    due: isoDate(off),
    past: off < 0,
    channel: pick(['Call', 'Email', 'Text', 'In person']),
    status: off < 0 ? pick(['Open', 'Open', 'Done']) : 'Open'
  };
});

export const events = Array.from({ length: 28 }, (_, i) => {
  const off = int(-180, 150);
  return {
    id: 'EV' + String(500 + i),
    title: pick(['Support banquet', 'Church presentation', 'Vision night', 'Team commissioning',
      'Donor lunch', 'Info meeting', 'Revival Week', 'Alumni gathering']),
    date: isoDate(off),
    past: off < 0,
    location: pick(['Lakeland, FL', 'Lakeland, CO', 'Nashville, TN', 'Online', 'Greenville, SC']),
    host: pick(users.slice(0, 20)).name,
    invited: int(15, 340),
    attended: off < 0 ? int(8, 260) : 0,
    raised: off < 0 ? money(0, 42000) : 0
  };
});

/* --- recruiting ----------------------------------------------------------- */
export const signups = Array.from({ length: 46 }, (_, i) => {
  const c = pick(contacts);
  const e = pick(expeditions);
  return {
    id: 'SU' + String(700 + i),
    name: c.name, contactId: c.id,
    email: c.email,
    interest: chance(.4) ? 'AMT' : 'Expedition',
    target: e.name,
    source: pick(['Sign Up Sheet', 'Website', 'Church visit', 'Referral', 'Instagram', 'Past team member']),
    created: isoDate(-int(0, 260)),
    assigned: chance(.7) ? pick(users.slice(0, 18)).name : null,
    converted: chance(.3),
    status: pick(['New', 'Contacted', 'Applied', 'Not now'])
  };
});

/* --- marketing ------------------------------------------------------------ */
export const campaigns = Array.from({ length: 22 }, (_, i) => {
  const sent = int(300, 5200);
  const opened = Math.round(sent * (0.2 + rnd() * 0.5));
  return {
    id: 'CM' + String(200 + i),
    name: pick(['Spring Expedition Launch', 'Year-End Giving', 'Revival Week Invite', 'Monthly Field Update',
      'AMT Applications Open', 'Water Project Appeal', 'Alumni Re-engagement', 'Giving Tuesday']) + ' ' + (2025 + int(0, 1)),
    kind: pick(['Campaign', 'Campaign', 'Automation', 'Journey']),
    audience: pick(['All Donors', 'Lapsed Donors', 'Past Team Members', 'Church Network', 'Recruiting Leads']),
    status: pick(['Sent', 'Sent', 'Scheduled', 'Draft', 'Running']),
    sent, opened,
    clicked: Math.round(opened * (0.08 + rnd() * 0.3)),
    conversions: int(0, 90),
    revenue: money(0, 58000),
    date: isoDate(-int(0, 420))
  };
});

export const blogs = Array.from({ length: 18 }, (_, i) => ({
  id: 'BL' + String(100 + i),
  title: pick(['A well in Simonga', 'What a village visit really looks like', 'Meet the May Mozambique team',
    'Why we train nationals first', 'Notes from the Amazon', 'Five years in Cairo', 'The road to Pemba']),
  author: pick(users.slice(0, 20)).name,
  status: pick(['Published', 'Published', 'Draft', 'Scheduled']),
  published: isoDate(-int(0, 500)),
  views: int(80, 9400),
  category: pick(['Field Stories', 'Expeditions', 'Ministry', 'Updates'])
}));

export const surveys = Array.from({ length: 9 }, (_, i) => ({
  id: 'SV' + String(60 + i),
  title: pick(['Post-expedition debrief', 'Donor satisfaction', 'Staff care check-in',
    'Applicant experience', 'Team leader feedback']) + ' ' + (i + 1),
  status: pick(['Open', 'Open', 'Closed', 'Draft']),
  responses: int(4, 240),
  sent: int(20, 600),
  created: isoDate(-int(10, 400))
}));

/* --- MPD ------------------------------------------------------------------ */
const staffOnly = () => users.filter(u => u.type === 'Staff');

export const mpders = staffOnly().map((u, i) => {
  const goal = Math.round(money(2800, 7200) / 50) * 50;
  const raised = Math.round(goal * (0.2 + rnd() * 0.95));
  return {
    id: 'MP' + String(1400 + i),
    userId: u.id, name: u.name,
    coach: pick(staffOnly().slice(0, 8)).name,
    monthlyGoal: goal,
    monthlyRaised: Math.min(raised, goal * 1.1),
    pct: Math.min(140, Math.round((raised / goal) * 100)),
    partners: int(4, 96),
    newThisMonth: int(0, 7),
    lapsedPartners: int(0, 11),
    appointments: int(0, 22),
    phase: pick(['Pre-field', 'Building', 'Fully Funded', 'Maintenance', 'At Risk']),
    lastCoaching: isoDate(-int(2, 120))
  };
});

export const fundsRequests = Array.from({ length: 38 }, (_, i) => {
  const m = pick(mpders);
  return {
    id: 'FR' + String(3300 + i),
    mpder: m.name, userId: m.userId,
    period: pick(['September 2026', 'August 2026', 'July 2026']),
    requested: money(800, 5200),
    available: money(0, 9000),
    submitted: isoDateTime(-int(0, 60)),
    coach: m.coach,
    status: chance(.4) ? 'Pending' : pick(['Approved', 'Paid', 'Denied', 'In Review'])
  };
});

/* --- Admin finance -------------------------------------------------------- */
export const payrollRuns = Array.from({ length: 12 }, (_, i) => {
  const gross = money(180000, 260000);
  return {
    id: 'PR' + String(900 + i),
    period: ['Sep 2026','Aug 2026','Jul 2026','Jun 2026','May 2026','Apr 2026','Mar 2026','Feb 2026','Jan 2026','Dec 2025','Nov 2025','Oct 2025'][i],
    people: int(52, 64),
    gross,
    taxes: gross * 0.148,
    net: gross * 0.852,
    status: i === 0 ? 'Draft' : (i === 1 ? 'Pending' : 'Paid'),
    runDate: isoDate(-i * 30)
  };
});

export const mplLines = Array.from({ length: 120 }, (_, i) => {
  const u = pick(staffOnly());
  return {
    id: 'ML' + String(50000 + i),
    date: isoDate(-int(0, 200)),
    staff: u.name, userId: u.id,
    category: pick(['Ministry Expense', 'Travel', 'Vehicle', 'Housing', 'Medical', 'Equipment', 'Hospitality']),
    amount: money(18, 3400),
    receipt: chance(.82),
    reconciled: chance(.68),
    account: pick(['Operating', 'Field', 'Project', 'Restricted']),
    memo: pick(['Fuel — Livingstone run', 'Airfare change fee', 'Clinic supplies', 'Team meals',
      'Visa renewal', 'Generator parts', 'Printing'])
  };
});

export const easyScanQueue = Array.from({ length: 26 }, (_, i) => ({
  id: 'ES' + String(880 + i),
  batch: 'BATCH-' + (2026000 + int(1, 240)),
  received: isoDate(-int(0, 20)),
  items: int(3, 48),
  amount: money(400, 42000),
  type: pick(['Checks', 'Remittance', 'Receipts']),
  status: pick(['Awaiting Review', 'Awaiting Review', 'Posted', 'Exception']),
  operator: pick(users.slice(0, 12)).name
}));

export const qbCustomers = Array.from({ length: 48 }, (_, i) => {
  const c = pick(contacts);
  return {
    id: 'QB' + String(4100 + i),
    name: chance(.35) ? pick(CHURCHES) : c.name,
    qbId: 'C-' + int(1000, 9999),
    synced: chance(.85),
    lastSync: isoDateTime(-int(0, 30)),
    balance: money(-400, 9000),
    ytd: money(0, 48000),
    issue: chance(.12) ? pick(['Duplicate record', 'Missing tax ID', 'Address mismatch']) : null
  };
});

export const receiptBatches = Array.from({ length: 20 }, (_, i) => ({
  id: 'RB' + String(600 + i),
  kind: i < 4 ? 'End of Year' : 'Weekly',
  period: i < 4 ? `FY${2022 + i}` : `Week ${52 - i} · 2026`,
  count: int(40, 2600),
  amount: money(9000, 480000),
  generated: isoDate(-int(1, 300)),
  delivered: chance(.8),
  status: pick(['Sent', 'Sent', 'Generating', 'Draft'])
}));

export const interbankTransfers = Array.from({ length: 24 }, (_, i) => ({
  id: 'IB' + String(770 + i),
  from: pick(['Operating (US)', 'Restricted (US)', 'Zambia Kwacha', 'Mozambique Metical', 'Egypt Pound']),
  to: pick(['Zambia Kwacha', 'Mozambique Metical', 'Egypt Pound', 'Lebanon Account', 'Operating (US)']),
  amount: money(4000, 120000),
  rate: Math.round((rnd() * 25 + 1) * 1000) / 1000,
  initiated: isoDate(-int(0, 120)),
  audited: chance(.7),
  status: pick(['Settled', 'Settled', 'In Transit', 'Needs Audit'])
}));

/* --- General Admin -------------------------------------------------------- */
export const countries = [
  ['Zambia', 'Southern Africa', 'ZMW', 'Open', 2],
  ['Mozambique', 'Southern Africa', 'MZN', 'Open', 1],
  ['South Africa', 'Southern Africa', 'ZAR', 'Open', 1],
  ['Malawi', 'Southern Africa', 'MWK', 'Restricted', 0],
  ['Egypt', 'North Africa', 'EGP', 'Open', 1],
  ['Morocco', 'North Africa', 'MAD', 'Restricted', 0],
  ['Lebanon', 'Middle East', 'LBP', 'Elevated Risk', 1],
  ['Jordan', 'Middle East', 'JOD', 'Open', 0],
  ['Peru', 'South America', 'PEN', 'Open', 1],
  ['Brazil', 'South America', 'BRL', 'Open', 0],
  ['DR Congo', 'Southern Africa', 'CDF', 'Elevated Risk', 0]
].map(([name, region, currency, travel, bases], i) => ({
  id: 'CO' + String(40 + i), name, region, currency, travel, bases,
  visa: pick(['On arrival', 'Pre-approval', 'eVisa', 'Not required']),
  advisory: travel === 'Open' ? 'Level 1' : (travel === 'Restricted' ? 'Level 3' : 'Level 2'),
  staff: int(0, 26)
}));

export const regions = [
  ['Southern Africa', 4, 26], ['North Africa', 2, 9], ['Middle East', 2, 7],
  ['South America', 2, 8], ['Global', 0, 12]
].map(([name, bases, staff], i) => ({
  id: 'RG' + String(10 + i), name, bases, staff,
  director: pick(users.slice(0, 12)).name,
  expeditions: expeditions.filter(e => e.sector === name).length
}));

export const groups = Array.from({ length: 16 }, (_, i) => ({
  id: 'GR' + String(300 + i),
  name: pick(['Field Leadership', 'Finance Team', 'Media Team', 'Base Directors', 'Aviation',
    'Chaplains', 'Medical', 'Expedition Leaders', 'Home Office', 'IT']) + (i > 9 ? ' ' + (i - 9) : ''),
  members: int(3, 34),
  kind: pick(['Permission Group', 'Mailing List', 'Both']),
  owner: pick(users.slice(0, 12)).name,
  created: isoDate(-int(60, 1600))
}));

export const expeditionInsurance = expeditions.map((e, i) => ({
  id: 'EI' + String(80 + i),
  expedition: e.name, expeditionId: e.id,
  policy: 'TTC-' + int(100000, 999999),
  covered: e.roster.length,
  pending: Math.max(0, e.roster.filter(m => !m.insurance).length),
  premium: e.roster.length * 42,
  effective: e.start,
  status: e.roster.every(m => m.insurance) ? 'Complete' : 'Incomplete'
}));

/* --- accessors ------------------------------------------------------------ */
export const findContact = id => contacts.find(c => c.id === id);
export const contactsIn = bucket => contacts.filter(c => c.bucket === bucket);
export const lapsedDonors = () => contacts.filter(c => c.lapsed);
export const openReminders = () => reminders.filter(r => r.status === 'Open');
export const pendingFunds = () => fundsRequests.filter(r => r.status === 'Pending' || r.status === 'In Review');
