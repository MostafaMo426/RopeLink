# RopeLink B2B Marketplace - Test Cases & Quality Assurance Matrix

## Phase 1 & Phase 2 Test Coverage

### 1. Database & Security Test Cases (Supabase & RLS)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **SEC-01** | Open marketplace SELECT query | All authenticated users can discover active marketplace opportunities. | ✅ Verified (RLS Policy) |
| **SEC-02** | Authenticated user reads own profile | Returns user's profile data matching `auth.uid()`. | ✅ Verified (RLS Policy) |
| **SEC-03** | Non-admin user attempts to approve verification status | Denied by RLS policy; only Admins can update `verification_status`. | ✅ Verified (RLS Policy) |
| **SEC-04** | Match proposal created between two parties | Both proposer and recipient have real-time visibility in `matches` table. | ✅ Verified (RLS Policy) |
| **SEC-05** | New user signup trigger executes | Row automatically inserted into `public.profiles` with `verification_status = 'unverified'`. | ✅ Verified (`handle_new_user` trigger) |
| **SEC-06** | Request created with `technician_count <= 0` | DB constraint violation (`technician_count > 0`). | ✅ Verified (Check Constraint) |
| **SEC-07** | Invalid ENUM value submitted for `verification_status` or `match_status` | Database rejects invalid cast. | ✅ Verified (PostgreSQL ENUMs) |

---

### 2. Matching Engine Algorithm Test Cases (`src/lib/matching/engine.ts`)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **ENG-01** | Exact IRATA trade match in same city (e.g. Jubail to Jubail) | Match score $\ge 90\%$ (Optimal Match / تطابق ممتاز). | ✅ Verified |
| **ENG-02** | Same regional cluster (e.g. Jubail project with Dammam crew) | Proximity score 85%, aggregate score $\ge 75\%$. | ✅ Verified |
| **ENG-03** | Mobilization start date difference $\le 2$ days | Full 100% timeline buffer credit awarded. | ✅ Verified |
| **ENG-04** | Supplier crew size smaller than project demand | Headcount score scaled proportionally ($\ge 30\%$). | ✅ Verified |
| **ENG-05** | Opposing trade types evaluated | Score accurately clamped between 0% and 100%. | ✅ Verified |

---

### 3. Contractor Verification & Trust Pipeline
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **VER-01** | Unverified contractor visits dashboard | Prominent `VerificationBanner` displays prompting CR submission. | ✅ Verified |
| **VER-02** | Contractor submits 10-digit CR number | Status updates to `pending_review` and `TrustBadge` shows amber indicator. | ✅ Verified |
| **VER-03** | Admin approves CR submission | Status changes to `verified`, green 100% Verified badge displayed on all marketplace listings. | ✅ Verified |
| **VER-04** | Verified-only filter enabled in Marketplace | Non-verified opportunities filtered out from feed. | ✅ Verified |

---

### 4. Real-time Synchronization (`useRealtimeMarketplace`)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **RT-01** | Contractor posts new project requirement | Real-time channel broadcasts INSERT event, feed updates on all connected clients. | ✅ Verified |
| **RT-02** | Admin changes request status | Update reflected on active contractor dashboards without page reload. | ✅ Verified |
| **RT-03** | Match proposal sent to recipient | Recipient receives live notification and proposal in their dashboard. | ✅ Verified |

---

### 5. Localization & RTL Layout (`next-intl`)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **I18N-01** | Full dictionary key parity across AR & EN | 100% synchronized translation keys in `ar.json` and `en.json`. | ✅ Verified (Automated Test) |
| **I18N-02** | Saudi industrial terminology validation | Authentic dialect used (*إسناد فوري*, *سجل تجاري موثق*, *نسبة التطابق الميداني*). | ✅ Verified |
| **I18N-03** | Layout flipping between `/ar` and `/en` | CSS logical properties and directional alignment (`dir="rtl"` vs `dir="ltr"`). | ✅ Verified |

---

### 6. Architectural Modularity & File Size Limits
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **ARCH-01** | Every file in `src/` scanned for line counts | 100% of files strictly $< 200$ lines. | ✅ Verified (Automated Audit) |
