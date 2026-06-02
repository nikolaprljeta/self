# Move shapes to bottom of page on mobile

## Goal
On mobile (≤768px): shapes appear below the body section (at the bottom of the page).
On desktop (≥769px): shapes sit in the right column alongside hero + body (same as current visual).

## Changes

### 1. `index.html` — Move `.shapes` after `.body`
```html
<div class="hero">
  <div class="left">...</div>
</div>

<section class="body">
  <div class="body__shape"></div>
  <div class="body__content"></div>
</section>

<div class="shapes">...</div>   <!-- was inside .hero, now here -->
```

### 2. `style.css` — Container becomes grid on desktop

**Desktop (.container):**
```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px 64px;    /* row-gap column-gap */
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 48px;
}
.bar { grid-column: 1 / -1; }
.hero { grid-column: 1; }
.body { grid-column: 1; }
.shapes { grid-column: 2; grid-row: 2 / 4; }
.footer { grid-column: 1 / -1; }
```

**.hero simplified** — remove `grid-template-columns: 1fr 1fr` and `gap`, becomes a block:
```css
.hero {
  /* no grid — just a block wrapper */
}
```

**Mobile (≤768px):**
```css
.container {
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  gap: 0;
}
.hero, .body, .shapes, .footer {
  /* natural DOM order: hero → body → shapes → footer */
}
```

### 3. `style.css` — Bump mobile shape sizes to balance body triangle

Current → new:
| Shape | ≤768 current | ≤768 new | ≤400 current | ≤400 new |
|-------|-------------|---------|-------------|---------|
| Circle | 80×80 | 80×80 | 60×60 | 70×70 |
| Square | 50×50 | 50×50 | 36×36 | 42×42 |
| Line-h | 100×6 | 120×6 | 70×6 | 90×6 |
| Line-v | 6×80 | 6×90 | 6×60 | 6×70 |
| Dot | 18×18 | 18×18 | 14×14 | 16×16 |

Adjust mobile shape positions slightly if needed after size bump.

## Files affected
- `index.html` — one structural move
- `style.css` — container grid, hero block, mobile breakpoints, shape sizes
- `data.json` — no change (no content change)
- `script.js` — no change (layout system reads positions relative to `.shapes`, works regardless of DOM position)

## Verification
- `node local/test.mjs` — all 21 tests should pass
- Visual check: shapes at bottom on mobile, right column on desktop
