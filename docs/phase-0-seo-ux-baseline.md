# Phase 0 baseline — copy, indexing, and success criteria

**Status:** Locked for implementation (Phases 1–5).  
**Do not edit the rollout plan file** — this document is the single source of truth for Phase 0 deliverables.

---

## 1. Canonical site URL (for metadata, JSON-LD, sitemap)

- **Production:** Use the value of `NEXT_PUBLIC_APP_URL` (see `.env.example`) as `metadataBase` and for all absolute URLs in schema and sitemaps. No hardcoded domain in code paths that differ per environment.
- **Example production origin:** `https://nuvare.app` (aligns with `hello@nuvare.app` on the pricing page). If production uses another host, update this document once and keep env as source of truth.

---

## 2. Approved meta copy

Character targets: titles ~50–60 characters where possible; descriptions ~150–160 characters.

### 2.1 Global default (fallback in root layout)

Use when a child route does not export its own metadata.

| Field | Approved copy |
|--------|----------------|
| **title** (template) | `Nuvare` — child routes should set `title` and use template `%s \| Nuvare` if desired in Phase 2. |
| **description** | Nuvare is the private intelligence layer for globally mobile professionals: cross-border tax, visa, and asset deadlines in one place—informational only, not legal or tax advice. |

### 2.2 Per-route descriptions (Phase 2 implementation)

| Route | `title` (suggested) | `description` (approved) |
|--------|---------------------|---------------------------|
| `/` | Nuvare — private intelligence for global professionals | The private intelligence layer for internationally mobile professionals. Track visa, tax, and foreign-asset deadlines; ask plain-language questions powered by research-backed AI. Informational only—not legal, tax, or immigration advice. |
| `/features` | Features — Nuvare | Deadline dashboard, country intelligence, document vault, and Ask Anything—tools for cross-border professionals in one secure workspace. See what is included before you subscribe. |
| `/pricing` | Pricing — Nuvare | Simple Core and Professional plans for globally mobile professionals. Monthly or yearly billing, no hidden fees. Cancel anytime. See current prices on the page—subject to change; checkout confirms final amount. |
| `/login` | Log in — Nuvare | Sign in to your Nuvare account to access your dashboard, vault, and country intelligence. |

### 2.3 Future public editorial route (Phase 4)

Lock route slug: **`/how-nuvare-works`** (methodology, sourcing, AI boundaries, professional-use guidance).

| Field | Approved copy |
|--------|----------------|
| **title** | How Nuvare works — Nuvare |
| **description** | How Nuvare gathers country and deadline intelligence, how AI answers are produced and limited, and when to consult a qualified professional. Transparency for cross-border tax, visa, and asset planning—not personalized advice. |

---

## 3. “How intelligence works” editorial outline (Phase 4 body copy)

Sections to implement on `/how-nuvare-works` (headings may be styled; substance must match product behavior in code):

1. **Purpose** — Nuvare organizes deadlines and surfaces informational summaries; it does not provide legal, tax, immigration, or investment advice.
2. **Data and research** — Country and rules content is synthesized from third-party research tools and models (e.g. live research and LLM orchestration as implemented in `lib/ai/`). Outputs can be incomplete or outdated; users must verify against official sources.
3. **AI boundaries** — Answers are constrained by prompts and tool use; they are starting points (“the 80% answer”), not a substitute for a licensed professional where stakes are high.
4. **Your responsibilities** — Users confirm accuracy for their jurisdiction and situation; YMYL decisions require human experts.
5. **Updates** — How often intelligence is refreshed (describe actual product behavior honestly once aligned with `lib/ai/orchestrator.ts`, `lib/ai/perplexity.ts`, and `lib/ai/minimax.ts`).

*Legal/compliance sign-off required before publishing (per plan Phase 4).*

---

## 4. JSON-LD factual fields (approved baseline)

Use these literals in `Organization` and `SoftwareApplication` schema on public indexable routes (Phase 2), unless legal requests changes.

### 4.1 Organization

| Property | Value |
|----------|--------|
| `@type` | Organization |
| name | Nuvare |
| url | Canonical site URL (`NEXT_PUBLIC_APP_URL`, trailing slash omitted) |
| description | Same as global default description (§2.1). |
| contactPoint (optional) | `email: hello@nuvare.app`, `contactType: customer support` |

### 4.2 SoftwareApplication

| Property | Value |
|----------|--------|
| `@type` | SoftwareApplication |
| name | Nuvare |
| applicationCategory | BusinessApplication (or `FinanceApplication` if preferred at implementation—pick one and keep stable) |
| operatingSystem | Web |
| offers | Two `Offer` entries mirroring on-page pricing: **Core** — USD 99/month or USD 990/year; **Professional** — USD 199/month or USD 1,990/year. Use `price`, `priceCurrency: USD`, `priceValidUntil` refreshed annually or omitted if policy prefers; always match visible UI. |
| description | Same as homepage meta description (§2.2 `/`). |

### 4.3 FAQPage

**Decision:** **Do not** emit `FAQPage` JSON-LD until FAQ content is **visible as static HTML** on a crawlable URL (not only inside a client modal). Until then, omit `FAQPage` to avoid rich-result policy mismatch.

---

## 5. Route indexing policy matrix

Policy for `robots` meta and/or headers and sitemap inclusion. “Allow” = eligible for indexing if content quality checks pass; still use accurate `canonical` when duplicates exist.

| Route pattern | Auth / gate | Index policy | Notes |
|---------------|------------|--------------|--------|
| `/` | Public | **index, follow** | Primary marketing URL. |
| `/features` | Public | **index, follow** | |
| `/pricing` | Public | **index, follow** | Prices in schema must match UI. |
| `/how-nuvare-works` | Public (Phase 4) | **index, follow** | Add to sitemap when shipped. |
| `/login` | Public | **noindex, follow** | Thin utility page; avoid competing with marketing URLs. |
| `/onboarding` | Public (not in middleware block) | **noindex, follow** | Funnel/auth mix; not a landing SEO target. |
| `/home`, `/home/*` | Requires session | **noindex, follow** | App shell. |
| `/vault`, `/vault/*` | Requires session | **noindex, follow** | User data. |
| `/countries`, `/countries/*` | Requires session (middleware) | **noindex, follow** | Premium intelligence; Phase 5 “lite” public routes get their own rows when introduced. |
| `/api/*` | Varies | **disallow** in `robots.txt` | No sitemap entries. |
| `/_next/*`, static assets | — | **disallow** as per Next defaults | |

**Future (Phase 5):** Public country “lite” guides — default **index, follow** with explicit canonical strategy documented in that phase’s spec; keep paid-only content gated and non-indexed.

---

## 6. Measurable success criteria

### 6.1 SEO

| Metric | Definition | Target direction | Measurement |
|--------|--------------|----------------|-------------|
| Indexed marketing URLs | Count of `/`, `/features`, `/pricing`, and (when live) `/how-nuvare-works` reported as “Indexed” in Google Search Console | Stable or growing after deploy | GSC URL Inspection + Coverage |
| Non-brand impressions | Impressions where query does not contain `nuvare` (case-insensitive) | ↑ vs 4-week baseline after Phase 2+ | GSC Performance, query filter |
| Non-brand CTR | Clicks ÷ impressions on non-brand queries | ↑ or stable with impression growth | GSC Performance |
| Rich result validity | Organization + SoftwareApplication without errors | Valid in Rich Results Test | Manual + GSC enhancements |

**Baseline window:** Capture 4 weeks pre–Phase 2 deploy (or earliest available GSC data) and compare to 4 weeks post-stabilization.

### 6.2 Onboarding and conversion

| Metric | Definition | Target direction | Measurement |
|--------|--------------|----------------|-------------|
| Onboarding completion rate | % of sessions that **start** onboarding (e.g. land on `/onboarding` with intent to proceed) and reach **confirmation** (`ONBOARDING_CONFIRMATION_STEP` completed successfully) | ↑ vs baseline | Product analytics (define `onboarding_started` / `onboarding_completed` events) |
| First-session paid intent | % of new authenticated users who within **first session** either (a) click a primary paid CTA leading toward Stripe checkout, or (b) reach Stripe checkout URL | ↑ vs baseline | Analytics on CTA + redirect to checkout |
| Time to completion | Median time from onboarding start to confirmation | Stable or ↓ (avoid rushing at cost of quality) | Same analytics with timestamps |

**Instrumentation note:** If events do not exist yet, add them in the same PR train as Phase 1–2 or immediately after; until then, use proxy metrics (signup count, checkout starts from `/pricing`) and document the switch date.

---

## 7. Change control

- Copy or indexing policy changes after this lock should go through a short review (product + SEO + legal for YMYL claims).
- Version this file in git; reference commit in release notes when phases ship.

---

*Document version: Phase 0 complete — ready for Phase 1 implementation.*
