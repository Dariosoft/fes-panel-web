---
name: admin-ui-arquitecture
description: Use when creating or reviewing panel-web admin UI architecture, routed pages, shell layout, navigation, sidebar behavior, and placement of persistent admin chrome.
---

# Admin UI Arquitecture

Use this skill when adding, moving, or reviewing `panel-web` screens, routes, layout, navigation, or shared UI chrome.

## App Shell

- Treat `panel-web` as an administrative SPA, not as independent standalone pages.
- Keep the primary admin shell at `App` level so it wraps the router for almost every authenticated or operational screen.
- The sidebar is persistent application chrome and should appear across the admin experience unless a screen has an explicit full-screen exception.
- Render the current page inside the shell with `<router-outlet />`.
- Do not duplicate the sidebar inside routed views.

## Routing

- Put routed screens under `views/<view-name>/`; avoid a generic `features/` folder for page components.
- Views should render page content, not the whole application frame.
- Place route-specific headings, cards, tables, forms, and empty states inside routed components.
- Keep global navigation, session controls, brand, and persistent sidebar outside routed page components.

## Focus Styling

- Inside viewport edges or containers with `overflow`, use inset focus rings:
  `focus-visible:outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-ring`.
  Do not use positive `outline-offset` there; external outlines are clipped.

## Angular State And Navigation

- Keep cross-application Angular building blocks under `core/` by category: `components/`, `services/`, `models/`, `constants/`, `guards/`, `interceptors/`, `directives/`, `pipes/`, `tokens/`, and similar shared concepts.
- Put shared injectables under `core/services/<capability>/`; keep names responsibility-based and add a `Service` suffix only when it removes ambiguity.
- Put reusable presentational components under `core/components/<component-name>/`; keep routed view-only components under `views/`.
- Components under `core/components/` must be domain-neutral: generic names, inputs,
  models, and text. A component tied to one route/domain belongs under
  `views/<view-name>/components/` unless it is abstracted first.
- Provide reusable UI state services at component scope when state must not leak
  between component instances (for example, an image carousel index).
- Put shared models and DTO-like types under `core/models/`; do not hide them inside service folders.
- Put stable application constants under `core/constants/` or a feature-local constants file when the value is not globally shared.
- Put route guards under `core/guards/` when shared across views; keep view-specific guards near that view until reuse appears.
- Add colocated unit specs for views, components, and services; models and constants do not need specs unless they gain behavior.
- Keep direct `panel-api` URL construction and HTTP calls inside services; components and state-facing services should delegate instead of embedding backend paths.
- Keep `HttpClient` flows as Observables; prefer `subscribe({ next, error })` for state effects instead of converting to Promises with `firstValueFrom`, `lastValueFrom`, or `toPromise`.
- Use Angular `Router` for internal SPA navigation and query-param cleanup.
- Use Router APIs such as `parseUrl` and `navigate` for Angular URL state; do not parse `router.url` with fake absolute URL bases.
- Use a small dedicated service such as `ExternalNavigation` for leaving the SPA to backend/OAuth URLs; do not call `globalThis`, `window.location`, or `history` directly from feature/state services.
- Keep stable state strings in local feature constants, not repeated inline literals.

## Sidebar

- The sidebar represents the admin product structure and should remain visible on desktop.
- On small screens, it may collapse, stack, or become a mobile navigation surface, but it should still behave as global app chrome.
- Reuse existing brand assets such as `/favicon.svg` instead of duplicating inline SVG markup.

## Exceptions

- Only bypass the admin shell for explicit full-screen flows such as public login callbacks, maintenance pages, embedded previews, or future unauthenticated landing pages.
- If a route needs an exception, document why in the route or spec before implementing it.
