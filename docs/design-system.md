# CakeFlow design system

CakeFlow uses strict editorial minimalism: a calm technical-spec / recipe-sheet
aesthetic rather than a generic SaaS dashboard. Structure, typography and
spacing create hierarchy — never color, elevation or decoration.

`src/app/globals.css` is the implementation of this document and the single
source of truth for values. Feature components consume tokens and role
utilities; they never declare palette values or font families.

## Rules

- Monochrome only. No accent or brand colors.
- No gradients, no shadows, no elevation.
- No rounded corners and no boxed dashboard cards.
- Hairline separators instead of decorative containers.
- Square controls.
- Status is communicated through text and weight, not hue.

## Colors

| Token            | Value     | Role                                     |
| ---------------- | --------- | ---------------------------------------- |
| `page`           | `#EDECE7` | Application background                   |
| `paper`          | `#F7F6F2` | Raised sheet: forms, menus, inset panels |
| `ink`            | `#161616` | Text, rules, primary button fill         |
| `muted`          | `#9A9A97` | Secondary text and functional labels     |
| `hairline`       | `#E2E1DC` | 1px separators and input underlines      |
| `tile`           | `#EEEDE8` | Hover and selected surfaces              |

These six hex values appear exactly once in the codebase, in the `@theme`
block of `globals.css`. Use the Tailwind utilities they generate — `bg-page`,
`text-ink`, `border-hairline`, `bg-tile` and so on.

`muted` is a text color in CakeFlow, unlike the shadcn convention where
`muted` is a surface. Do not use `bg-muted`.

## Typography

Three families, with fixed semantic roles that never change by viewport:

| Family              | Role                                                    |
| ------------------- | ------------------------------------------------------- |
| Archivo             | UI text, prose, values, buttons                         |
| Archivo Expanded    | Display and order numbers only                          |
| JetBrains Mono      | Labels, dates, dimensions, prices, IDs, structured data |

Archivo Expanded is not a separate font: it is the `wdth` 125% axis of the
variable Archivo family, loaded in `src/app/[locale]/layout.tsx` and applied by
the `type-display` utility.

### Role utilities

Use these instead of composing font size, family and color by hand:

| Utility         | Family           | Baseline size | Notes                                |
| --------------- | ---------------- | ------------- | ------------------------------------ |
| `type-label`    | JetBrains Mono   | 11 → 12px     | Uppercase, wide tracking, muted      |
| `type-body`     | Archivo          | 14 → 15px     | Prose and UI text, line-height 1.65  |
| `type-value`    | Archivo          | 14 → 15px     | A value opposite a label, medium     |
| `type-data`     | JetBrains Mono   | 13 → 14px     | Tabular numerals for structured data |
| `type-heading`  | Archivo          | 18 → 24px     | Section and page titles              |
| `type-display`  | Archivo Expanded | 28 → 48px     | Display and order numbers            |

`measure` caps wrapped prose at 38ch, inside the 36–40ch editorial measure.

### Responsive typography

Every size is a single `clamp()` in the `--text-*` theme tokens, so type scales
continuously with the viewport instead of stepping at breakpoints. Font-family
roles are viewport-independent.

Body text bottoms out at 14px and is never shrunk to fit more content. Labels
bottom out at 11px. The display role has the widest range because an order
number should dominate a desktop sheet without overflowing a 380px phone.

Do not add one-off responsive font sizes in feature components. If a new size
is needed, add a `--text-*` token and a role utility here.

## Structure

| Token                     | Value | Role                                  |
| ------------------------- | ----- | ------------------------------------- |
| `--hairline-width`        | 1px   | Standard separator                    |
| `--divider-width`         | 1.5px | Strong section divider, drawn in ink  |
| `--spacing-row-y`         | 16px  | Standard row vertical breathing room  |
| `--spacing-spec-label`    | 78px  | Spec label column width               |
| `--spacing-spec-gap`      | 20px  | Spec column gap                       |
| `--spacing-control`       | 44px  | Touch-friendly control height         |
| `--spacing-control-sm`    | 36px  | Compact control height                |
| radius                    | 0     | Every radius token is zero            |

Separator utilities: `hairline-t`, `hairline-b`, `hairline-y`, `divider-t`,
`divider-b`.

## Primitives

`src/components/ui/` holds the shared primitives. Radix structure from shadcn is
reused, but the default styling is replaced — no radius, shadow, ring color or
animated zoom survives.

- `Button` — square. `default` is ink on paper; `outline` is a hairline box;
  `ghost` and `link` are unfilled. Sizes map to the control height tokens.
- `Input`, `Textarea`, `SelectTrigger` — underlined, not boxed: a hairline that
  becomes ink on focus and a 1.5px ink rule when `aria-invalid`.
- `Checkbox` — square, ink fill with a paper check, widened touch target.
- `Select` — the menu is a squared paper sheet with a hairline edge; the
  selected and hovered rows use `tile`.
- `SpecRow` / `SpecList` — the recipe-sheet row: 78px label column, flexible
  value column, 20px gap, hairline underneath. Stacks below 400px.
- `SectionDivider` — a hairline or strong rule, optionally labelled.
- `StatusText` — status through weight and case; no pills, no status colors.

Shared primitives never contain user-facing copy. Labels are passed in already
translated, so everything stays compatible with next-intl (`uk` and `en`).

## Accessibility

- Keyboard focus is a 2px ink outline with a 2px offset, applied globally to
  `:focus-visible`. It is monochrome, so it introduces no accent color.
- Interactive controls are 44px tall by default.
- `prefers-reduced-motion: reduce` collapses animation and transition
  durations globally.
- The system is designed to work down to a 380px viewport: the spec row stacks,
  primary buttons go full width, and page padding drops to 20px.

## Known limitation

Archivo has no Cyrillic subset on Google Fonts, so Ukrainian UI text renders in
the fallback stack (Helvetica Neue / Helvetica / Arial) rather than Archivo.
JetBrains Mono does include Cyrillic, so labels and data render in the intended
face in both locales. Replacing Archivo with a Cyrillic-capable face is a
design decision and is deliberately not taken here.
