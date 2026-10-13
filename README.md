# JoFit — Website

Frontend architecture foundation for the JoFit sports platform.
**English and Arabic, with full RTL.**

> **Status (2026-09-30):** the formal redesign shipped on 2026-09-29 (certification
> body look, deep green and gold; see `.claude/skills/jofit-design` and
> `../REDESIGN-LOG.md`). There are 22 features, each with a mock and an HTTP
> adapter, and `../mock-api` is a reference server for the contract. Sessions
> (httpOnly cookie), accounts, checkout (a reservation: cash or CliQ), a careers
> job board with employer and candidate portals, a coach portal and a support chat
> all exist. Later sections of this file that say "no design", "no auth",
> "HTTP client unused" or "no `loading.tsx`" describe the architecture phase; where
> they disagree with this note, this note and the code win.
>
> **Course catalogue.** Six NCSF programmes (three certifications, three
> specialised: Sports Injuries, Reformer Pilates, Olympic Weightlifting) plus four
> CPD workshops, in `src/mocks/education/index.ts`. Photos are in
> `public/images/courses/` and wired with the `photo(name, w, h, ext?)` helper; all
> six programmes have photos, the CPD workshops have none. No course price is shown
> anywhere — fees are "given on enquiry" until the client sends them.
>
> **Header logo.** The logo in the header assembles itself on a ten-second loop
> (`JofitLogo animate`, keyframes at the end of `src/styles/chrome.css`). Other
> logos on the site are still.

---

## 1. Project purpose

JoFit is a single platform combining several businesses that are usually built
separately:

| Domain | What it covers |
| --- | --- |
| Shop | Products, variants, categories, brands, pricing, cart |
| Rental | Equipment and facility hire over a time window |
| Sports | The taxonomy every other domain is organised around |
| Education | Course discovery and enrolment intent (not an LMS) |
| Coaches | Coach profiles, credentials, published availability |
| Community | Posts, topics, comments |
| Reviews | Ratings and reviews for several kinds of entity |
| Content | Editorial blog, kept separate from commerce |
| Quotations | Business requests for equipment and facilities |

The goal of this phase is a codebase where each of those can grow independently
without collapsing into one tangled application.

**What is deliberately not here:** a backend, a database, authentication,
payments, a design system, or any business rule that has not been decided. Where
a rule is missing it is marked `OPEN BUSINESS DECISION` in the code rather than
invented — see [§20](#20-open-business-decisions).

---

## 2. Tech stack

| Choice | Version | Why |
| --- | --- | --- |
| Next.js (App Router) | 16.3 | Server Components, file-based routing, built-in metadata and sitemap APIs |
| React | 19.2 | Required by Next 16 |
| TypeScript (strict) | 5.x | Domain models are the main deliverable of this phase |
| Tailwind CSS | 4.x | Utility layer only; no design decisions made yet |
| ESLint | 9.x (flat config) | Also enforces the architecture boundaries — see [§4](#4-domain-boundaries) |

**Runtime dependencies: React, Next and `motion` (animation).** No state library, no data
fetching library, no UI kit, no i18n library, no date or class-name helper. Each was considered
and rejected as premature — the reasoning is recorded in [§16](#16-state-management).

```bash
npm install
npm run dev        # http://localhost:3000 (the mock-api, admin and env examples assume -p 3001)
npm run start      # serve a production build
npm run lint       # ESLint, including the architecture boundary rules
npm run lint:fix
npm run typecheck  # next typegen && tsc --noEmit
npm run build      # production build
npm run validate   # all three, in order
```

Copy `.env.example` to `.env.local` if you want to change the defaults. Every
variable is public by design; **no secret may ever be added here** — anything
prefixed `NEXT_PUBLIC_` is compiled into the browser bundle.

Variables read by the code: `NEXT_PUBLIC_SITE_URL` (**a production build throws
without it**), `NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_API_BASE_URL`,
`NEXT_PUBLIC_MEDIA_BASE_URL`, `NEXT_PUBLIC_MOCK_LATENCY_MS`, `NEXT_PUBLIC_ADMIN_URL`.
`scripts/` holds `i18n-add.cjs`, `i18n-remove.cjs` and `sync-account-fixtures.cjs`.

---

## 3. Architecture

The codebase is organised in four layers, and dependencies only ever point
downwards:

```text
  app/            Routing, layouts, metadata, error boundaries
      ↓           (composes features; owns no business logic)
  features/       Business domains: models, services, domain components
      ↓
  services/       Shared data-access infrastructure (HTTP client, adapter resolver)
  lib/            Pure utilities (money, dates, pagination, URLs, SEO, errors)
  types/          Cross-domain primitives (Money, Media, Pagination, …)
  components/     Domain-agnostic UI (feedback states, layout primitives)
  config/         Site, API, feature flags, navigation
```

Two rules make this real rather than aspirational, and **both are enforced by
ESLint**, not by convention:

1. **Shared infrastructure never imports a business domain.** `components/`,
   `lib/`, `services/`, `hooks/`, `config/` and `types/` cannot import
   `@/features/*`. If a "shared" component needs a domain, it is not shared — it
   belongs to that domain.
2. **A feature is used through its public barrel.** `@/features/shop` is allowed;
   `@/features/shop/services/shop.mock` is not.

You can verify the guards are live:

```bash
# Both of these produce lint errors:
echo 'import { shopService } from "@/features/shop";' > src/lib/probe.ts
echo 'import { x } from "@/features/shop/types";'     > src/features/content/probe.ts
npm run lint
```

### Why domain services live inside features

The original sketch put domain services in `services/shop`, `services/rental`
and so on. They live in `features/<domain>/services/` instead, and `services/`
holds only shared infrastructure. The reasons:

- A domain's model, data access and UI form one deletable, movable unit.
- It removes the constant pull between `services/shop` and `features/shop` over
  which one owns `Product`.
- The dependency direction stays unambiguous: features depend on infrastructure,
  never the reverse.

`services/` keeps exactly what is genuinely shared: the HTTP client and the
adapter resolver.

---

## 4. Domain boundaries

Features form a directed acyclic graph. The current edges:

```text
  shop      → sports
  rental    → sports
  coaches   → sports
  education → sports
  content   → sports
  community → sports
  reviews   → (nothing)
  quotations→ sports
  cart      → rental
  checkout  → cart, rental
  search    → shop, rental, coaches, education, content
  account   → checkout, rental, coaches, education, reviews
```

Read it as three tiers:

- **Supporting domains** — `sports` and `reviews` are depended upon and depend on
  nothing. `reviews` importing `shop` would be the first step towards a cycle,
  so it never does: a review points at a *typed target*, not at a product.
- **Core domains** — `shop`, `rental`, `education`, `coaches`, `community`,
  `content`, `quotations` are peers and do not import each other.
- **Cross-domain flows** — `cart`, `checkout`, `search`, `account` compose
  several domains. Nothing imports them back.

One consequence worth knowing: **"Add to cart" buttons live in `features/cart`,
not in `shop` or `rental`.** Adding a line is a cart operation, and putting the
button in the product page's feature created a genuine `rental ↔ cart` cycle.
The product and rental pages compose the cart's component.

---

## 5. Folder structure

```text
website/
├── public/images/            Placeholder SVGs (replaced with the design)
└── src/
    ├── proxy.ts                  Locale negotiation and redirect (Next 16 name)
    ├── app/
    │   ├── global-error.tsx
    │   ├── robots.ts
    │   ├── sitemap.ts
    │   └── [locale]/             Every page lives under a language prefix
    │       ├── layout.tsx        ROOT layout: <html lang dir> + CartProvider
    │       ├── not-found.tsx
    │       ├── (site)/           Storefront chrome (header + footer)
    │       │   ├── _components/  Header, footer, language switcher (app shell)
    │       │   ├── layout.tsx  error.tsx  page.tsx
    │       │   ├── shop/ rental/ sports/ coaches/ education/
    │       │   ├── community/ blog/ search/ quotations/ cart/
    │       │   └── account/      Nested layout with its own sub-navigation
    │       └── (checkout)/       Stripped-back chrome for the checkout flow
    │           ├── layout.tsx
    │           └── checkout/
    ├── components/
    │   ├── feedback/         StateMessage, Empty, Error, Pending, FeatureUnavailable
    │   ├── layout/           PageHeader
    │   └── ui/               SkipLink, VisuallyHidden
    ├── config/               site, api, features (flags), navigation
    ├── features/             One folder per business domain (see §4)
    ├── hooks/                Generic, domain-free hooks
    ├── i18n/                 Locales, dictionaries, translator, formatters
    ├── lib/                  errors, money, date, pagination, url, seo, route
    ├── mocks/                Fixtures — the entire folder is deletable (see §14)
    ├── services/             http/ client + resolve-service.ts
    ├── styles/               globals.css, tokens.css
    └── types/                Money, Media, Pagination, Query, Address, Rating, Seo
```

### Feature folder shape

A feature grows only the folders it needs:

```text
features/<domain>/
├── index.ts          Public barrel — the ONLY entry point for other code
├── types.ts          Domain models
├── services/
│   ├── <domain>.contract.ts   The interface every adapter must satisfy
│   ├── <domain>.mock.ts       Mock adapter (today's only implementation)
│   └── index.ts               Resolves the adapter from config
├── components/       Domain UI (only when it has any)
├── hooks/            Domain hooks
└── utils/            Domain-specific pure helpers
```

`quotations`, `checkout` and `account` have only `types.ts` and `index.ts`. That
is intentional — do not create empty folders ahead of need.

---

## 6. Shop

**Models:** `Product`, `ProductVariant`, `ProductOption`, `ProductCategory`,
`Brand`, `StockStatus`.

- A product owns `options` (the axes it varies on) and `variants` (the concrete
  purchasable combinations). Cart lines reference a **variant**, never a product.
- `priceRange` is precomputed on the product so listings never load every
  variant — this mirrors how a catalogue API actually responds.
- **Stock is a signal, not a count.** `StockStatus` is
  `in-stock | low-stock | out-of-stock | pre-order`. A public frontend rendering
  live inventory numbers is both a data leak and permanently stale.
- Listing state (filters, sort, page) lives **in the URL**, parsed by
  `parseProductListQuery`. That keeps the catalogue server-rendered, shareable
  and cacheable, with no client store involved.
- `listProducts` returns `facets` derived from the full matching set, so filter
  UI is driven by data rather than a hardcoded option list.

---

## 7. Rental

**Rental is not a product with a different price field.** This is the single most
important modelling decision in the codebase.

A rental is a claim on a *physical unit over a time window*, which gives it three
concepts a catalogue product does not have:

| Concept | Type |
| --- | --- |
| An availability calendar | `RentalAvailability`, `RentalAvailabilityDay` |
| A booked period | `RentalPeriod` (`range`, `unit`, `quantity`) |
| A lifecycle that continues after payment | `RentalBookingStatus`: `draft → pending → confirmed → collected → returned` |

Rates are per `hour | day | week` (`RentalRate`), items have a `totalUnits`
ceiling, and some carry a refundable `deposit`.

**Pricing never happens in the browser.** `rentalService.quote(itemId, period)`
returns a `RentalQuote`; the UI renders it and the "add to cart" button commits
it. The mock implementation is deliberately naive and labelled as a placeholder —
real tapering, weekend rates and deposit rules are open decisions that belong to
the backend.

The flow on `/rental/items/[slug]`:

```text
RentalPeriodForm (client)  →  URL ?from&to&unit&qty
                           →  page re-renders on the server
                           →  rentalService.getAvailability() + .quote()
                           →  AddRentalToCartButton (client) commits the quote
```

---

## 8. Coaches

**Models:** `Coach`, `Certification`, `CoachAvailabilitySlot`, `CoachBooking`.

- Availability is a list of **explicitly published slots**, not a rule the
  frontend infers from working hours.
- Coaches are referenced by id from `education` (course instructors) via
  `coachesService.getManyByIds`, so there is one person model, not two.
- Browsing and profiles are implemented. **Booking is a boundary** — it needs an
  account and a payment flow that do not exist.

---

## 9. Education

**Models:** `Course`, `CourseCategory`, `CourseModule`, `CourseCertification`,
`Enrolment`.

Education is prepared as a **catalogue** domain: discovery, detail, and the shape
of an enrolment record. `CourseModule` is a syllabus entry for the marketing
page — not a playable lesson. **No LMS**: no progress tracking, no assessments,
no content delivery.

---

## 10. Community

Feature boundary, gated behind `featureFlags.community` (currently `false`).

The read model (`CommunityPost`, `CommunityTopic`, `CommunityComment`) and a
working mock service exist, and the routes render. Writing, moderation,
reputation and feeds are not built. Flip the flag to see the read path work.

---

## 11. Content

**Models:** `Article`, `ArticleCategory`, `ArticleTag`, `Author`.

Editorial content is kept strictly separate from commerce — an article is never
a product, and the content source (a CMS) is a different system from the
catalogue. Their only connection is the shared sports taxonomy.

`Article.body` is rich text as delivered by the source. **The rendering strategy
(Markdown, portable text, sanitised HTML) is deliberately undecided** and waits
on the CMS choice; only that one field's handling changes when it is settled.

---

## 12. Reviews

Reviews are a **supporting domain**: shop, rental, coaches and education all
reference it, and it references none of them. That direction is what keeps the
graph acyclic.

It is *not* one flat generic system. A review addresses a typed target
(`ReviewTarget = { type, id }`), and each target type declares its own
capabilities in `features/reviews/reviewable.ts`:

```ts
coach: {
  supportsVerifiedPurchase: false,          // there is no purchase to verify
  criteria: [communication, knowledge, punctuality],
},
product: {
  supportsVerifiedPurchase: true,
  criteria: [quality, value],
},
```

Adding a new reviewable entity is one entry in that table plus one member of
`ReviewableType` — no change to storage, querying or rendering.

Each reviewable entity also carries a denormalised `RatingSummary`, exactly as a
real API would return it, so listings can sort and display ratings without
fetching the review collection.

---

## 13. Quotations

Feature boundary, gated behind `featureFlags.quotations` (currently `false`).

`QuotationsService` is **read-only on purpose** — it lists the subjects the
platform accepts requests for and nothing else. A `submit` method is deliberately
absent: adding one now would mean inventing a workflow nobody has decided. The
vocabulary (`QuotationRequestDraft`, `QuotationStatus`) is defined so the form
can be built without reshaping anything.

---

## 14. Mock data

```text
src/mocks/
├── runtime.ts    Shared helpers: latency, text matching, facet counting
├── shop/ rental/ sports/ coaches/ education/ content/ community/ reviews/ quotations/
```

- Fixtures are shaped like realistic API responses (ids, slugs, denormalised
  rating summaries, availability *exceptions* rather than every day of the year).
- They are small on purpose — enough to exercise filtering, sorting, faceting,
  pagination and availability, not to simulate a catalogue.
- **The whole `src/mocks/` tree is deletable.** Only `*.mock.ts` adapters may
  import from it, and ESLint enforces that.
- `NEXT_PUBLIC_MOCK_LATENCY_MS` adds artificial delay so loading states are
  reachable in development. Keep it at `0` in CI.

---

## 15. Future API integration

Today, and after the backend arrives:

```text
Component → Feature → Service → Mock fixtures
Component → Feature → Service → HTTP client → Backend
```

The swap point is `services/resolve-service.ts`:

```ts
export const shopService = resolveService<ShopService>("shop", {
  mock: mockShopService,
  // http: httpShopService,   ← add this line
});
```

`resolveService` picks the adapter from `apiConfig.dataSource`
(`NEXT_PUBLIC_DATA_SOURCE`). **No component, page or hook knows which adapter is
in use** — that is what makes the migration mechanical.

### Replacing mock data with a real API

Per domain:

1. Write `features/<domain>/services/<domain>.http.ts` implementing the same
   `<domain>.contract.ts` interface, using `httpClient` from `@/services`.
   The contract is a TypeScript interface precisely so the compiler checks the
   new adapter against the surface the UI already uses.
2. Register it as `http` in `features/<domain>/services/index.ts`.
3. Set `NEXT_PUBLIC_DATA_SOURCE=http` and `NEXT_PUBLIC_API_BASE_URL`.
4. Delete `src/mocks/<domain>/` and the `*.mock.ts` adapter.

If a response shape differs from the domain model, **map it inside the adapter**.
The domain model is the contract with the UI; the API's wire format is not. The
mock adapters already do exactly this: they map `LocalizedText` fixtures to
single-language domain models, which is the same job an HTTP adapter will do with
an `Accept-Language` header.

`services/http/client.ts` already exists and is intentionally unused: it
normalises errors into `AppError`, applies timeouts via `AbortSignal.timeout`,
and passes Next's `cache`/`revalidate`/`tags` through per call rather than
hardcoding a caching policy. It declares **no endpoints** — there is no backend
to declare them against.

---

## 16. State management

State is separated into three kinds, each with one answer:

| Kind | Examples | Where it lives |
| --- | --- | --- |
| **Server state** | Products, coaches, courses, articles, availability | Server Components calling services. No client cache. |
| **URL state** | Filters, sort, page, search term, rental period | `searchParams`, parsed by each feature's `parseXQuery` |
| **Local UI state** | Input values, "added" confirmations | `useState` in the leaf component |
| **Application state** | The cart | React Context + `useReducer` (`features/cart/store/`) |

**Only one client-side store exists, and it holds only the cart.** Everything
else is server state or URL state, which is why no state library is installed.

Putting filters in the URL rather than a store is a deliberate trade: it keeps
listing pages server-rendered and shareable, and removes an entire category of
client/server synchronisation bugs.

The cart persists to `localStorage` through `store/cart-storage.ts`, versioned
and fully guarded (storage can be unavailable). Hydration happens in an effect
after mount so the server and first client render match; `isHydrated` lets the UI
avoid flicker. When accounts exist, a server-backed cart replaces that one module
— components depend on the `useCart()` hook, not on the storage.

**If this outgrows Context** (measurable re-render cost, or cross-tab sync), the
replacement goes behind `useCart()`. No component changes.

### Server vs Client Components

Server Components are the default. `"use client"` appears in exactly seven files,
all leaves:

```text
features/cart/store/cart-provider.tsx          Application state
features/cart/hooks/use-cart.ts                 Its accessor
features/cart/components/cart-view.tsx          Reads cart state
features/cart/components/cart-indicator.tsx     Reads cart state
features/cart/components/add-*-to-cart-button.tsx  Writes cart state
features/rental/components/rental-period-form.tsx  Form input → URL
features/search/components/search-box.tsx          Debounced input → URL
hooks/use-debounced-value.ts                       Generic client hook
```

`CartProvider` sits in the root layout but does **not** make the tree
client-rendered: its `children` are Server Components passed through as an
already-rendered slot.

---

## 17. Adding a new feature

1. Create `src/features/<name>/` with `types.ts` and `index.ts`. Add folders only
   as you need them.
2. Define the domain models in `types.ts`. Reuse `@/types` primitives (`Money`,
   `Media`, `Paginated`, `RatingSummary`) — but only where the concept is
   genuinely shared. Do not invent `BaseEntity`.
3. Define `services/<name>.contract.ts` as an interface. Every read that returns
   text takes a `Locale`. Include `listSitemapEntries()` if the domain is
   publicly indexable.
4. Implement `services/<name>.mock.ts` against fixtures in `src/mocks/<name>/`.
   Fixtures hold `LocalizedText`; the adapter resolves it. Add both translations
   to `i18n/dictionaries/en.ts` and `ar.ts` — the build fails until Arabic is
   present.
5. Register it in `services/index.ts` with `resolveService`.
6. Export the public surface from `index.ts`. **Everything else stays private.**
7. Add a flag in `config/features.ts` if the domain is not fully built.
8. Check the dependency direction: if your feature needs another, import its
   barrel — and make sure the reverse import does not exist.

Run `npm run lint` — the boundary rules will tell you if you crossed a line.

## 18. Adding a new page

1. Create the route under `src/app/[locale]/(site)/` (or `(checkout)/` for
   minimal chrome). Use route groups **only** when the page chrome genuinely
   differs.
2. Keep it a Server Component. Read the locale from `params`, pass it to every
   service call, and run independent calls with `Promise.all`.
3. Export `metadata` via `buildMetadata`, or `generateMetadata` +
   `metadataFromSeo` for dynamic routes. Never assemble a `Metadata` object by
   hand — canonical URLs and OG defaults come from one place.
4. Get copy from `getTranslator(locale)` and build links with
   `localePath(locale, "/path")` — never a bare `href="/shop"`, which would drop
   the visitor's language.
5. Render exactly one `<h1>`, through `PageHeader`.
6. Handle the missing case with `notFound()`, and the empty case with
   `EmptyState`.
7. If the page needs interactivity, push `"use client"` down to a leaf component
   in the owning feature — not onto the page, and pass its copy in as props.
8. For slow data, wrap the waiting part in an explicit `<Suspense>` rather than
   adding a `loading.tsx` — see the warning in §19.
9. Make sure the route reaches the sitemap via its domain's
   `listSitemapEntries()` (which returns locale-free paths).

---

## 19. Error, loading and empty states

`components/feedback/` provides the technical patterns, with no final appearance:

| Component | Use |
| --- | --- |
| `StateMessage` | The structural primitive behind the rest |
| `EmptyState` | A successful response with no results |
| `ErrorState` | A failure; maps `AppError.code` to user-facing copy |
| `PendingState` | Suspense fallback |
| `FeatureUnavailable` | A domain that is prepared but switched off |

Every data-layer failure is normalised into `AppError` with a stable `code`
(`not-found`, `network`, `timeout`, `unavailable`, …). **Components never inspect
an HTTP status.** Route-level `error.tsx` boundaries catch what escapes, and
`app/global-error.tsx` is the last resort.

Restyling `StateMessage` restyles every non-content state in the platform.

### Streaming: use `<Suspense>`, not `loading.tsx`

There are no `loading.tsx` files in this codebase, and that is deliberate.

A `loading.tsx` applies to its segment **and every child route**. It makes Next
begin streaming the response immediately, so the HTTP status is already committed
as `200` by the time a child page calls `notFound()`. Every missing product,
coach or article then returns a **soft 404** — a "not found" page served with a
`200`, which search engines treat as a real, indexable page.

This was measured, not assumed:

```text
with (site)/loading.tsx     GET /shop/products/nope → 200   ← soft 404
without                     GET /shop/products/nope → 404   ← correct
```

The pattern to use instead is a `<Suspense>` boundary scoped to the part of the
page that actually waits — see `app/(site)/shop/page.tsx`, where the header and
category navigation render immediately and only the product grid streams. Give
the boundary a `key` derived from the query so a filter change shows the fallback
again instead of holding stale results.

If you do add a `loading.tsx`, put it on a segment whose subtree never calls
`notFound()`, and verify the status codes:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/shop/products/does-not-exist
```

---

## 20. Open business decisions

Recorded in the code as `OPEN BUSINESS DECISION` and deliberately not invented:

**Rental** — inclusive vs exclusive day counting; weekend and long-hire rates;
deposit amounts, capture and release timing; late returns; cancellation windows.

**Checkout** — whether purchases and hires settle in one payment or two; tax and
shipping calculation; refunds; guest checkout.

**Coaches** — how slots are generated; commission; cancellation and no-show
policy.

**Education** — enrolment eligibility; payment and refunds; what a certification
requires.

**Reviews** — who may review; moderation; edit windows; whether a booking counts
as a verified purchase.

**Quotations** — the entire workflow: submission handling, routing, SLAs,
approvals, and whether a quotation converts into an order.

**Community** — who may post; moderation; indexability; whether community
identity is the same account as the commerce customer.

**Platform** — currencies; the identity provider; the CMS and therefore the
rich-text rendering strategy. *(Languages are decided: English and Arabic — see
§24.)*

**Localization** — whether product slugs should be translated per language
(today they are shared); whether Arabic is authoritative for the Jordanian
market; who signs off translations; and whether coach-authored profiles must be
supplied in both languages.

---

## 21. SEO

- `lib/seo.ts` — `buildMetadata()` and `metadataFromSeo()` are the single funnel
  for titles, descriptions, canonical URLs, OpenGraph and Twitter cards.
- `SeoMeta` on domain entities lets the content source override per-entity SEO;
  the page supplies fallbacks.
- `app/sitemap.ts` composes each domain's `listSitemapEntries()`. Adding a domain
  is one line — there is no central URL list to keep in sync, and it starts
  working against the real API the moment the adapters switch.
- **Bilingual signals** are emitted by the same funnel: a canonical URL inside
  the current language, `hreflang` alternates for every language plus
  `x-default`, and `og:locale` / `og:locale:alternate`. Without those, the two
  language versions compete with each other in search results instead of being
  understood as translations.
- `app/robots.ts` disallows `/cart`, `/checkout`, `/account` and `/search` **in
  every locale** — the disallow list is expanded per language, not written once.
- `jsonLdScriptProps()` builds structured data; each domain decides its own
  schema (see the blog article page).

## 22. Accessibility

Baked into the structure rather than retrofitted: a skip link to `#main-content`
in both layouts, one `<h1>` per page via `PageHeader`, `<nav>` elements with
`aria-label`, sections tied to their headings with `aria-labelledby`, labelled
form controls, `role="status"` / `role="alert"` on feedback, `aria-busy` on
pending regions, and a visible `:focus-visible` outline in `globals.css`.

## 23. Design readiness

Nothing about the visual identity has been decided — no colours, typography,
spacing scale, card style, navigation or hero design.

What is in place for the design phase:

- `src/styles/tokens.css` — neutral placeholder tokens, exposed to Tailwind via
  `@theme`. The Figma's palette and scales replace these values; components
  reference token names, so that swap does not touch component code.
- `components/ui/` and `components/feedback/` — structural primitives that fix
  semantics, not appearance.
- Placeholder markup is confined to pages, `app/(site)/_components/` and a
  handful of feature components. Data fetching, routing, types and services are
  untouched by restyling.

Responsive support exists as structure (fluid grids that stack, `max-w`
containers) rather than as final breakpoints, which the Figma will define.

---

## 24. Internationalisation — English & Arabic

The site is bilingual end to end. Language is a **routing and data concept**, not
a string-replacement layer bolted on top.

### Locale is in the URL

Every page lives under a language prefix: `/en/shop`, `/ar/shop`. A public,
indexable site needs one stable URL per language — a client-side toggle would
leave both languages sharing one URL, which search engines cannot index
separately and visitors cannot share.

`src/proxy.ts` — the edge hook Next 16 renamed from `middleware` — sends a
prefix-less request somewhere: a previously chosen
language (cookie), then `Accept-Language`, then English. The redirect is **307,
not 308** — the right target depends on who is asking, and a permanent redirect
would be cached and pin every later visitor to the first visitor's language.

`app/[locale]/layout.tsx` is the **root layout**; there is no `app/layout.tsx`.
`<html>` needs `lang` and `dir`, and both depend on the locale, which only exists
inside that segment. Putting the document shell above it would mean either
reading a request header — making every page dynamic — or shipping the wrong
direction on first paint.

An unknown language (`/fr/shop`) is a 404, not a silent fallback to English.

### Locale reaches the data layer

`ListQuery.locale` is **required, not optional**. An optional locale would
silently fall back to English on any call site that forgot it, and a public page
in the wrong language is a bug you only notice in production. The compiler
catches it instead — adding the field surfaced every call site in one pass.

```text
mocks (LocalizedText)  →  adapter resolves one language  →  domain model (string)
```

Storefront domain models carry plain `string`, because a public page needs one
language and shipping the other is waste. Resolution happens in the adapter —
precisely where a real API will read an `Accept-Language` header — so no
component ever handles more than one language.

**The admin is the mirror image:** it stores `LocalizedText` because staff edit
every language. That asymmetry is one reason the two apps do not share models.

### Type-safe dictionaries

`i18n/dictionaries/en.ts` is the source of truth for the key set;
`TranslationKey` is derived from it and `ar.ts` is typed as `Dictionary`. **A
missing or misspelled Arabic key is a compile error**, never a silent English
fallback on a public page.

```ts
const t = getTranslator(locale);
t("shop.title");
t("shop.productCount", { count: number(total) });   // {count} placeholder
```

Interpolation exists because word order differs between English and Arabic —
sentences must stay whole and reorderable, never concatenated from fragments.

Dictionaries are read in **Server Components**, so they never reach the browser
bundle. The handful of Client Components (cart, search box, rental period form)
receive their copy as props — translation stays on the server.

### Direction and layout

`dir` is set once on `<html>`. There is **no RTL stylesheet and no mirrored
overrides**: components use logical properties (`ms-*`, `pe-*`, `start-*`,
`text-start`), which Tailwind resolves against `dir`, so the layout mirrors
automatically.

`globals.css` gives Arabic slightly more line height — typographic necessity at
the same font size, not a design decision.

### Numbers, dates and money

Bound to the locale in `getFormatters(locale)`, so formatting is decided once.
Arabic is pinned to `ar-JO-u-nu-latn`: **Latin digits** (`32.000 د.أ.`), which is
what Jordanian commerce uses. Dropping that subtag in `i18n/locales.ts` switches
to Arabic-Indic digits (`٣٢٫٠٠٠`) — a one-line change.

### What is and is not translated

**Localized** — content the platform authors: product titles and descriptions,
category names, article bodies, sport names, course syllabi, quotation subjects.

**Not localized** — real-world data in whatever language it was written: customer
names, review bodies, community posts and comments, SKUs, order references. Brand
names are proper nouns ("Apex" is "Apex" in both), and option values are not
prose ("42" is "42"). All customer-written text is rendered with `dir="auto"`, so
an Arabic review and an English one read correctly in the same list.

### The language switcher

Real `<a>` links, not a `<select>`: each language version has its own URL, so it
must be crawlable and shareable; the switch works without JavaScript; and the
links match the `hreflang` tags the metadata already emits. It stays on the same
page (`stripLocale` + `localePath`) and records the choice in a cookie the
middleware reads.

### Verified behaviour

```text
GET /                    Accept-Language: (none)   → 307 /en
GET /                    Accept-Language: ar-JO    → 307 /ar
GET /shop                Accept-Language: fr-FR    → 307 /en/shop
GET /ar                  <html lang="ar" dir="rtl">
GET /ar/search?q=كرة     matches Arabic product titles
GET /fr                  → 404
GET /ar/shop  →  canonical /ar/shop · hreflang en, ar, x-default
```
