# Decisions and open questions

Things where two defensible answers exist, and what this build chose.

## 1. Primary button contrast — needs your call

The brand pairs **Bone `#ddd7ce` text on a Flare `#ec4300` fill**. That is
**2.74:1**. WCAG AA needs 4.5:1 for text this size (11px, 600).

| Option | Ratio | Cost |
| --- | --- | --- |
| Keep Bone on Flare *(current)* | 2.74:1 | Fails AA on the most-used control |
| **Shadow `#0f0e0d` text on the same Flare fill** | **4.93:1** | Passes AA, fill unchanged, text reads near-black |
| Deepen the fill to `#b42700`, keep Bone text | 4.55:1 | Passes AA, but changes the brand orange |

**This build keeps the brand pairing** — it is your identity and not mine to
change. It is a one-line switch:

```css
/* assets/css/overland.css */
--on-flare: var(--bone);      /* brand default, 2.74:1  */
--on-flare: var(--shadow);    /* accessible,    4.93:1  */
```

For an internal tool used daily by staff, and given ADA/Section 508 exposure for
a US nonprofit, I would take option 2. Say the word and it is one commit.

Related, same cause: white on Flare is 3.91:1 (urgent badges, count badges), and
Flare text on the Bone page background is also 2.74:1 — so Flare is used for
fills and borders here, not for body-sized text.

## 2. Client-side authorisation

`policy.js` is enforced in the router *and* rendered as the Roles & Access
matrix, so what an administrator sees is what the app applies. This is a UX
guard. The server must mirror it. See `docs/SECURITY.md`.

## 3. `localStorage` persistence

Writes are mirrored to `localStorage` so a demo survives a reload and reviewers
can see that actions really change state. This must be removed before the portal
is pointed at real records. `store.resetAll()` clears it.

## 4. Light theme only

The portal design is light-only (Bone page, Shadow rail). No dark mode was
built, matching the Figma file and the live portal.

## 5. Mock data

`data.js` is seeded and deterministic so screenshots and demos are stable.
Every identity is fictional on a reserved domain.

## 6. Scope

This repository is the **back office**. The member-facing portal
(portal.overlandmissions.com) is a separate existing product. Where a member
action needs an admin counterpart, the counterpart is here; the member screen is
not.
