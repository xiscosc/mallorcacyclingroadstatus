# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SvelteKit web app (`mallorcacyclingroads.cc`) that surfaces live road closures on Mallorca's road-cycling network. Users can upload a GPX or paste a Komoot tour URL to see whether their ride intersects an active incident. Deployed as a single Cloudflare Worker (web + cron) with R2 for incident snapshots.

## Commands

Package manager is **Bun** (`bun.lock`, `.npmrc` enforces `engine-strict=true`).

- `bun install` — install dependencies
- `bun run dev` — start `vite dev` (uses `platformProxy` to expose R2/vars/secrets via `event.platform`, sharing Miniflare state with `wrangler dev`)
- `bun run build` — `vite build` (produces `.svelte-kit/cloudflare/` consumed by `src/worker.ts`)
- `bun run preview` — preview the production build
- `bun run check` — `svelte-kit sync && svelte-check` (TypeScript + Svelte diagnostics)
- `bun run lint` — `prettier --check . && eslint .`
- `bun run format` — `prettier --write .`

There is **no test suite** in this repo.

Local secrets: copy `.dev.vars.example` → `.dev.vars` (gitignored) and fill in `CONSELL_POINTS_URL`, `CONSELL_LINES_URL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`. Use Cloudflare Turnstile's always-passing test pair locally.

## Architecture

### Single-worker layout (web + cron)

`src/worker.ts` is a thin wrapper that re-exports the `fetch` handler from `adapter-cloudflare`'s generated worker (`.svelte-kit/cloudflare/_worker.js`) and adds a `scheduled` handler that calls `runCron`. `wrangler.toml` points `main` here, so SvelteKit and the cron cohabit one worker. The build artifact only exists after `vite build`, hence the `@ts-ignore` on its import.

**`wrangler.build.jsonc` — do not delete.** As of `@sveltejs/adapter-cloudflare` v7, the adapter writes its generated (fetch-only) worker to whatever `main` points at in the wrangler config it reads, **deleting the file there first**. If it read `wrangler.toml` (`main = src/worker.ts`) it would clobber our wrapper on every build, dropping `scheduled()` from the deploy — the cron then fails at runtime with `Handler does not export a scheduled() function`. So `svelte.config.js` passes the adapter a separate build-only config (`config: './wrangler.build.jsonc'`) whose `main` points at the adapter's own output path (`.svelte-kit/cloudflare/_worker.js`). `wrangler deploy` still reads `wrangler.toml` and bundles `src/worker.ts`. The build config duplicates only `name`, `compatibility_date`/`flags`, and `assets.directory`/`binding` — keep those in sync with `wrangler.toml`; **all bindings/vars/crons/routes live solely in `wrangler.toml`.**

`wrangler.toml` defines:

- R2 binding `INCIDENTS` (bucket `mallorca-cycling-incidents`)
- Cron `0 */6 * * *` (every 6 hours UTC)
- Custom domain route `mallorcacyclingroads.cc`
- `vars.TURNSTILE_SITE_KEY` (public); secrets set via `wrangler secret put`

### Incidents pipeline

1. **Cron** (`src/lib/server/cron.ts`) iterates `IncidentsProvider` instances, asking each for `CYCLING_ROADS` (curated list in `src/lib/cycling-roads.ts`) and keeping whatever passes `affectsRiders` (`src/lib/incidents.ts`): full closures, traffic cuts, and eclipse restrictions. Roadworks that only warn (`Precaució`, `Sense restriccions`, `Estrenyiment de calçada`) are dropped as noise on a bike. **Partial-failure tolerant**: if any provider succeeds the merged result is written to R2 key `incidents.json`; if **all** providers fail nothing is written, preserving last-known-good data.
2. **R2 store** (`src/lib/server/incidents-store.ts`) wraps reads behind a Cloudflare edge cache (`CACHE_KEY = https://cache.internal/incidents.json`, TTL 1h). After every cron write, `invalidateIncidentsCache` deletes the cache entry so the next request repopulates from R2. Date strings are revived to `Date` on read.
3. **Page load** (`src/routes/+page.server.ts`) calls `readIncidents(platform.env.INCIDENTS, platform.caches.default)` and returns the snapshot plus `turnstileSiteKey` to the client.

### Provider abstraction

`src/lib/server/incidents/provider.ts` exposes an abstract `IncidentsProvider` with shared helpers: `parseJsonOrJsonp` / `parseJsonp` (for `cb({...})` JSONP wrappers) and `utm31nToLngLat` (UTM Zone 31N → WGS84 via `proj4`). Adding a new source = subclass it and append the instance in `cron.ts:buildProviders`. The current implementation `ConsellDeMallorcaArcGisProvider` reads the Consell's ArcGIS REST layers (`f=json`): an `incidencies` point layer (metadata) joined to a `trams` polyline layer (geometry) by `idlocalit` — note `idinciden` is _not_ unique, one incident spans several road stretches. Both layers already ship WGS84 coordinates and epoch-millisecond dates; the provider still checks the declared `spatialReference` and reprojects UTM 31N if the endpoint ever serves it. A road is treated as closed when `gravetat`/`afeccio` is `TANCADA`; `hasTrafficCuts` is set from an `afeccio` naming a cut (`Tall de carril`, `Tall mòbil`, `Talls intermitens`) and `causa: Eclipsi` maps to `IncidentType.Eclipse`. Iteration is driven by the **point** layer so a row with no matching stretch (a PK marker) still comes through with its anchor point as its only geometry.

The shared `Incident` type (`src/lib/incidents.ts`) is a `MultiLineString` in WGS84 `[lng, lat]` plus an optional `location` anchor point and metadata; geometry must already be in WGS84 by the time it leaves the provider. `coordinates` may be empty when the source only pins a point — consumers must handle that (see route checking below).

### Route checking

Two entry points feed a single reactive checker (`src/lib/route-check.svelte.ts`, exported via `createRouteChecker`):

- **GPX**: parsed entirely client-side in `src/lib/gpx.ts` via `@tmcw/togeojson` + DOMParser.
- **Komoot URL**: posted to the SvelteKit form action `?/komoot` in `+page.server.ts`. Komoot's API is CORS-blocked from browsers, so the fetch must run server-side. The action is gated by Cloudflare Turnstile (`verifyTurnstile`) — the client widget posts a token alongside the URL.

`findAffectedIncidents` (in `gpx.ts`) does a bbox prefilter (with a meters→degrees pad) before per-track-point distance checks against each incident line via `@turf/point-to-line-distance`. Incidents with no line geometry fall back to measuring their `location` against the track _line_ — not against its vertices, which sit tens of meters apart and would let a route pass straight over a marker unflagged. Default tolerance 25 m. The loop yields to the event loop every 10 incidents to keep the spinner painting.

### UI

- Incidents render in four states, keyed by colour on the map and legend: closed (`#da272c`), traffic cuts (`#f3931a`), eclipse restrictions (`#8059a6`, linked to `ECLIPSE_INFO_URL` from `$lib/eclipse`), and bus-only closures (`#319151`, see `isBusOnlyClosure`). Eclipse and bus-only hits are kept out of the route checker's `affected` list — they get their own note in `route-check-banner.svelte` instead of counting as blockers.
- **Svelte 5 runes mode is forced** in `svelte.config.js` for everything outside `node_modules`. Prefer `$state`, `$derived`, `$props`, `$effect`. Stateful modules use the `.svelte.ts` suffix (e.g. `route-check.svelte.ts`).
- Components under `src/lib/components/ui/` are **shadcn-svelte** primitives — installed via the CLI (config in `components.json`, style `nova`, base color `neutral`, icons via `lucide`). When adding new ones, use the shadcn-svelte CLI rather than hand-rolling.
- Map rendering uses **MapLibre GL** wrapped by Svelte components in `$lib/components/ui/map/` (`Map`, `MapRoute`, `MapMarker`, `MapControls`, popup/tooltip helpers). Theme syncs with the `theme` store and Tailwind's `dark`/`light` classes on `<html>`.
- Tailwind v4 via `@tailwindcss/vite`; the stylesheet lives at `src/routes/layout.css` (also referenced by `prettier-plugin-tailwindcss` and `components.json`).

### Static pages

`src/routes/support/+page.svelte` is the public support / contact page (linked from the homepage footer and required by Strava's API terms). It documents the contact email and the project's data-handling stance: GPX is parsed client-side, Komoot URLs are fetched server-side without persistence, and Strava OAuth tokens live only in httpOnly cookies on the user's browser. Keep that page in sync with any change to how user-supplied data is handled. Cross-route links must use `resolve()` from `$app/paths` (the `svelte/no-navigation-without-resolve` lint rule is enforced).

### Internationalization (Paraglide)

i18n is handled by **Paraglide JS** (`@inlang/paraglide-js`). Four locales: `en` (base), `de`, `es`, `ca`. Sources: `messages/<locale>.json` (each keyed identically); project config in `project.inlang/settings.json`; the Vite plugin compiles into `src/lib/paraglide/` (gitignored, also in `.prettierignore`).

- **Adding/changing strings**: edit every `messages/*.json` (keys must match across files), then `bun run dev` (vite plugin recompiles) or run `bunx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` manually. Use `m.<key>()` from `$lib/paraglide/messages` in components; pass placeholders as `m.foo({ name: 'x' })`. There is no built-in pluralization helper — use `_one`/`_other` keys + a ternary in the call site (see `home_closures_one`/`_other` in `+page.svelte`).
- **Locale resolution strategy** (`vite.config.ts`): `['cookie', 'preferredLanguage', 'url', 'baseLocale']`. Order matters — cookie wins so the language switcher is sticky, then browser `Accept-Language`, then URL prefix, then `en`. Paraglide's middleware (`src/hooks.server.ts`) issues a 307 to the localized URL when the resolved locale and the URL locale disagree (only on `Sec-Fetch-Dest: document` requests).
- **URL shape**: English is at `/`, others get prefixes (`/de/`, `/es/`, `/ca/`). The reroute hook (`src/hooks.ts`) strips the prefix so SvelteKit routes once. **Exception**: paths in the regex `NON_LOCALIZED` (`/sitemap.xml`, `/robots.txt`, and any `/<locale>/sitemap.xml` etc.) are not localized — their localized variants must 404, and the canonical path must not redirect. Mirror this with `routeStrategies: [..., { exclude: true }]` in the Vite plugin so the middleware doesn't redirect them either. **When adding more locales or non-localized paths, update both the regex in `src/hooks.ts` and `routeStrategies` in `vite.config.ts`.**
- **SEO**: `+layout.svelte` emits per-locale `canonical`, `og:url`, `og:locale`, JSON-LD `inLanguage`, and one `<link rel="alternate" hreflang="...">` per locale plus `hreflang="x-default"` (English). The sitemap (`src/routes/sitemap.xml/+server.ts`) emits `routes × locales` URLs each with full `xhtml:link` alternates — when adding a route, append it to its `ROUTES` array.
- **Language switcher**: `src/lib/components/language-switcher.svelte` (mounted next to the theme toggle on home + support). Calls Paraglide's `setLocale()` which writes the `PARAGLIDE_LOCALE` cookie and navigates to the localized URL. To add a locale: append to `project.inlang/settings.json`, create `messages/<code>.json`, recompile, and add a name to the `NAMES` map in the switcher.
- **Translating the cycling-road region metadata**: `src/lib/cycling-roads.ts` is the source of truth for region IDs. The support page maps each `region.id` to a message key via `REGION_NAME` / `REGION_DESCRIPTION` lookup tables — keep those tables in sync with `cycling-roads.ts` and the `region_*` keys in every message file.

### Path aliases

Standard SvelteKit: `$lib` → `src/lib`, `$app/*` from the runtime. `tsconfig.json` extends `.svelte-kit/tsconfig.json`, so run `svelte-kit sync` (or `bun run check`) if alias resolution looks broken after changing config.

## Conventions

- **Prettier**: tabs, single quotes, no trailing commas, 100-col print width, `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`. Always run `bun run format` before committing.
- **Dates/times**: use Luxon (`DateTime` from `luxon`) for parsing, formatting, and zone conversion in user-facing code. Display times in `Europe/Madrid` (e.g. `DateTime.fromISO(iso).setZone('Europe/Madrid').toFormat('dd LLL HH:mm')`). The Consell provider needs no date parsing — its feed carries epoch milliseconds.
- **Platform bindings** are typed in `src/app.d.ts` under `App.Platform.env`; add new R2/var/secret bindings there _and_ in `wrangler.toml`.
- New incident sources: implement `IncidentsProvider`, add to `buildProviders` in `cron.ts`, surface any new env vars in `app.d.ts`, `wrangler.toml`, `.dev.vars.example`, and the `CronEnv` type.
- The `CYCLING_ROADS` whitelist in `src/lib/cycling-roads.ts` excludes motorways/autovías where bikes are banned (Ma-1, Ma-13, Ma-19, Ma-20, Ma-30) and is segment-aware for partially-banned roads (Ma-11, Ma-11A, Ma-15) — read the header comment before editing.
