# LP の動画（Remotion）

LP の動画の枠に置く2本（`Hero`・`OshiColor`。どちらも 1080×1080・30fps・8秒で繰り返す。文字は入れない）。
中身は設計書 `_docs/superpowers/specs/2026-10-26-landing-page-design.md` の 9 節と付録 A。

Claude Motion は Max プランでは使えないため、Remotion で作る（2026-10-26 ユーザーの決定）。
Remotion は個人と従業員3人以下の団体なら無料で使える。

```bash
npm install
# Remotion が取ってくる描画用のブラウザがこの Mac では起動を待ったまま止まるので、Playwright のものを使う
export REMOTION_BROWSER_EXECUTABLE=~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell
npm run dev                                                   # Remotion Studio で見る
npx remotion render Hero out/hero.mp4 --codec=h264 --crf=12   # 書き出す（out/ はコミットしない）
npx remotion render OshiColor out/oshi-color.mp4 --codec=h264 --crf=12
npm run lint                                                  # eslint と tsc

# LP に差し込む（リポジトリの直下で）
node _src/assets/encode-video.mjs hero _motion/out/hero.mp4
node _src/assets/encode-video.mjs color _motion/out/oshi-color.mp4
npm run build
```
