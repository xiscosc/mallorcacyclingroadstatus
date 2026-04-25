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

`wrangler.toml` defines:
- R2 binding `INCIDENTS` (bucket `mallorca-cycling-incidents`)
- Cron `0 */6 * * *` (every 6 hours UTC)
- Custom domain route `mallorcacyclingroads.cc`
- `vars.TURNSTILE_SITE_KEY` (public); secrets set via `wrangler secret put`

### Incidents pipeline

1. **Cron** (`src/lib/server/cron.ts`) iterates `IncidentsProvider` instances, filtering to `CYCLING_ROADS` (curated list in `src/lib/cycling-roads.ts`) and `isClosed: true`. **Partial-failure tolerant**: if any provider succeeds the merged result is written to R2 key `incidents.json`; if **all** providers fail nothing is written, preserving last-known-good data.
2. **R2 store** (`src/lib/server/incidents-store.ts`) wraps reads behind a Cloudflare edge cache (`CACHE_KEY = https://cache.internal/incidents.json`, TTL 1h). After every cron write, `invalidateIncidentsCache` deletes the cache entry so the next request repopulates from R2. Date strings are revived to `Date` on read.
3. **Page load** (`src/routes/+page.server.ts`) calls `readIncidents(platform.env.INCIDENTS, platform.caches.default)` and returns the snapshot plus `turnstileSiteKey` to the client.

### Provider abstraction

`src/lib/server/incidents/provider.ts` exposes an abstract `IncidentsProvider` with shared helpers: `parseJsonp` (for `cb({...})` JSONP wrappers) and `utm31nToLngLat` (UTM Zone 31N → WGS84 via `proj4`). Adding a new source = subclass it and append the instance in `cron.ts:buildProviders`. The current implementation `ConsellDeMallorcaRoadsProvider` joins a points feed (metadata, keyed by `codi`) with a lines feed (geometry) and parses `DD/MM/YYYY HH:MM` dates as `Europe/Madrid` via Luxon.

The shared `Incident` type (`src/lib/incidents.ts`) is a `MultiLineString` in WGS84 `[lng, lat]` plus metadata; geometry must already be in WGS84 by the time it leaves the provider.

### Route checking

Two entry points feed a single reactive checker (`src/lib/route-check.svelte.ts`, exported via `createRouteChecker`):

- **GPX**: parsed entirely client-side in `src/lib/gpx.ts` via `@tmcw/togeojson` + DOMParser.
- **Komoot URL**: posted to the SvelteKit form action `?/komoot` in `+page.server.ts`. Komoot's API is CORS-blocked from browsers, so the fetch must run server-side. The action is gated by Cloudflare Turnstile (`verifyTurnstile`) — the client widget posts a token alongside the URL.

`findAffectedIncidents` (in `gpx.ts`) does a bbox prefilter (with a meters→degrees pad) before per-track-point distance checks against each incident line via `@turf/point-to-line-distance`. Default tolerance 25 m. The loop yields to the event loop every 10 incidents to keep the spinner painting.

### UI

- **Svelte 5 runes mode is forced** in `svelte.config.js` for everything outside `node_modules`. Prefer `$state`, `$derived`, `$props`, `$effect`. Stateful modules use the `.svelte.ts` suffix (e.g. `route-check.svelte.ts`).
- Components under `src/lib/components/ui/` are **shadcn-svelte** primitives — installed via the CLI (config in `components.json`, style `nova`, base color `neutral`, icons via `lucide`). When adding new ones, use the shadcn-svelte CLI rather than hand-rolling.
- Map rendering uses **MapLibre GL** wrapped by Svelte components in `$lib/components/ui/map/` (`Map`, `MapRoute`, `MapMarker`, `MapControls`, popup/tooltip helpers). Theme syncs with the `theme` store and Tailwind's `dark`/`light` classes on `<html>`.
- Tailwind v4 via `@tailwindcss/vite`; the stylesheet lives at `src/routes/layout.css` (also referenced by `prettier-plugin-tailwindcss` and `components.json`).

### Path aliases

Standard SvelteKit: `$lib` → `src/lib`, `$app/*` from the runtime. `tsconfig.json` extends `.svelte-kit/tsconfig.json`, so run `svelte-kit sync` (or `bun run check`) if alias resolution looks broken after changing config.

## Conventions

- **Prettier**: tabs, single quotes, no trailing commas, 100-col print width, `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`. Always run `bun run format` before committing.
- **Platform bindings** are typed in `src/app.d.ts` under `App.Platform.env`; add new R2/var/secret bindings there *and* in `wrangler.toml`.
- New incident sources: implement `IncidentsProvider`, add to `buildProviders` in `cron.ts`, surface any new env vars in `app.d.ts`, `wrangler.toml`, `.dev.vars.example`, and the `CronEnv` type.
- The `CYCLING_ROADS` whitelist in `src/lib/cycling-roads.ts` excludes motorways/autovías where bikes are banned (Ma-1, Ma-13, Ma-19, Ma-20, Ma-30) and is segment-aware for partially-banned roads (Ma-11, Ma-11A, Ma-15) — read the header comment before editing.
