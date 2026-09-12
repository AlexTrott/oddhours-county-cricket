# OddHours DS gaps

Vendored `src/vendor/oddhours/oddhours.css` (imports `tokens.css`). Default house theme: **`theme-petrol`** on `<html>`. County colours are a **CSS variable overlay** (`data-county`, `--oh-band` / `--oh-accent`), not a ninth `theme-*` class. Dark is `data-scheme="dark"` on petrol-derived surfaces — **not** `theme-night` (studio magenta).

## Recipes used

`oh-btn` (+ `--primary`, `--secondary`, `--closed`, `--sold-out`), `oh-chip` / `oh-chips`, `oh-seg` / `oh-seg__opt`, `oh-card`, `oh-eyebrow`, `oh-badge`, `oh-tile`, `oh-footer`, `oh-nav__mark`, `oh-nav__logo`, `oh-text-link`, `oh-display`, `oh-lede`, `oh-muted`, `oh-mono`, `oh-row`, `oh-stack`.

## Not invented as global `oh-*`

These are **app-local** (`ccl-*`) because the house file has no recipe:

| Need                     | Local name                          | Why                                                                       |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| iOS tab bar              | `.ccl-tabbar`                       | House nav is a floating marketing pill, not a five-tab sports shell       |
| Sticky app masthead      | `.ccl-masthead`                     | `oh-nav-wrap` is `position: fixed` and fights bottom tabs + score content |
| Score / standings tables | `.ccl-table`                        | No `oh-table`                                                             |
| Live score type          | `.ccl-score`                        | Display font + tabular nums                                               |
| County picker swatch     | `.ccl-swatch`                       | Colour chip, not a crest                                                  |
| Seed / freshness banner  | `.ccl-banner` / `.ccl-freshness--*` | Product copy, not a shop pack card                                        |
| Knockout round list      | `.ccl-knockout-list`                | House has no bracket / fixture-round recipe                               |
| Seg label wrap on phone  | `.ccl-main .oh-seg__opt`             | House `.oh-seg` clips with `overflow: hidden`; do not invent a new `oh-seg` |

`oh-pack`, `oh-watermark`, `oh-hero-band`, and `oh-marquee` are shop / generator recipes. They do not fit a live scorecard. Not reused.

## Safe areas

`viewport-fit=cover` plus `env(safe-area-inset-*)` on the masthead, body, and tab bar. Not a house token.
