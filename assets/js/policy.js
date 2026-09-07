/* ==========================================================================
   Capability policy — the single source of truth for what each role may do.

   Both the Roles & Access screen and the router read from here, so the
   permission matrix a user sees is the same one the app enforces. Mirror
   this table on the server; the client copy is a UX guard, not a boundary.
   ========================================================================== */

/** Every capability in the portal, grouped for display. */
export const CAPABILITIES = [
  // People
  { id: 'people.view',        group: 'People',       label: 'View people' },
  { id: 'people.edit',        group: 'People',       label: 'Edit people' },
  { id: 'people.admin',       group: 'People',       label: 'Invite & suspend accounts' },
  { id: 'people.compliance',  group: 'People',       label: 'View compliance documents' },
  // CRM
  { id: 'crm.view',           group: 'CRM',          label: 'View contacts' },
  { id: 'crm.edit',           group: 'CRM',          label: 'Edit contacts & notes' },
  { id: 'crm.marketing',      group: 'CRM',          label: 'Send campaigns & automations' },
  // Expeditions
  { id: 'expeditions.view',   group: 'Expeditions',  label: 'View expeditions' },
  { id: 'expeditions.roster', group: 'Expeditions',  label: 'Edit rosters' },
  { id: 'expeditions.admin',  group: 'Expeditions',  label: 'Lock & close expeditions' },
  { id: 'applications.review',group: 'Expeditions',  label: 'Review applications' },
  // Giving & finance
  { id: 'giving.view',        group: 'Giving',       label: 'View donations' },
  { id: 'giving.refund',      group: 'Giving',       label: 'Issue refunds' },
  { id: 'giving.publish',     group: 'Giving',       label: 'Publish donation pages' },
  { id: 'giving.export',      group: 'Giving',       label: 'Export donor data' },
  { id: 'finance.view',       group: 'Giving',       label: 'View the finance console' },
  { id: 'finance.authorize',  group: 'Giving',       label: 'Authorize & disburse funds' },
  { id: 'finance.payroll',    group: 'Giving',       label: 'Run payroll' },
  // Workflow
  { id: 'requests.view',      group: 'Workflow',     label: 'View the request queue' },
  { id: 'requests.approve',   group: 'Workflow',     label: 'Approve requests' },
  { id: 'tasks.assign',       group: 'Workflow',     label: 'Assign tasks' },
  // System
  { id: 'system.audit',       group: 'System',       label: 'View the audit log' },
  { id: 'system.roles',       group: 'System',       label: 'Manage roles' },
  { id: 'system.sessions',    group: 'System',       label: 'Revoke sessions' },
  { id: 'system.settings',    group: 'System',       label: 'Edit system settings' }
];

/** role -> predicate over capability id. Keep in sync with the server. */
export const ROLE_GRANTS = {
  'Administrator':     () => true,
  'Finance':           id => /^(giving|finance)\./.test(id) || ['people.view','crm.view','requests.view','requests.approve','system.audit'].includes(id),
  'Base Director':     id => /\.view$/.test(id) || ['expeditions.roster','applications.review','tasks.assign','people.compliance'].includes(id),
  'Expedition Leader': id => ['people.view','expeditions.view','expeditions.roster','applications.review','tasks.assign','crm.view'].includes(id),
  'Donor Relations':   id => ['crm.view','crm.edit','crm.marketing','giving.view','giving.publish','people.view'].includes(id),
  'Media':             id => /\.view$/.test(id),
  'Staff':             id => ['people.view','expeditions.view','crm.view','requests.view'].includes(id),
  'Read Only':         id => ['people.view','expeditions.view'].includes(id)
};

export const ROLES = Object.keys(ROLE_GRANTS);

/* Least privilege first. Account-creation forms bind to this order so the
   default selection is the safest one, never Administrator. */
export const ROLES_BY_PRIVILEGE = [
  'Read Only', 'Staff', 'Media', 'Expedition Leader',
  'Donor Relations', 'Base Director', 'Finance', 'Administrator'
];

/** Capability required to open each route id. Routes absent here are open to any signed-in user. */
export const ROUTE_CAPABILITY = {
  people: 'people.view',
  staff: 'people.view',
  roles: 'system.roles',
  crm: 'crm.view',
  fundraising: 'crm.view',
  recruiting: 'crm.view',
  marketing: 'crm.marketing',
  mpd: 'finance.view',
  expeditions: 'expeditions.view',
  amt: 'expeditions.view',
  applications: 'applications.review',
  finance: 'finance.view',
  donations: 'giving.view',
  donationPages: 'giving.view',
  accounts: 'finance.view',
  budgets: 'finance.view',
  requests: 'requests.view',
  tasks: 'requests.view',
  alerts: 'crm.view',
  media: 'people.view',
  generalAdmin: 'system.settings',
  audit: 'system.audit',
  security: 'system.sessions',
  settings: 'system.settings'
};

/* ==========================================================================
   Financial controls
   ==========================================================================
   Per-role single-approval ceiling, and the threshold above which a second
   authoriser is required. Mirror these on the server — the client copy only
   shapes the UI.
   ========================================================================== */
export const APPROVAL_LIMIT = {
  'Administrator': Infinity,
  'Finance': 25000,
  'Base Director': 5000,
  'Expedition Leader': 1000,
  'Donor Relations': 0,
  'Media': 0,
  'Staff': 0,
  'Read Only': 0
};

/** Amounts at or above this need two different approvers. */
export const DUAL_AUTH_THRESHOLD = 10000;
export const needsDualAuth = amount => (amount || 0) >= DUAL_AUTH_THRESHOLD;
