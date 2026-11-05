# RopeLink Master Project Roadmap
**Status:** Phase 4 Hardened & Production Verified | Updated: November 2026

---

## Phase 3 COMPLETE ✅
All security migrations (`001`-`003`), H1 fix, U6 `profile_directory` view isolation joins, and strict type cascade fixes are fully tested and deployed.

---

## Phase 4 COMPLETE ✅ (Hardening, Resilience & UI Safeguards)
- **H1 (Edge Case)**: Swapped condition order in `useAgreements.ts` (`signAgreement`) so `status === 'draft'` takes absolute precedence over `otherPartyHasSigned`. Guarantees trigger-safe `pending_proposer_sig` path under all conditions.
- **H2 (Input Preservation)**: Form fields in `CrewRosterModal.tsx` are strictly preserved on database insertion failure, accompanied by localized `toast.error(t('techAddError'))`.
- **H3 (Chat Truncation & Char Limit)**: Implemented 500-character limit with real-time character counter (`{count}/{max}`) and red limit warning banner (`chatTruncWarning`) in `ChatInput.tsx` and `ChatModal.tsx`.
- **H6 & U2 (Fault Tolerance & Loading States)**:
  - Global `src/app/[locale]/error.tsx` boundary with recovery button for route-level error isolation.
  - Streaming skeleton loading state in `src/app/[locale]/dashboard/loading.tsx`.
  - `ConfigurationGuard.tsx` component mounted on dashboard to visibly alert when running in unconfigured/local fallback mode.
- **U1 (Localized Mobilization Feedback)**: `MobilizationTracker.tsx` captures structured errors from database triggers on advance failure and surfaces localized toast feedback (`milestoneAdvanceError`).
- **U7 (Dialog State Lifecycle Reset)**:
  - `AgreementSignatureModal.tsx` clears stale error state on modal open / agreement ID transition.
  - `CrewRosterModal.tsx` resets form inputs when opened fresh.
- **i18n Synchronization**: Added all new bilingual translation keys (`chatTruncWarning`, `chatCharCount`, `techAddError`, `milestoneAdvanceError`) across `en.json` and `ar.json` with 100% dictionary key parity.
- **Codebase Modularity**: All files in `src/` strictly satisfy the `< 200` lines architectural rule.
- **Supabase Cloud Sync**: All 4 migration stages (`000` through `003`) verified and in 100% parity on remote database (`qffoupxfwgweuftztisz`).

---

## Phase 5 Backlog (Pre-Launch & Enterprise Optimization)
- **H4**: Realtime chat reconnect missed message recovery
- **H5**: Stale data reset on auth session change
- **U3**: Dialog accessibility (Escape key, Tab focus trap)
- **U4**: Mobile viewport dynamic height (`dvh`) for nested modals
- **U5 [CRITICAL]**: Specialty matching via stable canonical IDs rather than localized string labels
- **P1**: Marketplace feed memoization (`useMemo`, virtual list)
- **P2**: Explicit cursor pagination for requests and marketplace listings
- **P3**: `next/dynamic` deferred bundle imports for heavy modals
- **P4**: Supabase query caching and stale-while-revalidate client layer

---

## Quality & Test Status
- **Test Suite Results**: 62 / 62 tests passing (Phase 2: 12/12, Phase 3: 18/18, Pilot Hardening & Security: 32/32)
- **Production Compilation**: Next.js 16.3.4 Turbopack build succeeded (`Exit Code: 0`) across all localized static and dynamic routes.
