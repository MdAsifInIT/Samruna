# Samruna Landing Page Overhaul Implementation Plan

## Phase Objective

Replace the current public landing route with a polished, premium SaaS landing experience for Samruna while preserving the existing dashboard workspace, route behavior, demo state, and test coverage. The implementation should remain narrowly scoped to the public landing page, shared design tokens needed by that surface, and the tests that prove the route still works.

This plan supersedes the earlier high-level blueprint by making the work executable, testable, and aligned with the Build Web Apps verification workflow.

## Current Repo Baseline

- Framework: React 19, Vite 6, TypeScript 6.
- Entry point: `src/App.tsx` owns the public landing route and the dashboard handoff.
- Current route behavior:
  - `/` renders `LandingPage`.
  - Clicking `Launch` pushes the dashboard route built from `import.meta.env.BASE_URL`, normally `/dashboard`, and renders `AppShell`.
  - `/dashboard` opens the workspace directly.
  - `/#demo` is normalized to the same `BASE_URL`-aware dashboard path.
- Current landing components live inside `src/App.tsx`:
  - `LandingPage`
  - `ProductPreview`
- Current global styling lives in `src/styles.css`; it contains both landing-page styles and workspace styles.
- Current test surfaces:
  - `src/App.test.tsx` verifies the landing page, launch flow, dashboard routing, legacy hash normalization, and workspace flows.
  - Playwright e2e tests are configured under `tests/e2e`.
- Existing scripts to preserve:
  - `npm run dev`
  - `npm run demo:dev`
  - `npm run demo:reset`
  - `npm run demo:seed`
  - `npm run backend:dev`
  - `npm run backend:seed`
  - `npm run backend:reset`
  - `npm run dev:fullstack`
  - `npm run preview:fullstack`
  - `npm run typecheck`
  - `npm run typecheck:server`
  - `npm run typecheck:e2e`
  - `npm test`
  - `npm run test:backend`
  - `npm run build`
  - `npm run verify:demo`
  - `npm run verify:fullstack`
  - `npm run scan:frontend-secrets`
  - `npm run test:e2e`
  - `npm run test:e2e:preview`
  - `npm run test:e2e:install`

## Scope Boundaries

### In Scope

- Upgrade the public landing page at `/`.
- Keep the dashboard handoff behavior exactly intact.
- Extract landing-specific components from `src/App.tsx` if it improves maintainability.
- Add Tailwind CSS only if it is staged safely and does not break existing workspace styles.
- Add Framer Motion only for purposeful, accessibility-aware motion.
- Add or update tests for landing page rendering, CTA behavior, accessibility landmarks, and responsive-safe structure.
- Add browser QA evidence through the Build Web Apps verification flow.

### Out of Scope

- Reworking `AppShell`, dashboard navigation, feature views, domain logic, server behavior, fixtures, persistence, or API provider logic.
- Deleting broad sections of `src/styles.css` before the new landing page is verified.
- Replacing workspace CSS with Tailwind in this phase.
- Adding external services, analytics, or credentials.
- Shipping a static screenshot as the product UI.

## Build Web Apps Quality Gates

The landing page is a visual redesign, so execution must follow these gates before code is considered done:

1. **Concept Gate**
   - Produce an accepted visual concept before coding.
   - The concept must cover the first viewport and downstream landing sections, not just a hero.
   - If section details are unreadable, generate standalone section/detail concepts before implementation.
   - Do not invent unrelated product claims, fake metrics, or extra workflows that Samruna does not support.

2. **Design System Gate**
   - Extract implementation tokens from the accepted concept:
     - background, surface, text, muted text, accent, semantic states
     - border, radius, elevation, shadow
     - spacing scale, type scale, font weights, line heights
     - button, nav, graph visual, card/panel, and CTA variants
   - Record the above-the-fold copy list before coding.
   - Preserve the existing Samruna brand mark and product story unless the accepted concept explicitly changes them.

3. **Implementation Fidelity Gate**
   - Implement from the accepted concept, not from memory.
   - Preserve visible copy, hierarchy, section order, first-viewport balance, palette, spacing, typography, motion, and CTA labels.
   - Avoid decorative hero eyebrows, pills, badges, gradient blobs, or filler cards unless they are in the accepted concept.
   - The first viewport must clearly show Samruna, the product promise, the primary CTA, and a hint of the next section on mobile and desktop.

4. **Browser Verification Gate**
   - Use the in-app Browser path first when available.
   - If the in-app Browser cannot connect, use the Chrome plugin as the approved fallback and record the fallback reason.
   - Flow under test: `app loads at / -> landing page renders -> Launch opens /dashboard -> dashboard first view renders`.
   - Check desktop and one mobile-sized viewport at minimum.
   - Verify no framework overlay, no blank page, no relevant console errors or warnings, and no obvious overlap/clipping.
   - Capture screenshot evidence and compare the browser render against the accepted concept.
   - Store temporary screenshots outside the repo unless the user explicitly asks for committed QA artifacts.

## Product Story and Content Inventory

The redesign should keep Samruna's current product narrative:

- Product name: `Samruna`
- Core promise: hidden work patterns become governed automation with validation before execution.
- Primary CTA: `Launch`
- Secondary CTA: `View on GitHub` only if the repository URL is already known or added as a deliberate requirement.
- Core proof/story beats:
  - Pattern discovery
  - Governed proposal
  - Safe execution
  - Approval and auditability before action
- Product preview should reflect real demo state from `useWorkGraphDemoController`, including provider status and selected scenario labels where useful.

Avoid introducing unsupported claims such as customer counts, production impact, security certifications, benchmark scores, or enterprise compliance labels unless backed by existing repo content.

## Target Information Architecture

### First Viewport

- Header:
  - Samruna brand mark
  - Optional minimal navigation only if it maps to sections that exist on the page
  - Optional GitHub CTA if repository URL is confirmed
- Hero:
  - H1: `Samruna`
  - Short value proposition using the existing product language
  - Primary `Launch` button
  - Product visual that communicates governed automation, not a generic abstract dashboard
- Next-section hint:
  - At least the top of the workflow/proof section should be visible on common desktop and mobile viewports.

### Main Body

- Workflow section:
  - Three stages: Pattern discovery, Governed proposal, Safe execution.
  - Each stage should be tied to what the current demo actually does.
- Product visual section:
  - A Work Graph or proposal flow visual driven by code-native UI, SVG, or component markup.
  - Text remains accessible and code-native.
- Proof/credibility section:
  - Use cautious language around synthetic demo traces.
  - Reuse current impact framing only if labeled as projected or demo-derived.
- Final CTA:
  - Reinforce the launch action.
  - Secondary GitHub action only if URL is present and verified.

## Design Direction

Working direction: premium operational SaaS, calm and precise rather than decorative.

- Visual language:
  - Clean canvas with intentional product signal.
  - A restrained palette using existing Samruna variables as the base.
  - Avoid a one-note dark blue, purple, beige, or orange palette.
  - Use high-contrast text and clear interactive states.
- Layout:
  - Use full-width sections or constrained unframed layouts.
  - Use cards only for individual repeated items or genuinely framed product previews.
  - Avoid nested cards and decorative floating section wrappers.
- Radius:
  - Prefer the existing token system.
  - If Tailwind utilities are used, map them to existing radii instead of hardcoding arbitrary large radius classes everywhere.
- Typography:
  - Use a disciplined display/body scale.
  - Do not rely on browser-default button or control typography.
  - Avoid viewport-width font scaling.
- Motion:
  - Use motion to clarify hierarchy and state.
  - Animate only transform and opacity for routine transitions.
  - Respect `prefers-reduced-motion`.

## Dependency and Tooling Plan

### Tailwind CSS

Tailwind is allowed, but it must be staged to avoid breaking the existing workspace CSS.

Planned changes:

- Add development dependencies:
  - `tailwindcss`
  - `postcss`
  - `autoprefixer`
- Add:
  - `tailwind.config.ts`
  - `postcss.config.js`
- Configure Tailwind content paths:
  - `./index.html`
  - `./src/**/*.{ts,tsx}`
- Map existing CSS variables into Tailwind theme extensions:
  - `canvas`: `var(--canvas)`
  - `surface`: `var(--surface)`
  - `surface-subtle`: `var(--surface-subtle)`
  - `ink`: `var(--ink)`
  - `ink-secondary`: `var(--ink-secondary)`
  - `accent`: `var(--accent)`
  - `success`, `warning`, `danger`
  - existing radius, shadow, and spacing tokens where practical

Staging rule:

- Keep `src/styles.css` as the source of truth for global tokens and non-migrated workspace screens.
- Add Tailwind directives near the top of `src/styles.css` only after confirming they do not reorder or erase existing app styles in a way that regresses the dashboard.
- Do not purge or remove workspace classes in this phase.

### Framer Motion

Add `framer-motion` only if the accepted concept needs motion that CSS cannot handle cleanly.

Requirements:

- Use `useReducedMotion` or an equivalent reduced-motion guard.
- Provide non-animated readable states.
- Keep animations on transform and opacity where possible.
- Avoid motion that changes layout or causes cumulative layout shift.

### Utility Libraries

Add `clsx` and `tailwind-merge` only if Tailwind class composition becomes non-trivial. Do not add them preemptively if simple class strings are enough.

## Proposed Component Architecture

If extracting the landing page from `src/App.tsx`, use this structure:

- `src/features/landing/LandingPage.tsx`
  - Composition owner for the public landing route.
  - Receives `controller` and `onLaunch`.
- `src/features/landing/HeroSection.tsx`
  - Brand/value proposition, primary CTA, product visual entry.
- `src/features/landing/ProductGraphPreview.tsx`
  - Replacement or evolution of the current `ProductPreview`.
  - Uses real scenario/provider labels from the controller.
- `src/features/landing/WorkflowStages.tsx`
  - Pattern discovery, governed proposal, safe execution.
- `src/features/landing/ProofSection.tsx`
  - Demo-derived proof language and cautious impact framing.
- `src/features/landing/FinalCta.tsx`
  - Final launch action and optional GitHub link.
- `src/features/landing/landingContent.ts`
  - Static copy, stage definitions, and any non-secret public link constants.

Shared primitives should be added only if they remove real duplication:

- `src/components/shared/BrandLogo.tsx` already exists and should be reused.
- Add landing-only primitives before adding broad `src/components/ui/*` primitives.
- Do not refactor dashboard shared components unless required by the landing page and covered by tests.

## Implementation Tasks

### Task 1: Confirm Baseline and Concept

Owner: design/implementation worker.

- Run or inspect the existing app to understand the current landing route.
- Create or select the accepted Build Web Apps concept.
- Extract a design system from the accepted concept.
- Record:
  - approved section order
  - exact above-the-fold copy
  - CTA labels
  - color and typography choices
  - responsive behavior expectations
  - motion expectations

Acceptance criteria:

- Concept covers hero, workflow/proof body, final CTA, and mobile behavior.
- No unsupported product claims are introduced.
- Implementation inventory is detailed enough to code without improvising.

### Task 2: Add Tooling Safely

Owner: implementation worker.

- Add Tailwind/PostCSS configuration if Tailwind is approved for execution.
- Add Framer Motion only if needed by the accepted concept.
- Update `package.json` and `package-lock.json`.
- Confirm dependency additions are minimal and intentional.
- Verify `npm run typecheck` still starts from a clean TypeScript baseline.

Acceptance criteria:

- Existing scripts remain unchanged unless a new script is clearly necessary.
- Lockfile changes only reflect intentional dependency additions.
- Build tooling does not break current dashboard styles.

### Task 3: Extract Landing Components

Owner: implementation worker.

- Move landing-specific code out of `src/App.tsx` into `src/features/landing/*`.
- Keep `App` responsible for route gating and `AppShell` handoff.
- Preserve:
  - `/` landing render
  - `Launch` pushing `/dashboard`
  - `/dashboard` direct workspace render
  - `/#demo` normalization
- Keep props typed from `useWorkGraphDemoController`.

Acceptance criteria:

- `src/App.tsx` becomes composition/routing glue.
- Existing landing and routing tests still pass after extraction.
- No dashboard feature files are rewritten as part of this task.

### Task 4: Build the Landing Page

Owner: implementation worker.

- Implement the approved hero, product visual, workflow stages, proof section, and final CTA.
- Use real product copy and demo-derived labels.
- Keep interactive controls code-native.
- Use semantic landmarks and headings.
- Ensure CTA controls have accessible names.
- Reuse `BrandLogo`.
- Keep layout stable with explicit grid/flex constraints and predictable aspect ratios.

Acceptance criteria:

- The landing page is usable as the first screen, not a marketing placeholder.
- The product visual communicates Samruna's actual workflow.
- No text overlaps or clips at supported viewport widths.
- No inert controls are presented as interactive beyond the launch/GitHub actions.

### Task 5: Motion and Reduced Motion

Owner: implementation worker.

- Add reveal or micro-interaction motion only after layout is stable.
- Guard Framer Motion transitions with reduced-motion handling.
- Keep CSS fallback states readable.
- Avoid layout-affecting animation.

Acceptance criteria:

- `prefers-reduced-motion: reduce` disables or significantly shortens nonessential motion.
- Hover/tap states do not move text out of bounds.
- Motion does not cause layout shift in the first viewport.

### Task 6: Tests

Owner: test worker.

- Update `src/App.test.tsx` for any intentional copy or landmark changes.
- Preserve coverage for:
  - landing page renders first at `/`
  - brand mark is visible
  - primary Launch CTA exists
  - product preview or graph visual exists with an accessible label
  - workflow/proof sections exist
  - dashboard nav is absent before launch
  - launch opens `/dashboard`
  - browser back returns to landing
  - `/dashboard` direct open works
  - legacy `/#demo` route normalizes
- Add focused assertions for new accessible section labels or CTAs.

Acceptance criteria:

- Unit tests verify user-visible behavior rather than implementation-only classes.
- Existing dashboard workflow tests remain unchanged unless affected by intentional accessible-name changes.

### Task 7: Browser QA and Visual Fidelity

Owner: test worker using Build Web Apps verification.

- Start the app with the repo's dev or preview flow.
- Use the in-app Browser path first.
- If the in-app Browser cannot attach, continue in Chrome and record the Browser connection failure in the QA summary.
- Validate:
  - page identity
  - nonblank render
  - no framework overlay
  - console health
  - screenshot evidence
  - Launch interaction proof
- Viewports:
  - desktop, for example 1440 x 900
  - mobile, for example 390 x 844
  - narrow floor check at 320px width if practical
- Compare the rendered page against the accepted concept.
- Record a mismatch ledger with at least five comparison points:
  - copy
  - layout/section order
  - typography
  - palette
  - spacing/container model
  - product visual treatment
  - responsive behavior
  - motion and interaction states

Acceptance criteria:

- No material visual drift remains against the accepted concept.
- Launch flow is proven in the browser.
- Screenshots support the final QA summary.

## Accessibility Requirements

- Use a single visible `h1` for the page.
- Keep semantic `header`, `main`, `section`, and `footer` structure.
- Give product visuals meaningful labels when they communicate content.
- Keep decorative visuals `aria-hidden`.
- Preserve visible focus states for all interactive controls.
- Ensure keyboard users can tab to Launch and optional GitHub CTA.
- Avoid hover-only information.
- Maintain contrast for text, controls, focus rings, and disabled states.
- Respect reduced motion.

## Responsive Requirements

Minimum checks:

- 320px narrow mobile
- 390px mobile
- 640px small tablet boundary
- 980px existing layout boundary
- 1440px desktop

Expected behavior:

- No horizontal overflow.
- Hero copy wraps cleanly.
- CTA buttons remain tappable and readable.
- Product visual keeps a stable aspect ratio and does not crush text.
- Workflow stages stack cleanly on mobile.
- Final CTA does not occlude preceding content.
- The first viewport includes a hint of the next section on mobile and desktop.

## Performance Requirements

- Keep route startup lightweight.
- Avoid large generated assets unless the accepted concept requires them.
- Use optimized image formats and dimensions if raster assets are introduced.
- Avoid layout shifts from late-loading media by defining width, height, or aspect ratio.
- Keep animations to compositor-friendly properties where possible.
- Confirm no relevant console warnings or errors during browser QA.

## Security and Privacy Guardrails

- Do not add analytics, trackers, external scripts, or credentialed integrations.
- Do not expose environment variables or secrets in frontend code.
- If a GitHub link is added, use a public repository URL constant and test it as a normal link.
- Keep demo data synthetic and consistent with existing fixtures.

## Rollback and Risk Plan

Primary risks:

- Tailwind directives affect existing global CSS order.
- Broad CSS cleanup accidentally breaks dashboard screens.
- Framer Motion adds unguarded motion or hydration layout shifts.
- New copy introduces unsupported claims.
- Visual implementation drifts from the accepted concept.

Mitigations:

- Keep workspace styles in `src/styles.css` until landing parity is verified.
- Touch only landing components and landing-specific styles unless a shared token change is necessary.
- Run unit tests before and after extraction.
- Use browser screenshots before declaring visual completion.
- Keep dependency additions minimal and reversible.

Rollback path:

- Revert landing component extraction and landing-specific style changes as one scoped change set if the route regresses.
- Keep dashboard styles untouched so workspace rollback is not entangled with the landing redesign.

## Verification Commands

Run these before final handoff:

```bash
npm run typecheck
npm test
npm run build
```

Run e2e checks when browser dependencies are available:

```bash
npm run test:e2e:preview
```

Run this when validating the full local stack is required:

```bash
npm run test:e2e
```

If a command cannot run, record the exact blocker and what was verified instead.

## Final Done Criteria

- The public landing page matches the accepted Build Web Apps concept with no material visual drift.
- `/`, `/dashboard`, and `/#demo` route behavior still works.
- Launch CTA opens the dashboard.
- Existing dashboard workflows remain intact.
- Typecheck, unit tests, and build pass.
- Browser QA verifies desktop and mobile rendering with screenshot evidence.
- Reduced-motion behavior is covered.
- No unsupported claims, placeholder visuals, console errors, or obvious responsive defects remain.
