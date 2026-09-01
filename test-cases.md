# RopeLink - Comprehensive Quality, Security & UX Test Matrix

## Phase 1: Interactive Prototype, Onboarding & Request System

---

### 1. Database & Security Test Cases (Supabase & RLS)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **SEC-01** | Unauthenticated user creates a request | Allowed (assigned `user_id = NULL` or linked upon signup). | ✅ Verified |
| **SEC-02** | Authenticated user reads own profile | Returns user's profile data matching `auth.uid()`. | ✅ Verified (RLS Policy) |
| **SEC-03** | Authenticated user attempts to read another user's profile | Access denied (empty query result / RLS block). | ✅ Verified (RLS Policy) |
| **SEC-04** | Authenticated user attempts to modify another user's request | Operation blocked by RLS policy. | ✅ Verified (RLS Policy) |
| **SEC-05** | New user signup trigger executes | Row automatically inserted into `public.profiles` with `has_seen_tutorial = false`. | ✅ Verified (`handle_new_user` trigger) |
| **SEC-06** | Request created with `technician_count <= 0` | DB constraint violation (`technician_count > 0`). | ✅ Verified (Check Constraint) |
| **SEC-07** | Invalid ENUM value submitted for `saudi_city` or `request_type` | Database rejects invalid cast. | ✅ Verified (PostgreSQL ENUMs) |

---

### 2. Localization & RTL Layout Test Cases (`next-intl`)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **I18N-01** | Default route `/` navigation | Resolves to default Saudi locale `/ar` with `dir="rtl"`. | ✅ Verified |
| **I18N-02** | Locale switcher toggled to English | Route changes to `/en`, `dir="ltr"`, typography flips to English sans. | ✅ Verified |
| **I18N-03** | Saudi business terminology check | Arabic uses "مقاول", "فنيين معتمدين", "منشأة", "سجل تجاري", "إسناد فوري". | ✅ Verified |
| **I18N-04** | Form field text alignment in RTL | Inputs, icons, labels, and placeholders align to right start (`text-start`, `pe-`, `ps-`). | ✅ Verified |
| **I18N-05** | Mobile navigation drawer in RTL | Slides in from the correct directional anchor without clipping. | ✅ Verified |

---

### 3. Scroll-Linked Framer Motion Animation
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **ANIM-01** | Scroll from Top to Bottom of landing page | Rope technician icon smoothly rappels along the vertical rope with zero jitter. | ✅ Verified |
| **ANIM-02** | Rapid scroll up & down | Physics spring damping (`stiffness: 85, damping: 22`) prevents overshooting or visual stutter. | ✅ Verified |
| **ANIM-03** | Mobile viewport scroll | No horizontal scrollbars or page width overflows caused by rope SVG container. | ✅ Verified |
| **ANIM-04** | Reduced motion preference | Animation adapts smoothly with bounded transforms. | ✅ Verified |

---

### 4. Interactive First-Time Tutorial (`driver.js`)
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **TOUR-01** | New user enters dashboard with `has_seen_tutorial = false` | Guided tour starts automatically highlighting Header, CTAs, and Stats. | ✅ Verified |
| **TOUR-02** | User completes or skips tour | Supabase `profiles.has_seen_tutorial` is updated to `true`. | ✅ Verified |
| **TOUR-03** | Returning user with `has_seen_tutorial = true` logs in | Guided tour does NOT automatically launch. | ✅ Verified |
| **TOUR-04** | Responsive Tour Popover on Mobile ($< 480\text{px}$) | Popover fits on screen without overflow, buttons easily touchable ($\ge 44\text{px}$). | ✅ Verified |
| **TOUR-05** | Tour Popover in RTL mode | Next/Back arrows and text correctly oriented for Arabic reading order. | ✅ Verified |

---

### 5. Responsive Request Modal & Bottom Sheet
| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| **FORM-01** | Desktop viewport ($\ge 768\text{px}$) CTA click | Opens centered glassmorphic dialog with backdrop blur. | ✅ Verified |
| **FORM-02** | Mobile viewport ($< 768\text{px}$) CTA click | Opens native-like bottom sheet with swipe-down indicator. | ✅ Verified |
| **FORM-03** | Form validation with empty required fields | Displays clear bilingual HTML5/Zod required indicators under respective inputs. | ✅ Verified |
| **FORM-04** | Valid form submission | Submits payload to Supabase/Session, displays success toast, and closes modal. | ✅ Verified |
| **FORM-05** | Network error or offline submission | Shows descriptive error toast and keeps user inputs intact. | ✅ Verified |

---

### 6. Device & Aspect Ratio Matrix
| Device / Viewport | Aspect Ratio | Target Width x Height | Test Focus | Status |
|---|---|---|---|---|
| **iPhone SE** | 16:9 | 375 x 667 | Compact header, bottom-sheet height, touch targets | ✅ Pass |
| **iPhone 14 / 15 Pro** | 19.5:9 | 393 x 852 | Dynamic island safe area, scroll animation flow | ✅ Pass |
| **Samsung Galaxy S24** | 20:9 | 412 x 915 | Tall aspect ratio, sticky CTA buttons | ✅ Pass |
| **iPad Mini / Air (Portrait)** | 4:3 / 3:2 | 768 x 1024 | Breakpoint transition, grid layouts | ✅ Pass |
| **iPad Pro (Landscape)** | 4:3 | 1366 x 1024 | 3-column CTA cards, rope anchor alignment | ✅ Pass |
| **Standard Laptop / Desktop** | 16:9 | 1920 x 1080 | Glassmorphic cards, hero banner balance | ✅ Pass |
| **Ultrawide Monitor** | 21:9 | 2560 x 1080 / 3440 x 1440 | Max-width content containment (`max-w-7xl`) | ✅ Pass |
