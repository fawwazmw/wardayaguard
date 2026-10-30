# Wardaya Store design direction

The storefront is a **test fixture**, not the portfolio deliverable. The brief is
deliberately narrow: credible enough for screenshots, boring enough to be
reliable in CI, and correct for everyone who has to use it.

Reading this as: e-commerce storefront for a QA portfolio demo, utilitarian
catalogue language, dial **ENERGY 1 / RHYTHM 1 / MOTION 1**.

## Identity

- Name: Wardaya Store. The harness is WardayaGuard.
- Personality: plain retail counter. No marketing voice, no urgency tactics,
  no fake scarcity.
- Every screen states what it is and what the next action is.

## Palette

| Token          | Value     | Use                            |
| -------------- | --------- | ------------------------------ |
| paper          | `#F7F6F3` | Page background                |
| surface        | `#FFFFFF` | Cards, inputs                  |
| ink            | `#17181A` | Body text                      |
| muted          | `#5A5D5A` | Secondary text, 6.4:1 on paper |
| line           | `#D9D6CE` | Borders and rules              |
| accent         | `#1F5F4A` | Primary actions, focus ring    |
| accent dark    | `#174937` | Hover                          |
| danger         | `#9B3B2C` | Errors, 6.2:1 on error surface |
| danger surface | `#FBEFEC` | Error banner background        |

One accent only. Neutral paper instead of pure white so the white cards read as
the content layer without shadows.

## Typography

System UI stack. Reason: the fixture must render identically in CI with no
network font request, and a portfolio test project should not depend on a CDN to
take a screenshot.

Sizes: 16px base, 14px secondary, 20px section, 30 to 34px page title. Weight
600 for actions and labels, 700 for the brand. Tabular numerals for money.

## Layout

- Single 1080px shell, centered, 24px gutters, 16px on phones.
- Header: brand, plain nav, cart count, account. One border, no shadow, not sticky.
- Catalogue: `auto-fill` grid at 240px minimum. Everything else is a single
  column capped at 640px.
- Uniform rhythm is intentional at RHYTHM 1. No bento, no alternating bands.

## Motion

Hover and focus only, 120ms colour transitions. No entrance animation, no
parallax, no skeleton shimmer.

## States

Every data view ships loading, empty and error states. Empty and error copy
names the cause and offers one action.

## Accessibility

- Contrast: all text meets WCAG AA, checked on the real surfaces.
- Focus: 2px accent outline with 2px offset. Never removed.
- Targets: 44px minimum height on buttons, inputs and selects.
- Forms: every input has a visible label, errors are text, not colour alone.
- Keyboard: no custom widgets, so native tab order is the interaction model.
- Responsive: single column under 700px, no horizontal overflow.

## Deliberately excluded

No logo asset, no product photography, no testimonials, no statistics, no FAQ,
no chat widget, no newsletter. There is no content for them, and a fixture that
pretends to have customers would be dishonest.
