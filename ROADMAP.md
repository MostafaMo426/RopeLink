# RopeLink Master Project Roadmap
**Status:** Phase 3 MVP — Code Freeze locked | Updated: 2026-09-11

## Phase 3 COMPLETE
All security migrations (001-003), H1 fix, U6 profile_directory joins, and type cascade fixes are shipped.

## Phase 4 Backlog (Next Week)
- H2: Input preservation on crew save failure
- H3: Chat truncation user warning
- H6 & U2: Global error.tsx boundaries + loading.tsx skeletons + ConfigurationGuard
- U1: Localized prerequisite errors in MobilizationTracker
- U7: Dialog state reset between actions
- H1 (Edge Case): In `useAgreements.ts` (`signAgreement`), the state machine checks
  `if (otherPartyHasSigned)` BEFORE `if (current.status === 'draft')`. This could
  theoretically cause a DB rejection if a draft row somehow already has a stale
  signature flag set. Fix: swap the condition order so the `draft` check takes absolute
  precedence, ensuring the trigger-safe `pending_proposer_sig` path is always chosen
  first when the agreement is still in `draft` state.

## Phase 5 Backlog (Pre-Launch)
- H4: Realtime chat reconnect missed message recovery
- H5: Stale data reset on auth session change
- U3: Dialog accessibility (Escape key, Tab trap)
- U4: Mobile viewport height for modals
- U5 [CRITICAL]: Specialty matching via stable IDs not translated labels
- P1: Marketplace feed memoization
- P2: Explicit pagination
- P3: next/dynamic deferred imports
- P4: Supabase query caching

## Architect Note
U5 should be escalated to Phase 4 if MVP demo involves cross-locale users.
