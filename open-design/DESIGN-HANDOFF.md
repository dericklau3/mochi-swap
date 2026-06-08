# 0fa2a888-0107-4c26-9fb0-94c4068e678b implementation handoff

This archive is the source of truth for turning the design into production code. Start from `index.html`, then preserve the visual system, responsive behavior, and interactions found in the exported files.

## Implementation target
- Build production UI from the exported design, not a loose reinterpretation.
- Preserve typography scale, spacing rhythm, color tokens, border radii, shadows, motion timing, and component states.
- Replace static placeholders only when the target app has real data or functional equivalents.
- Keep generated product UI free of Open Design chrome, preview labels, or design-process annotations.
- Treat this handoff as a visual contract: if implementation choices conflict, match the exported pixels and behavior first, then refactor internals.

## Source map
- Primary entry: `index.html`
- HTML screens detected: 2
- Stylesheets detected: 0
- Script/component files detected: 0
- Supporting assets detected: 54

## Responsive contract
Validate the implementation across this 2025–2026 viewport matrix:
- Mobile compact: 360×800
- Mobile standard: 390×844
- Mobile large: 430×932
- Foldable / small tablet: 600×960
- Tablet portrait: 820×1180
- Tablet landscape: 1024×768
- Laptop: 1366×768
- Desktop: 1440×900
- Wide desktop: 1920×1080

For responsive web exports, treat these as a modern breakpoint system for one adaptive web experience, not three fixed screenshots. Do not split responsive web into unrelated native app screens unless the project explicitly includes native targets. Use semantic layout thresholds, fluid `clamp()` type/spacing, and container queries where component width matters more than viewport width. Preserve any CSS media queries, container queries, fluid `clamp()` scales, and layout changes already present in the exported files.

## Design fidelity contract
- Extract reusable tokens before writing components: background, surface, foreground, muted text, border, accent, radius, shadow, spacing, type scale, and motion duration/easing.
- Map product screens, in-app modules/components, optional landing page, and optional OS widget surfaces before coding. Keep these surfaces separate in the target architecture.
- Match layout geometry: max-widths, gutters, grid columns, card proportions, sticky/fixed elements, and viewport-specific navigation.
- Preserve real copy, labels, and data shown in the export. Do not replace specific text with generic marketing filler.
- Preserve interactive affordances: hover, focus, pressed, disabled, loading, validation, copy/share, tab/accordion, modal/sheet, and keyboard states where present.
- Preserve accessibility semantics when converting: headings stay hierarchical, controls remain buttons/links/inputs, focus states stay visible.
- Do not keep prototype-only annotations, frame labels, or Open Design chrome in the production UI.

## CJX-ready UX contract
- Use `DESIGN-MANIFEST.json` as the machine-readable map for screens, app modules, OS widgets, landing pages, tokens, interactions, and viewport checks.
- Screen-file-first: when multiple user-facing surfaces exist, implement each HTML screen as its own route/file. Treat `index.html` as a launcher/overview when the manifest marks it that way, not as a combined final UI.
- If `landing.html`, app screens, platform screens, or OS widget files exist, preserve those boundaries in the target app instead of merging them into one page.
- A single self-contained `index.html` is acceptable only when the export truly contains one user-facing screen and its CSS/JS are structured enough to extract tokens, components, states, and behavior.
- If separate `css/` or `js/` files exist, treat them as source of truth for token/component/interactions before porting to React, Vue, SwiftUI, Compose, or another target stack.
- In-app modules/components are product UI blocks inside the app. OS widgets are home-screen/lock-screen/quick-access surfaces outside the app. Do not merge those concepts.

## Color and brand contract
- Use the exported design tokens and product/domain context as the color source of truth.
- Do not introduce warm beige / cream / peach / pink / orange-brown background washes unless they are already explicit brand/reference colors in the export.
- No obvious token stylesheet was detected; sample colors from the entry file and convert them into named tokens before coding.

## Implementation sequence for AI coding tools
1. Open `index.html` and `DESIGN-MANIFEST.json`; identify every screen file, launcher/overview file, app module, and interaction before coding.
2. If multiple HTML screens exist, map them to separate routes/surfaces first; do not merge `landing.html`, product app screens, platform screens, or OS widgets into one route.
3. Extract a token table from CSS/root styles and inline styles before building framework components.
4. Build product screens and domain-specific in-app modules from largest layout regions down to controls; avoid starting with isolated atoms that lose spatial intent.
5. Port responsive behavior across the modern viewport matrix and test each semantic breakpoint before cleanup.
6. Port interactions and states, then replace static placeholders only with real app data or functional equivalents.
7. Keep optional landing page and OS widget surfaces as separate surfaces if present.
8. Compare final screenshots against the export at 360×800, 390×844, 430×932, 820×1180, 1024×768, 1366×768, 1440×900, and 1920×1080 before declaring done.

## Entry points
- `dswap-dex-prototype.html`
- `index.html`

## Styles
- None detected

## Scripts/components
- None detected

## Assets and supporting files
- `mpl0qyx8-drawing-2026-05-25T09-43-36-509Z.png`
- `mpl0xqof-drawing-2026-05-25T09-48-52-426Z.png`
- `mpl0znpf-drawing-2026-05-25T09-50-21-885Z.png`
- `mpl10dpr-drawing-2026-05-25T09-50-55-596Z.png`
- `mpl18v2i-drawing-2026-05-25T09-57-31-315Z.png`
- `mpl1bfsw-drawing-2026-05-25T09-59-31-515Z.png`
- `mpl1cx6e-drawing-2026-05-25T10-00-40-691Z.png`
- `mpl1njzt-drawing-2026-05-25T10-08-56-814Z.png`
- `mpl1owdl-drawing-2026-05-25T10-09-59-526Z.png`
- `mpl1q93o-drawing-2026-05-25T10-11-02-672Z.png`
- `mpl1w71z-drawing-2026-05-25T10-15-39-955Z.png`
- `mpl1y1ys-drawing-2026-05-25T10-17-06-673Z.png`
- `mpl24bef-drawing-2026-05-25T10-21-58-830Z.png`
- `mpl2fy7a-image.png`
- `mpl2g3lo-image.png`
- `mpo40vax-drawing-2026-05-27T13-38-35-748Z.png`
- `mpo44y9y-drawing-2026-05-27T13-41-46-242Z.png`
- `mpo46ji3-drawing-2026-05-27T13-43-00-406Z.png`
- `mpo4bnnu-drawing-2026-05-27T13-46-59-078Z.png`
- `mpo4gm3b-drawing-2026-05-27T13-50-50-319Z.png`
- `mpo4hubd-drawing-2026-05-27T13-51-47-634Z.png`
- `mpo4kh0m-drawing-2026-05-27T13-53-50-369Z.png`
- `mpo4lwkc-drawing-2026-05-27T13-54-57-177Z.png`
- `mpo4tgvy-drawing-2026-05-27T14-00-50-094Z.png`
- `mpo4zlic-drawing-2026-05-27T14-05-36-030Z.png`
- `mpo55gs4-drawing-2026-05-27T14-10-09-837Z.png`
- `mpp9ee9o-image.png`
- `mpp9uir2-image.png`
- `mppbdyjx-drawing-2026-05-28T09-52-29-958Z.png`
- `mppbqa4c-drawing-2026-05-28T10-02-04-849Z.png`
- `mppbuxs2-drawing-2026-05-28T10-05-42-136Z.png`
- `mppdfa77-drawing-2026-05-28T10-49-30-945Z.png`
- `mppdiq6k-drawing-2026-05-28T10-52-11-653Z.png`
- `mpqa87z5-drawing-2026-05-29T02-07-48-797Z.png`
- `mpqf4nqa-drawing-2026-05-29T04-25-00-676Z.png`
- `mpqfcvpi-drawing-2026-05-29T04-31-24-286Z.png`
- `mpqfjyrb-drawing-2026-05-29T04-36-54-822Z.png`
- `mpqfoegt-drawing-2026-05-29T04-40-21-814Z.png`
- `mpqfpg30-drawing-2026-05-29T04-41-10-562Z.png`
- `mpqfyo9p-drawing-2026-05-29T04-48-21-044Z.png`
- `mpqg4iah-image.png`
- `mpqg4xca-drawing-2026-05-29T04-53-12-776Z.png`
- `mpqg9ogg-drawing-2026-05-29T04-56-54-487Z.png`
- `mpqjuuii-drawing-2026-05-29T06-37-20-931Z.png`
- `mpqjytmn-drawing-2026-05-29T06-40-26-485Z.png`
- `mpqlhp2n-image.png`
- `mpqlig61-drawing-2026-05-29T07-23-41-723Z.png`
- `mpqlmrna-drawing-2026-05-29T07-27-03-279Z.png`
- `mpqlsrmt-drawing-2026-05-29T07-31-43-106Z.png`
- `mpqlwzxa-drawing-2026-05-29T07-35-00-566Z.png`
- `mpqlyyz9-drawing-2026-05-29T07-36-32-644Z.png`
- `mpqm5m4z-drawing-2026-05-29T07-41-42-602Z.png`
- `mpqmgc8h-drawing-2026-05-29T07-50-02-981Z.png`
- `mpqmgrq4-drawing-2026-05-29T07-50-23-059Z.png`

## Coding checklist for AI tools
1. Inspect `index.html` and `DESIGN-MANIFEST.json` first and identify reusable components before coding.
2. Implement each user-facing screen file as its own route/surface; keep launcher, landing, app, platform, and OS widget files separate.
3. Extract design tokens into the target stack: colors, type scale, spacing, radius, shadows, and motion.
4. Implement layout with real 2025–2026 responsive breakpoints, fluid type/spacing, and container-query-aware component behavior; test with no horizontal overflow.
5. Preserve interactive controls, hover/focus/pressed states, form behavior, validation, and copy actions where present.
6. Implement domain-specific in-app modules with real states; do not flatten them into generic cards.
7. Keep landing page, product screens, and OS widget/quick-access surfaces separate when present.
8. Confirm the production result visually matches the exported design before refactoring internals.
9. Reject implementation shortcuts that flatten the design into generic cards, generic gradients, placeholder stats, or framework-default typography.
10. If a detail is ambiguous, keep the exported HTML/CSS/JS behavior rather than inventing a new pattern.
