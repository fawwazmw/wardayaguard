# Wardaya Store design direction

Reading this as: small fashion catalogue for a QA portfolio fixture, editorial
print language, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

The storefront is the application under test. The design has to look credible in
screenshots, survive automated accessibility checks, and never compete with the
test suite for attention.

## Identity

A small clothing catalogue with the confidence of a print lookbook. No
photography, no logo, no seasonal campaign. The products are described in type,
separated by rules, and numbered like a catalogue index. The tone is quiet and
direct: what it is, how much it costs, whether it is in stock.

The footer states that this is a test fixture. Nothing pretends to be a real
retailer.

## Palette

| Token          | Value     | Use                                  |
| -------------- | --------- | ------------------------------------ |
| paper          | `#F3EFE6` | Page background                      |
| ink            | `#171512` | Text, primary buttons, strong rules  |
| muted          | `#5C574D` | Secondary text, 6.3:1 on paper       |
| line           | `#D5CDBF` | Row rules and field borders          |
| line strong    | `#B9B0A0` | Input borders, secondary buttons     |
| oxblood        | `#6A2230` | Accent: links, focus, hover, notices |
| oxblood dark   | `#511823` | Accent hover                         |
| danger         | `#8F2A1E` | Errors, 7:1 on the error surface     |
| danger surface | `#F7E9E5` | Error banner background              |

Two cores, paper and ink, plus one accent. Oxblood is chosen because it reads as
editorial fashion rather than a product dashboard, and it passes AA on paper
without tuning.

## Typography

- **Display and product names:** `"Iowan Old Style", "Palatino Linotype",
Palatino, "Book Antiqua", Georgia, serif`. A serif gives the catalogue a print
  voice, and the stack uses installed fonts so CI never fetches a webfont.
- **Interface and prices:** `"Helvetica Neue", Helvetica, Arial, sans-serif`.
  Neutral, legible at small sizes, and already present on every target machine.
- **One italic voice:** the catalogue lede and kickers use the serif in italic.
  It is the identity motif, used three or four times per visit, never on buttons.

Sizes: 16px base, 13px labels, 24 to 26px product names, 42 to 61px page titles.
Prices use tabular numerals so columns line up.

## Layout

- 1180px shell with 32px gutters, 20px on phones.
- A masthead per page: a serif italic kicker, a large title, a short lede.
- The catalogue is a **numbered list**, not a card grid: index, name and
  description, stock, price, action, separated by hairlines. That is the main
  structural difference from a generic shop template.
- The cart and order history use the same row rhythm, so the whole app reads as
  one catalogue.
- Checkout is two columns, form left and summary right, stacking under 900px.
- No shadows, no rounded cards, no background texture. Rules and whitespace do
  the work.

## Motion

Hover and focus colour changes only, 120ms. No entrance animation, no transforms,
no sticky flourishes beyond the checkout summary on desktop.

## One theme, on purpose

The app ships a single light theme. The paper and ink palette is the identity:
a dark catalogue would be a different brand, and a theme toggle would add a
second visual system for no user need in a test fixture. This is a documented
choice, not deferred work.

## States

Every data view has loading, empty and error states. Empty states are written as
catalogue notes, not illustrations, and always offer one action.

## Accessibility

- All text meets WCAG AA on the real surfaces. axe-core runs on seven page
  states on every browser.
- Focus is a 2px oxblood outline with a 3px offset, never removed.
- Buttons, inputs and select are at least 44px tall.
- Product rows are `article` elements with an `h2`; the index is decorative and
  hidden from assistive technology.
- No custom widgets, so native tab order is the interaction model.

## Deliberately excluded

No product photography, no logo asset, no testimonials, no statistics, no FAQ,
no newsletter, no countdown, no stock scarcity copy. There is no real content
for them, and inventing it would be the opposite of what this project is for.
