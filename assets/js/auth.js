/* ==========================================================================
   Authentication & authorisation.

   This module is the ONLY place the portal decides who someone is and what
   they may do. It ships with a mock provider so the demo runs standalone;
   point `SESSION_ENDPOINT` at a real session endpoint and the rest of the
   app needs no changes.

   Threat model note: everything here is a UX guard. A determined user can
   edit client state, so the SERVER must re-check every capability on every
   request. Client-side checks exist to keep honest users out of screens
   they cannot use — never as the enforcement boundary.
   ========================================================================== */

import { CAPABILITIES, ROLE_GRANTS } from './policy.js';

const SESSION_ENDPOINT = null; // e.g. '/api/session' — null = mock provider

let session = null;

/* --- session -------------------------------------------------------------- */
export async function loadSession() {
  if (SESSION_ENDPOINT) {
    const res = await fetch(SESSION_ENDPOINT, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    });
    if (res.status === 401 || res.status === 403) { session = null; return null; }
    if (!res.ok) throw new Error(`Session check failed (${res.status})`);
    session = await res.json();
    return session;
  }
  // Mock provider — demo only.
  const { me } = await import('./data.js');
  session = {
    userId: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    capabilities: capabilitiesFor(me.role),
    mock: true
  };
  return session;
}

export const currentUser = () => session;
export const isAuthenticated = () => session != null;

export function capabilitiesFor(role) {
  const grant = ROLE_GRANTS[role];
  if (!grant) return [];
  return CAPABILITIES.filter(c => grant(c.id));
}

/* --- authorisation -------------------------------------------------------- */
export function can(capabilityId) {
  if (!session) return false;
  return session.capabilities.some(c => c.id === capabilityId);
}

/** Throws a typed error the router turns into a 403 view. */
export function require(capabilityId) {
  if (!can(capabilityId)) {
    const err = new Error(`Missing capability: ${capabilityId}`);
    err.code = 'FORBIDDEN';
    err.capability = capabilityId;
    throw err;
  }
}

/* --- audit ---------------------------------------------------------------- */
const AUDIT_ENDPOINT = null; // e.g. '/api/audit'

/** Record a consequential action. Fire-and-forget; never blocks the UI. */
export function audit(action, target, detail) {
  const entry = {
    action, target, detail: detail || null,
    actorId: session ? session.userId : null,
    at: new Date().toISOString()
  };
  if (!AUDIT_ENDPOINT) { console.info('[audit]', entry); return; }
  navigator.sendBeacon
    ? navigator.sendBeacon(AUDIT_ENDPOINT, new Blob([JSON.stringify(entry)], { type: 'application/json' }))
    : fetch(AUDIT_ENDPOINT, {
        method: 'POST', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry)
      }).catch(() => {});
}

/* --- sign out -------------------------------------------------------------- */
export async function signOut() {
  audit('session.signout', session ? session.userId : 'anonymous');
  session = null;
  if (SESSION_ENDPOINT) {
    await fetch(SESSION_ENDPOINT, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
  }
  location.hash = '#/';
  location.reload();
}
