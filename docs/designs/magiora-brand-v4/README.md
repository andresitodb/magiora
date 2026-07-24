# Magiora symbol — web SVG package

All files are exact derivatives of `../../master-symbol.svg`. Do not edit their geometry independently.

## Flexible asset

- `magiora-symbol.svg`: recommended default; inherits CSS `color` through `currentColor`.

## Fixed approved colors

- `magiora-symbol-gold.svg`: Gold `#DAAF37`.
- `magiora-symbol-charcoal.svg`: Charcoal `#0D0D0D`.
- `magiora-symbol-white.svg`: White `#FFFFFF`, for dark backgrounds.

## Fixed-size convenience assets

The files in `sizes/` use `currentColor` and declare square intrinsic dimensions at 16, 24, 32, and 64 pixels. Their shared `viewBox` preserves the original proportions.

Prefer the flexible asset for responsive layouts. Use fixed-size files only where an intrinsic icon size is useful. Never stretch, rotate, add effects, or alter the paths.
