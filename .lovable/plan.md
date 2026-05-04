## Root cause

The preview shows "Page not found" because the Vite CSS pipeline is failing, so no JS/CSS bundle is served and every route falls through. Dev-server log:

```text
[vite:css][postcss] @import must precede all other statements
src/styles.css:3
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif...')
```

In `src/styles.css` the order is:

```css
@import "tailwindcss" source(none);
@source "../src";
@import url('https://fonts.googleapis.com/...');
```

Tailwind v4 inlines its `@import` and `@source` is a Tailwind directive, so the Google Fonts `@import` is no longer the first statement — PostCSS rejects it and the CSS module fails to build.

## Fix

1. In `src/styles.css`, move the Google Fonts `@import url(...)` to **line 1**, before `@import "tailwindcss"` and `@source`. This satisfies the "imports must come first" rule.

   Resulting top of file:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
   @import "tailwindcss" source(none);
   @source "../src";

   :root { ... }
   ```

2. No other code changes needed — once CSS compiles, the existing `/` route renders the Import → Config → Dashboard flow normally.

## Verification

After the edit, the dev server should rebuild cleanly (no `[vite:css][postcss]` error in `/tmp/dev-server-logs/dev-server.log`), and visiting `/` should show the Import screen instead of the 404.
