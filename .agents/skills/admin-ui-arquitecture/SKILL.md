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

## Routed Page Layout

Every routed view renders inside `core/layouts/page-layout` (`PageLayout`, selector `app-page-layout`), which owns the page frame so views only fill its slots:

- Header (fixed, full width, height by content, positions configured per page):
  - `[pageTitle]`: row 1 left (max 80% width).
  - `[pageActions]`: row 1 right (auto width).
  - `[appPageHeaderContent]`: row 2 full width (for example filters). Requires importing `PageHeaderContent`.
  - `[appPageHeaderFooter]`: row 3 full width (reserved). Requires importing `PageHeaderFooter`.
- Rows 2/3 are collapsible: when a view projects either, the layout renders a toggle next to `[pageActions]`; collapsing keeps only row 1 (title + actions) visible. The toggle is hidden when there is no collapsible content.
- Default slot: the scrollable main content (takes the remaining space, shrinking when a footer is present).
- `[pageFooter]`: optional fixed bottom slot, content-sized (full width), reserved for small-screen navigation or action buttons; enable with `[footer]="true"`. The layout adds no chrome, so style the projected element (border, background, padding) and hide it per breakpoint (for example `sm:hidden`); when its content is hidden the slot collapses to zero height.

View hosts only fill the outlet (`flex min-h-0 flex-1 flex-col`) and project content into these slots; do not rebuild the header/scroll frame per view.

## Responsive Action Placement

- Wide screens (`sm` and up): keep primary actions in the header via `[pageActions]`, so navigation and actions stay together at the top.
- Small screens (below `sm`): move actions to the bottom, close to the thumb, choosing the resource per screen type:
  - Edit/create screens (forms): project the actions into the `[pageFooter]` slot and hide the header copy with `hidden ... sm:flex`; use full-width buttons on a single row (for example cancel/save at 50% each).
  - List/dashboard/home screens: use `FloatingMenu` (`app-floating-menu`) with `class="sm:hidden"` instead of a header overflow menu.
- Do not keep duplicate actions or a header overflow (`...`) menu on small screens; each breakpoint should surface the actions once.

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
- `FloatingMenu` (`app-floating-menu`) is the reusable mobile speed-dial fixed bottom-right: pass `items` (`id`, `label`, `icon`, `action`, optional `disabled`) and optionally `icon`, `closeIcon`, `menuLabel`, `closeLabel`. Hide it on wide screens from the view with `class="sm:hidden"`, and prefer it over header overflow (`...`) menus for small-screen primary actions.
- `Select` (`app-select`) is the reusable dropdown for form controls: a `ControlValueAccessor`, so use it with `formControlName`; pass `options` (`{ value, label }`) and `controlId` (matching the `<label for>` id). Prefer it over native `<select>` to keep the chevron and the popover anchored and styled consistently. Keyboard and ARIA listbox behavior are built in.
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
