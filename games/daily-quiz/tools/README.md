# Daily Quiz text image generators

Generate text-only images for `IMAGE_TEXT` quizzes.

Use PNG when the copied/share image must keep the exact font appearance. Use SVG when you want a small editable vector asset.

## Generate PNG

```bash
swift games/daily-quiz/tools/generate-text-png.swift \
  --text "Nhật Bản" \
  --font-family Inter \
  --google-css "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,600&display=swap" \
  --font-size 72 \
  --width 300 \
  --height 120 \
  --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.png
```

The PNG generator uses macOS CoreText. It supports installed fonts via `--font-family`, local font files via `--font-file`, or Google Fonts via `--google-css`.

Always quote Google Fonts URLs in zsh, because `?` and `&` have special meanings:

```bash
--google-css "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,600&display=swap"
```

If Swift tries to write module cache outside the repo in a sandboxed shell, run:

```bash
mkdir -p .tmp/swift-cache
CLANG_MODULE_CACHE_PATH="$PWD/.tmp/swift-cache" swift games/daily-quiz/tools/generate-text-png.swift --help
```

## Generate SVG

```bash
node games/daily-quiz/tools/generate-text-svg.mjs \
  --text 星河 \
  --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.svg
```

## SVG with a local font file

This embeds the font as a base64 `@font-face`, which is the most reliable option for SVGs loaded as images.

```bash
node games/daily-quiz/tools/generate-text-svg.mjs \
  --text 星河 \
  --font-file ./fonts/MyFont.ttf \
  --font-family MyFont \
  --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.svg
```

Supported font files: `.ttf`, `.otf`, `.woff`, `.woff2`.

## SVG with Google Fonts

```bash
node games/daily-quiz/tools/generate-text-svg.mjs \
  --text 星河 \
  --font-family "Noto Sans SC" \
  --google-css "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@800&display=swap" \
  --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.svg
```

Note: local font embedding is more reliable than Google Fonts for SVGs used in `<img>`.
