# RopeLink Master Project Roadmap
**Status:** Phase 5 Complete & Production Verified | Updated: November 2026

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
- **Supabase Cloud Sync**: All 6 migration stages (`000` through `20261105171954`) verified and in 100% parity on remote database (`qffoupxfwgweuftztisz`).

---

## Phase 5 COMPLETE ✅ (Enterprise Optimization, Accessibility & Matching Precision)
- **U5 [CRITICAL] (Canonical Specialty Matching)**:
  - Implemented `toCanonicalSpecialtyId` helper in `src/lib/constants.ts` to normalize all specialties (`irata_l1`, `irata_l2`, `irata_l3`, `ndt_inspection`, etc.) across Arabic and English inputs.
  - Enhanced `calculateMatchScore` in `src/lib/matching/engine.ts` with canonical exact matching (100%) and hierarchical IRATA capabilities (Level 3 supervisor matches L1/L2 at 95%; L2 matches L1 at 85%).
  - Integrated canonical IDs directly into `RequestForm.tsx`, `MarketplaceFilters.tsx`, and `MarketplaceFeed.tsx`.
- **H4 (Realtime Chat Reconnect Recovery)**:
  - Added missed-message recovery in `src/hooks/useMatchChat.ts` via channel `SUBSCRIBED` status callbacks, `window.online`, and `document.visibilitychange` event listeners with message deduplication by ID.
- **H5 (Stale Data Invalidation on Auth Change)**:
  - Hardened `useSupabaseAuth.ts`, `useRequests.ts`, `useRealtimeMarketplace.ts`, and `useAgreements.ts` to immediately purge state and query caches when `userId` becomes null or session changes.
- **U3 & U4 (Dialog Accessibility & Dynamic Viewport Height)**:
  - Created reusable `src/hooks/useModalA11y.ts` providing `Escape` key close dispatch, initial element auto-focus, and trapped `Tab` / `Shift+Tab` keyboard navigation.
  - Applied `max-h-[88dvh] overflow-y-auto` across all modals (`ChatModal`, `AgreementModal`, `AgreementSignatureModal`, `CrewRosterModal`, `RequestModal`, `VerificationModal`, `MatchProposalModal`) ensuring no clipping behind dynamic mobile browser bars.
- **P1 & P2 (Marketplace Feed Memoization & Pagination)**:
  - Memoized request filtering via `useMemo` in `MarketplaceFeed.tsx`.
  - Added incremental client viewport pagination (`loadMore`) displaying opportunity batches.
- **P3 (Deferred Bundle Optimization)**:
  - Dynamic code-splitting with `next/dynamic` (`ssr: false`) in `dashboard/page.tsx` for heavy modals, decreasing initial page weight and hydration cost.
- **P4 (Client Query Caching Layer)**:
  - Implemented `src/lib/cache/clientCache.ts` with TTL-based caching and stale-while-revalidate pattern across requests, profiles, matches, and agreements.

---

## Quality & Test Status
- **Test Suite Results**: 66 / 66 tests passing (Phase 2: 12/12, Phase 3: 18/18, Pilot Hardening & Security: 36/36)
- **Production Compilation**: Next.js 16.3.4 Turbopack build succeeded (`Exit Code: 0`) across all localized static and dynamic routes.
