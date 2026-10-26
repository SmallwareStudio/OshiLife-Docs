# Oshi Life の LP（2.0）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 実装はメインの Opus のセッションが直接行う（ユーザーの決まり「実装は委譲しない」）。サブエージェントを使うのは、訳の点検（Task 10 Step 5）のような読むだけの作業に限る。

**Goal:** OshiLife-Docs の GitHub Pages に、5言語の新しい LP（アプリ 2.0 の内容）を、ひな形と言語ごとの文から生成して置く。

**Architecture:** `_src/` の純粋な描画関数（Node・依存なし）が、言語ごとの文（JSON）と1か所の数値（`facts.mjs`）から5つの `index.html` を生成し、生成物もコミットする（Pages はそのまま配信する）。見た目は共通の `assets/site.css`、動きは `assets/site.js`（動画の一時停止と画面に入ったときの再生だけ）。検証は `Scripts/verify.sh`（生成の一致・`node --test` の静的検査・Playwright の描画検査・外部リンク）。

**Tech Stack:** HTML / CSS、Node 24（ESM・`node:test`）、Playwright 1.64.1（devDependency。検査と OG 画像の描画だけ）、cwebp・ffmpeg・sips（素材の変換。Homebrew と macOS）。

## Global Constraints

- 作業する場所: `/Users/s/Documents/GitHub/OshiLife-Docs`、ブランチ `lp-v2`。**push しない**（main に入った時点で公開される。2.0 の配信後、ユーザーの指示で行う）。
- 正本は設計書 `_docs/superpowers/specs/2026-10-26-landing-page-design.md`。食い違ったら設計書に従い、計画を直す。
- コミットは日本語の Conventional Commits。本文の最後に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- **参照しないもの**（ユーザーの指示）: 旧 LP（`OshiLife-Docs/index.html` の旧版・`OshiLife/docs/index.html`）、App Store の宣伝文と合成画像（`OshiLife/docs/appstore-metadata*`・`OshiLife/docs/superpowers/release/`・`~/Desktop/OshiLife-2.0.0-scan-assets/product-page/02-scan-*`）、`~/Documents/ClaudeWorkspace` のほかのプロジェクト。
- 使ってよい外の材料: OshiLife のコード（事実の確認）、`OshiLife/OshiLife/Localizable.xcstrings` と `OshiLife/widget/Localizable.xcstrings`（訳語）、素の画面の画像（`~/Desktop/OshiLife-2.0.0-scan-assets/product-page/asc-backup-2026-10-25/<言語>/01〜07` と `product-page/08-record-<言語>.png`）、`OshiLife/OshiLife/Assets.xcassets/AppIcon.appiconset/Icon-1024.png`、Apple の App Store バッジ（App Store Marketing Tools）。
- **変えないもの**: 直下の `privacy.html`・`terms.html`、`ja/` `en/` `ko/` `zh-Hans/` `zh-Hant/` の `privacy.html`・`terms.html`、`legal.css`、`.DS_Store`。
- 依存は devDependency の `playwright@1.64.1` だけ。ページは外から何も読み込まない（Web フォント・CDN なし）。JavaScript は `assets/site.js` の動画の制御だけ。
- 数値は `_src/lib/facts.mjs` だけに置き、文からは `{free.oshi}` のように参照する。文に 2〜9 の数字や2桁以上の数を直接書かない（0 と 1 は可）。
- 色はアプリの値（設計書 8 節）。ブランド色 `#E86B8F` の上に白い文字を載せない。グラデーションの上の白い文字は 24px 以上。フォーカスの輪郭は文字色。
- App Store のバッジは1ページに1つ（ヒーロー）。高さ 40px 以上、余白は高さの 1/4。ヘッダーと最後の CTA は文字のボタン。
- 持ち込まない言い回しと書かないこと（設計書 5 節・6 節「書かないこと」）。自分の記録は「思い出」と呼ぶ（「レポート」は「みんなのレポート」だけ）。
- 定数と命名は `~/.claude/CLAUDE.md` に従う（ロジックに生のリテラルを置かない・省略しない・boolean は述語形・関数は動詞で始める）。
- Node は nvm の v24（`source ~/.nvm/nvm.sh` 済みのシェルで `node --version` が v24 であること）。

---

## ファイルの地図

| ファイル | 役割 | 作る Task |
|---|---|---|
| `package.json` / `package-lock.json` | devDependency（playwright）と npm のスクリプト | 1 |
| `.gitignore` | `node_modules/`・`_tmp/` | 1 |
| `_config.yml` | Jekyll で公開しないもの | 1 |
| `CLAUDE.md` | このリポジトリの決まり | 1 |
| `Scripts/verify.sh` | 検証（フェーズ1〜4） | 1（以後 6・7・11 で足す） |
| `tests/helpers/repository.mjs` | リポジトリの直下のパス | 1 |
| `tests/site/config.test.mjs` | 公開の範囲の検査 | 1 |
| `_src/lib/facts.mjs` | 数値と、文の中の参照を埋める関数 | 2 |
| `_src/lib/escape.mjs` | HTML のエスケープ | 2 |
| `_src/lib/locales.mjs` | 5言語の設定と、ページどうしのリンク | 2 |
| `_src/lib/content.mjs` | 言語ごとの文の形（キーと配列の長さ）の比較 | 2 |
| `_src/lib/text.mjs` | 文を引く関数（数値を埋めてエスケープ）と見出しの折り返し | 2 |
| `_src/lib/image-size.mjs` | WebP・PNG・JPEG・SVG の寸法を読む | 2 |
| `tests/unit/core.test.mjs` / `tests/unit/image-size.test.mjs` | 上の単体テスト | 2 |
| `_src/lib/assets.mjs` | 画像の場所・寸法・重さの上限 | 3 |
| `_src/assets/fetch-badges.mjs` | App Store バッジを取る | 3 |
| `_src/assets/prepare-screens.mjs` | 画面の画像を WebP にする | 3 |
| `_src/assets/prepare-icon.mjs` | アイコンを縮める | 3 |
| `assets/badges/*.svg`・`assets/img/<言語>/*.webp`・`assets/img/common/app-icon.png` | 素材 | 3 |
| `tests/site/assets.test.mjs` | 素材の検査 | 3 |
| `_src/content/ja.json` | 日本語の文 | 4 |
| `tests/unit/content.test.mjs` | 文の検査（参照・数字・言い回し） | 4 |
| `_src/lib/videos.json` | 差し込んだ動画の情報（最初は空） | 5 |
| `_src/lib/media.mjs` | 動画の枠に何を置くか | 5 |
| `_src/lib/context.mjs` | 1ページを描くための材料 | 5 |
| `_src/lib/components.mjs` | 部品（画面・動画の枠・バッジ・要点の一覧・節の見出し） | 5 |
| `_src/lib/sections.mjs` | 本文の10の節 | 5 |
| `_src/lib/layout.mjs` | ヘッダーとフッター | 5 |
| `_src/lib/head.mjs` | `<head>`（メタ情報・hreflang・OG） | 5 |
| `_src/lib/page.mjs` | 1ページ全体 | 5 |
| `tests/unit/render.test.mjs` | 描画の単体テスト | 5 |
| `_src/build.mjs` | 5ページの生成と、`--check` | 6 |
| `index.html`（と各言語の `index.html`） | 生成物 | 6（各言語は 10） |
| `tests/site/html-text.mjs` / `tests/site/pages.test.mjs` | 生成したページの静的検査 | 6 |
| `assets/site.css` | 見た目 | 7 |
| `tests/render/contrast.mjs` / `tests/render/pages.test.mjs` | 描画の検査（はみ出し・読み込み・コントラスト・撮影） | 7 |
| `assets/site.js` | 動画の一時停止と再生 | 8 |
| `tests/render/media.test.mjs` | 動画の枠の動きの検査 | 8 |
| `_src/og/render-og.mjs` / `assets/og/*.jpg` / `tests/site/og.test.mjs` | 共有用の画像 | 9 |
| `_src/i18n/extract-glossary.mjs` / `_src/i18n/glossary.json` | アプリの訳語表 | 10 |
| `_src/content/{en,ko,zh-Hans,zh-Hant}.json` | 4言語の文 | 10 |
| `tests/i18n/glossary.test.mjs` | 訳語の検査 | 10 |
| `tests/network/check-links.mjs` | 外部リンクの検査（フェーズ4） | 11 |
| `_src/assets/encode-video.mjs` / `assets/video/*` / `tests/site/video.test.mjs` | 動画の差し込み | 12 |

---

### Task 1: 足場（公開の範囲・検証の入口・決まり）

**Files:**
- Create: `package.json`、`.gitignore`、`_config.yml`、`CLAUDE.md`、`Scripts/verify.sh`、`tests/helpers/repository.mjs`、`tests/site/config.test.mjs`

**Interfaces:**
- Produces: `REPOSITORY_ROOT`（`tests/helpers/repository.mjs`。末尾に `/` が付いた絶対パス）。`./Scripts/verify.sh`（以後の Task がフェーズを足す）。

- [ ] **Step 1: package.json と .gitignore を作り、Playwright を入れる**

`package.json`:

```json
{
  "name": "oshilife-site",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "build": "node _src/build.mjs",
    "verify": "./Scripts/verify.sh"
  },
  "devDependencies": {
    "playwright": "1.64.1"
  }
}
```

`.gitignore`:

```
node_modules/
_tmp/
```

Run: `npm install && npx playwright install chromium`
Expected: `package-lock.json` ができ、Chromium は「already installed」か、ダウンロードが終わる。

- [ ] **Step 2: 公開の範囲のテストを書く**

`tests/helpers/repository.mjs`:

```js
import { fileURLToPath } from 'node:url';

/** リポジトリの直下の絶対パス（末尾に / が付く）。 */
export const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
```

`tests/site/config.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

/** GitHub Pages で公開する、直下の名前。ほかの名前は _config.yml の exclude に入っていなければならない。 */
const PUBLISHED_ENTRIES = new Set(['index.html', 'assets', 'ja', 'en', 'ko', 'zh-Hans', 'zh-Hant', 'legal.css', 'privacy.html', 'terms.html']);

/** _config.yml の exclude の一覧を読む（このリポジトリの設定ファイルの単純な形だけを読む）。 */
function readExcludedEntries(configText) {
  const lines = configText.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'exclude:');
  if (start === -1) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (!match) break;
    entries.push(match[1]);
  }
  return entries;
}

test('公開しないファイルは、すべて _config.yml の exclude に入っている', () => {
  const excluded = readExcludedEntries(readFileSync(path.join(REPOSITORY_ROOT, '_config.yml'), 'utf8'));
  // Jekyll は _ と . で始まる名前を初めから公開しない。
  const entries = readdirSync(REPOSITORY_ROOT).filter((name) => !name.startsWith('_') && !name.startsWith('.'));
  const leaked = entries.filter((name) => !PUBLISHED_ENTRIES.has(name) && !excluded.includes(name));
  assert.deepEqual(leaked, []);
});
```

- [ ] **Step 3: テストが落ちることを確かめる**

Run: `node --test tests/site/config.test.mjs`
Expected: FAIL（`ENOENT: no such file or directory, open '.../_config.yml'`）

- [ ] **Step 4: _config.yml を作る**

```yaml
# GitHub Pages（Jekyll）で公開しないもの。
# _ と . で始まる名前は Jekyll が初めから公開しないので、ここには書かない。
exclude:
  - CLAUDE.md
  - Scripts
  - tests
  - package.json
  - package-lock.json
  - node_modules
```

- [ ] **Step 5: テストが通ることを確かめる**

Run: `node --test tests/site/config.test.mjs`
Expected: PASS（1 test）

- [ ] **Step 6: verify.sh を作る（フェーズ2だけ）**

`Scripts/verify.sh`:

```bash
#!/usr/bin/env bash
# Oshi Life の LP の検証。終了コードが完了判定（必須のフェーズがすべて 0 なら完了）。
set -euo pipefail
cd "$(dirname "$0")/.."

# node --test に渡すテストのファイルを、指定したフォルダから集める（無いフォルダは飛ばす）。
collect_tests() {
  find "$@" -name '*.test.mjs' -type f 2>/dev/null | sort
}

echo "== フェーズ2: 静的検査と単体テスト"
# shellcheck disable=SC2046
node --test $(collect_tests tests/unit tests/site tests/i18n)

echo "verify: 必須のフェーズはすべて通過"
```

Run: `chmod +x Scripts/verify.sh && ./Scripts/verify.sh`
Expected: `# pass 1` のあとに「verify: 必須のフェーズはすべて通過」、終了コード 0。

- [ ] **Step 7: CLAUDE.md を作る**

````markdown
# Oshi Life の LP（OshiLife-Docs）

iPhone アプリ Oshi Life の公式サイト。GitHub Pages（main の直下を Jekyll の legacy で配信）で
`https://smallwarestudio.github.io/OshiLife-Docs/` に出ている。App Store の5言語のマーケティング URL とサポート URL がここを指す。

## 正本

- 設計書: `_docs/superpowers/specs/2026-10-26-landing-page-design.md`
- 計画: `_docs/superpowers/plans/2026-10-26-landing-page.md`

## 検証

`./Scripts/verify.sh` の終了コードが完了判定。発話や目視の印象では判定しない。

| フェーズ | 中身 | 完了判定 |
|---|---|---|
| 1 | 生成し直した HTML と、コミットされた HTML が同じ（`node _src/build.mjs --check`） | 必須 |
| 2 | `node --test`（単体テスト・生成したページと素材の静的検査・訳語） | 必須 |
| 3 | Playwright で 5言語 × 390px・1280px を描く（はみ出し・読み込み・コントラスト・動画の枠）。撮った画像は `_tmp/shots/` | 必須 |
| 4 | 外部リンク（App Store・お問い合わせ）が生きている | `VERIFY_NETWORK=1` のときだけ |

「完了」と言う前に、フェーズ3で撮った画像を目で見て確かめる。

## コマンド

```bash
npm run build                                   # 5ページを生成する
node _src/build.mjs --check                     # 生成物が最新かだけを見る
node _src/assets/fetch-badges.mjs               # App Store のバッジを取り直す
node _src/assets/prepare-screens.mjs <product-page の場所>   # 画面の画像を作り直す
node _src/og/render-og.mjs                      # 共有用の画像を描き直す
node _src/assets/encode-video.mjs <hero|color> <MP4>        # 動画を差し込む
```

## 決まり

- 5つの `index.html`（直下と `en/` `ko/` `zh-Hans/` `zh-Hant/`）は生成物。直接書き換えず、`_src/` を直して `npm run build`。
- 文は `_src/content/<言語>.json`、数値は `_src/lib/facts.mjs` だけ。文には `{free.oshi}` のように参照を書き、2〜9 の数字や2桁以上の数を直接書かない。
- 言語どうしで文の形（キーと配列の長さ）をそろえる。生成の時点で食い違いを止める。
- 書いてよい事実は設計書 6 節だけ。持ち込まない言い回しは設計書 5 節と 6 節「書かないこと」。自分の記録は「思い出」（「レポート」は「みんなのレポート」だけ）。
- 変えないもの: 規約とプライバシーポリシーのページ（直下の `privacy.html`・`terms.html` と各言語のフォルダの中）、`legal.css`、`.DS_Store`。
- 直下に公開しないファイルを足したら、`_config.yml` の exclude にも足す（`tests/site/config.test.mjs` が見張る）。`_` で始まる名前は公開されない。
- ページは外から何も読み込まない。JavaScript は `assets/site.js` の動画の制御だけ。
- App Store のバッジは Apple の公式のものを1ページに1つ。
- 参照しないもの（ユーザーの指示）: 旧 LP、App Store の宣伝文と合成画像、`~/Documents/ClaudeWorkspace` のほかのプロジェクト。
- main に入った時点で公開される。作業はブランチで行い、push はユーザーの指示があってから。
- コミットは日本語の Conventional Commits。
````

- [ ] **Step 8: コミットする**

```bash
git add package.json package-lock.json .gitignore _config.yml CLAUDE.md Scripts/verify.sh tests/helpers/repository.mjs tests/site/config.test.mjs
git commit -m "chore: LP の足場（公開の範囲・検証の入口・決まり）を作る

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 生成の核（数値・エスケープ・言語・文の形・文の引き方・画像の寸法）

**Files:**
- Create: `_src/lib/facts.mjs`、`_src/lib/escape.mjs`、`_src/lib/locales.mjs`、`_src/lib/content.mjs`、`_src/lib/text.mjs`、`_src/lib/image-size.mjs`
- Test: `tests/unit/core.test.mjs`、`tests/unit/image-size.test.mjs`

**Interfaces:**
- Produces:
  - `FACTS`（凍結したオブジェクト）、`fillFacts(text: string, facts = FACTS): string`（`{a.b}` を値に置き換える。無ければ例外）
  - `escapeHtml(text): string`
  - `SITE_URL`、`CONTACT_FORM_URL`、`DEFAULT_LOCALE_CODE`、`LOCALES`（各要素 `{ code, label, directory, legalDirectory, ogLocale, appStoreUrl, badgeLocale, screenshotFolder }`）、`findLocale(code)`、`rootPrefix(locale): '' | '../'`、`pageHref(from, to): string`、`absolutePageUrl(locale): string`、`badgeDownloadUrl(locale): string`
  - `describeShape(value, path?): string[]`、`findShapeDifferences(reference, candidate): { missing: string[], extra: string[] }`
  - `createTextLookup(content)` → `t(path): string`（エスケープ済み）、`t.list(path): unknown[]`、`t.has(path): boolean`。`renderPhrases(escapedText): string`
  - `readWebpSize(buffer)`・`readPngSize(buffer)`・`readJpegSize(buffer)` → `{ width, height }`、`readSvgSize(svgText)` → `{ width, height }`（四捨五入した整数）

- [ ] **Step 1: 単体テストを書く**

`tests/unit/core.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, fillFacts } from '../../_src/lib/facts.mjs';
import { escapeHtml } from '../../_src/lib/escape.mjs';
import { SITE_URL, absolutePageUrl, findLocale, pageHref, rootPrefix } from '../../_src/lib/locales.mjs';
import { describeShape, findShapeDifferences } from '../../_src/lib/content.mjs';
import { createTextLookup, renderPhrases } from '../../_src/lib/text.mjs';

test('文の中の参照を数値に置き換える', () => {
  assert.equal(fillFacts('推し{free.oshi}人・iOS {minimumIOSVersion}'), `推し${FACTS.free.oshi}人・iOS ${FACTS.minimumIOSVersion}`);
});

test('見つからない参照は例外にする', () => {
  assert.throws(() => fillFacts('{free.unknown}'), /free\.unknown/);
});

test('参照の無い文はそのまま返す', () => {
  assert.equal(fillFacts('撮って記録'), '撮って記録');
});

test('HTML の特別な文字をエスケープする', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('ページどうしの相対リンク', () => {
  const japanese = findLocale('ja');
  const english = findLocale('en');
  const korean = findLocale('ko');
  assert.equal(pageHref(japanese, english), 'en/');
  assert.equal(pageHref(english, japanese), '../');
  assert.equal(pageHref(english, korean), '../ko/');
  assert.equal(pageHref(japanese, japanese), './');
});

test('素材への相対パスの頭は、直下のページだけ空', () => {
  assert.equal(rootPrefix(findLocale('ja')), '');
  assert.equal(rootPrefix(findLocale('zh-Hans')), '../');
});

test('公開の URL', () => {
  assert.equal(absolutePageUrl(findLocale('ja')), SITE_URL);
  assert.equal(absolutePageUrl(findLocale('en')), `${SITE_URL}en/`);
});

test('知らない言語は例外にする', () => {
  assert.throws(() => findLocale('fr'), /fr/);
});

test('同じ形の文なら、違いは無い', () => {
  const content = { hero: { title: 'あ', items: ['い', 'う'] } };
  assert.deepEqual(findShapeDifferences(content, structuredClone(content)), { missing: [], extra: [] });
});

test('足りないキーと余分なキーを挙げる', () => {
  assert.deepEqual(findShapeDifferences({ a: 'x', b: 'y' }, { a: 'x', c: 'z' }), { missing: ['b'], extra: ['c'] });
});

test('配列の長さの違いも挙げる', () => {
  assert.deepEqual(findShapeDifferences({ list: ['x', 'y'] }, { list: ['x'] }), {
    missing: ['list#length=2', 'list[1]'],
    extra: ['list#length=1'],
  });
});

test('文字列でない値は例外にする', () => {
  assert.throws(() => describeShape({ count: 1 }), /count/);
});

test('文を引くと、数値を埋めてエスケープする', () => {
  const t = createTextLookup({ hero: { note: '月{free.scansPerMonth}回 <b>&' } });
  assert.equal(t('hero.note'), `月${FACTS.free.scansPerMonth}回 &lt;b&gt;&amp;`);
});

test('配列の中の文も道筋で引ける', () => {
  const t = createTextLookup({ items: [{ title: 'a' }] });
  assert.equal(t('items.0.title'), 'a');
  assert.equal(t.list('items').length, 1);
  assert.equal(t.has('items.0.tag'), false);
});

test('無い文は例外にする', () => {
  const t = createTextLookup({});
  assert.throws(() => t('hero.title'), /hero\.title/);
  assert.throws(() => t.list('items'), /items/);
});

test('見出しを改行の位置で折り返しの単位に分ける', () => {
  assert.equal(renderPhrases('撮ったら、\n下書き'), '<span class="phrase">撮ったら、</span><span class="phrase">下書き</span>');
});
```

`tests/unit/image-size.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJpegSize, readPngSize, readSvgSize, readWebpSize } from '../../_src/lib/image-size.mjs';

function createWebpHeader(chunkType, writeDimensions) {
  const buffer = Buffer.alloc(32);
  buffer.write('RIFF', 0, 'ascii');
  buffer.write('WEBP', 8, 'ascii');
  buffer.write(chunkType, 12, 'ascii');
  writeDimensions(buffer);
  return buffer;
}

test('WebP（VP8）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8 ', (header) => {
    header.writeUInt16LE(640, 26);
    header.writeUInt16LE(1391, 28);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP（VP8L）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8L', (header) => {
    header.writeUInt32LE(((640 - 1) | ((1391 - 1) << 14)) >>> 0, 21);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP（VP8X）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8X', (header) => {
    header.writeUIntLE(640 - 1, 24, 3);
    header.writeUIntLE(1391 - 1, 27, 3);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP でないものは例外にする', () => {
  assert.throws(() => readWebpSize(Buffer.alloc(32)), /WebP/);
});

test('PNG の寸法を読む', () => {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(192, 16);
  buffer.writeUInt32BE(192, 20);
  assert.deepEqual(readPngSize(buffer), { width: 192, height: 192 });
});

test('JPEG の寸法を読む（最初のフレームの区切りから）', () => {
  const buffer = Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0x03,
  ]);
  assert.deepEqual(readJpegSize(buffer), { width: 1200, height: 630 });
});

test('SVG の幅と高さを整数で読む', () => {
  const svg = '<svg id="JP" xmlns="http://www.w3.org/2000/svg" width="108.85157" height="40" viewBox="0 0 108.85157 40">';
  assert.deepEqual(readSvgSize(svg), { width: 109, height: 40 });
});
```

- [ ] **Step 2: テストが落ちることを確かめる**

Run: `node --test tests/unit/core.test.mjs tests/unit/image-size.test.mjs`
Expected: FAIL（`Cannot find module '.../_src/lib/facts.mjs'` など）

- [ ] **Step 3: 実装する**

`_src/lib/facts.mjs`:

```js
// LP に出す数値。出典はアプリのコード（設計書 6 節。2026-10-26 に Release_2.0 の 7f12f73 と照合）。
// 文の中では {free.oshi} のように参照し、数値を文に直接書かない。

export const FACTS = Object.freeze({
  appVersion: '2.0',
  minimumIOSVersion: '17.0',
  copyrightYear: 2026,
  free: Object.freeze({
    oshi: 3,
    events: 30,
    expenses: 50,
    memories: 50,
    goods: 50,
    activeLotteryEntries: 1,
    scansPerMonth: 3,
  }),
  photosPerMemory: Object.freeze({ free: 3, premium: 10 }),
  alternateIconCount: 10,
  eventKindCount: 12,
  lotteryDerivedEventCount: 3,
  premiumExtraReminderDays: 3,
  budgetWarningPercent: 80,
  oshiFilterMinimumCount: 2,
  liveActivityLeadHours: 6,
  anniversaryNotificationHour: 9,
  subscriptionCancelLeadHours: 24,
});

const PLACEHOLDER_PATTERN = /\{([A-Za-z][\w.]*)\}/g;

/** 文の中の {path} を facts の値に置き換える。見つからない参照は例外にする（書き間違いを生成の時点で止める）。 */
export function fillFacts(text, facts = FACTS) {
  return text.replace(PLACEHOLDER_PATTERN, (_placeholder, dottedPath) => {
    const value = dottedPath.split('.').reduce((node, key) => (node == null ? undefined : node[key]), facts);
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(`文の中の参照 {${dottedPath}} に対応する値がありません`);
    }
    return String(value);
  });
}
```

`_src/lib/escape.mjs`:

```js
const HTML_ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

/** 文を HTML の本文と属性の値に安全に入れられる形にする。 */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}
```

`_src/lib/locales.mjs`:

```js
// 5言語のページの設定と、ページどうしのリンクの作り方。

export const SITE_URL = 'https://smallwarestudio.github.io/OshiLife-Docs/';
export const CONTACT_FORM_URL = 'https://forms.gle/GTZoGiHJLudqfbcp8';
export const DEFAULT_LOCALE_CODE = 'ja';

const APP_STORE_URL_JAPAN = 'https://apps.apple.com/jp/app/oshi-life/id6780718555';
/** 国を指定しないリンク。開いた人の国のストアに移る。 */
const APP_STORE_URL_ANY_REGION = 'https://apps.apple.com/app/id6780718555';
const BADGE_ENDPOINT = 'https://toolbox.marketingtools.apple.com/api/badges/download-on-the-app-store/black/';
const BADGE_QUERY = '?size=250x83';

/**
 * directory: このページの置き場（直下は ''）。legalDirectory: 規約とプライバシーポリシーの置き場。
 * badgeLocale: Apple のバッジの言語。screenshotFolder: 画面の画像の元のフォルダの名前。
 */
export const LOCALES = Object.freeze([
  { code: 'ja', label: '日本語', directory: '', legalDirectory: 'ja/', ogLocale: 'ja_JP', appStoreUrl: APP_STORE_URL_JAPAN, badgeLocale: 'ja-jp', screenshotFolder: 'ja' },
  { code: 'en', label: 'English', directory: 'en/', legalDirectory: 'en/', ogLocale: 'en_US', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'en-us', screenshotFolder: 'en-US' },
  { code: 'ko', label: '한국어', directory: 'ko/', legalDirectory: 'ko/', ogLocale: 'ko_KR', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'ko-kr', screenshotFolder: 'ko' },
  { code: 'zh-Hans', label: '简体中文', directory: 'zh-Hans/', legalDirectory: 'zh-Hans/', ogLocale: 'zh_CN', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'zh-cn', screenshotFolder: 'zh-Hans' },
  { code: 'zh-Hant', label: '繁體中文', directory: 'zh-Hant/', legalDirectory: 'zh-Hant/', ogLocale: 'zh_TW', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'zh-tw', screenshotFolder: 'zh-Hant' },
].map((locale) => Object.freeze(locale)));

export function findLocale(code) {
  const locale = LOCALES.find((candidate) => candidate.code === code);
  if (!locale) throw new Error(`知らない言語です: ${code}`);
  return locale;
}

/** ページから見た、サイトの直下への相対パス（直下のページは ''、言語のフォルダのページは '../'）。 */
export function rootPrefix(locale) {
  return locale.directory === '' ? '' : '../';
}

/** from のページから to のページへの相対リンク。 */
export function pageHref(from, to) {
  const href = rootPrefix(from) + to.directory;
  return href === '' ? './' : href;
}

export function absolutePageUrl(locale) {
  return SITE_URL + locale.directory;
}

export function badgeDownloadUrl(locale) {
  return `${BADGE_ENDPOINT}${locale.badgeLocale}${BADGE_QUERY}`;
}
```

`_src/lib/content.mjs`:

```js
// 言語ごとの文の形（キーの道筋と配列の長さ）。言語どうしで節や項目の数がずれていないかを比べる。

/** 値の形を、道筋の一覧にする。配列は長さも 'path#length=n' として入れる。葉は文字列でなければならない。 */
export function describeShape(value, dottedPath = '') {
  if (Array.isArray(value)) {
    return [`${dottedPath}#length=${value.length}`, ...value.flatMap((item, index) => describeShape(item, `${dottedPath}[${index}]`))];
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).sort().flatMap((key) => describeShape(value[key], dottedPath ? `${dottedPath}.${key}` : key));
  }
  if (typeof value !== 'string') throw new Error(`${dottedPath} は文字列でなければなりません`);
  return [dottedPath];
}

export function findShapeDifferences(reference, candidate) {
  const referencePaths = describeShape(reference);
  const candidatePaths = describeShape(candidate);
  const candidateSet = new Set(candidatePaths);
  const referenceSet = new Set(referencePaths);
  return {
    missing: referencePaths.filter((dottedPath) => !candidateSet.has(dottedPath)),
    extra: candidatePaths.filter((dottedPath) => !referenceSet.has(dottedPath)),
  };
}
```

`_src/lib/text.mjs`:

```js
import { escapeHtml } from './escape.mjs';
import { fillFacts } from './facts.mjs';

/** 'a.b.0.c' の道筋で入れ子の値を引く。無ければ undefined。 */
function readPath(source, dottedPath) {
  return dottedPath.split('.').reduce((node, key) => (node == null ? undefined : node[key]), source);
}

/**
 * その言語の文を引く関数を作る。
 * t(path) は数値を埋めて HTML に安全な形にした文、t.list(path) は配列そのもの、t.has(path) は有無を返す。
 */
export function createTextLookup(content) {
  const lookup = (dottedPath) => {
    const value = readPath(content, dottedPath);
    if (typeof value !== 'string') throw new Error(`文 ${dottedPath} がありません`);
    return escapeHtml(fillFacts(value));
  };
  lookup.list = (dottedPath) => {
    const value = readPath(content, dottedPath);
    if (!Array.isArray(value)) throw new Error(`一覧 ${dottedPath} がありません`);
    return value;
  };
  lookup.has = (dottedPath) => readPath(content, dottedPath) !== undefined;
  return lookup;
}

/** 見出しを改行（\n）の位置で折り返しの単位に分ける。日本語の見出しが語の途中で折れないようにするため。 */
export function renderPhrases(escapedText) {
  return escapedText.split('\n').map((phrase) => `<span class="phrase">${phrase}</span>`).join('');
}
```

`_src/lib/image-size.mjs`:

```js
// 画像の寸法を、ファイルの先頭のバイトから読む（依存を足さないため）。

const RIFF_TAG_END = 4;
const WEBP_TAG_START = 8;
const WEBP_TAG_END = 12;
const WEBP_CHUNK_TYPE_END = 16;
const VP8_WIDTH_OFFSET = 26;
const VP8_HEIGHT_OFFSET = 28;
const VP8_DIMENSION_MASK = 0x3fff;
const VP8L_BITS_OFFSET = 21;
const VP8L_HEIGHT_SHIFT = 14;
const VP8X_WIDTH_OFFSET = 24;
const VP8X_HEIGHT_OFFSET = 27;
const VP8X_DIMENSION_BYTES = 3;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

const JPEG_MARKER_PREFIX = 0xff;
const JPEG_START_OF_FRAME_MARKERS = new Set([0xc0, 0xc1, 0xc2]);
const JPEG_FIRST_SEGMENT_OFFSET = 2;
const JPEG_MARKER_SIZE = 2;
const JPEG_FRAME_HEIGHT_OFFSET = 5;
const JPEG_FRAME_WIDTH_OFFSET = 7;

export function readWebpSize(buffer) {
  if (buffer.toString('ascii', 0, RIFF_TAG_END) !== 'RIFF' || buffer.toString('ascii', WEBP_TAG_START, WEBP_TAG_END) !== 'WEBP') {
    throw new Error('WebP ではありません');
  }
  const chunkType = buffer.toString('ascii', WEBP_TAG_END, WEBP_CHUNK_TYPE_END);
  if (chunkType === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(VP8_WIDTH_OFFSET) & VP8_DIMENSION_MASK,
      height: buffer.readUInt16LE(VP8_HEIGHT_OFFSET) & VP8_DIMENSION_MASK,
    };
  }
  if (chunkType === 'VP8L') {
    const bits = buffer.readUInt32LE(VP8L_BITS_OFFSET);
    return { width: (bits & VP8_DIMENSION_MASK) + 1, height: ((bits >>> VP8L_HEIGHT_SHIFT) & VP8_DIMENSION_MASK) + 1 };
  }
  if (chunkType === 'VP8X') {
    return {
      width: buffer.readUIntLE(VP8X_WIDTH_OFFSET, VP8X_DIMENSION_BYTES) + 1,
      height: buffer.readUIntLE(VP8X_HEIGHT_OFFSET, VP8X_DIMENSION_BYTES) + 1,
    };
  }
  throw new Error(`知らない WebP の形式です: ${chunkType}`);
}

export function readPngSize(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) throw new Error('PNG ではありません');
  return { width: buffer.readUInt32BE(PNG_WIDTH_OFFSET), height: buffer.readUInt32BE(PNG_HEIGHT_OFFSET) };
}

export function readJpegSize(buffer) {
  let offset = JPEG_FIRST_SEGMENT_OFFSET;
  while (offset + JPEG_FRAME_WIDTH_OFFSET < buffer.length) {
    if (buffer[offset] !== JPEG_MARKER_PREFIX) throw new Error('JPEG の区切りを読めません');
    const marker = buffer[offset + 1];
    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      return {
        width: buffer.readUInt16BE(offset + JPEG_FRAME_WIDTH_OFFSET),
        height: buffer.readUInt16BE(offset + JPEG_FRAME_HEIGHT_OFFSET),
      };
    }
    offset += JPEG_MARKER_SIZE + buffer.readUInt16BE(offset + JPEG_MARKER_SIZE);
  }
  throw new Error('JPEG の寸法が見つかりません');
}

/** SVG の最初の <svg> の width と height を、四捨五入した整数で読む。 */
export function readSvgSize(svgText) {
  const width = Number(svgText.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1]);
  const height = Number(svgText.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error('SVG の width と height を読めません');
  return { width: Math.round(width), height: Math.round(height) };
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `node --test tests/unit/core.test.mjs tests/unit/image-size.test.mjs`
Expected: PASS（23 tests）

- [ ] **Step 5: verify を通してコミットする**

Run: `./Scripts/verify.sh`
Expected: 終了コード 0

```bash
git add _src/lib tests/unit
git commit -m "feat: LP の生成の核（数値・言語・文の形・文の引き方・画像の寸法）を作る

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 素材（App Store のバッジ・アイコン・各言語の画面）

**Files:**
- Create: `_src/lib/assets.mjs`、`_src/assets/fetch-badges.mjs`、`_src/assets/prepare-screens.mjs`、`_src/assets/prepare-icon.mjs`
- Create（生成物）: `assets/badges/{ja,en,ko,zh-Hans,zh-Hant}.svg`、`assets/img/<言語>/{home-light,home-dark,home-mint,schedule,money,oshi,record}.webp`、`assets/img/common/app-icon.png`
- Test: `tests/site/assets.test.mjs`

**Interfaces:**
- Consumes: `LOCALES`・`badgeDownloadUrl`（Task 2）、`readWebpSize`・`readPngSize`・`readSvgSize`（Task 2）
- Produces: `SCREEN_IMAGE = { width: 640, height: 1391 }`、`SCREENS`（7つの名前）、`APP_ICON = { size: 192, file }`、`OG_IMAGE = { width: 1200, height: 630 }`、`BYTE_BUDGETS`、`screenPath(code, screen)`、`badgePath(code)`、`ogImagePath(code)`（どれもサイトの直下からの相対パス）

- [ ] **Step 1: 素材の決まりを書く**

`_src/lib/assets.mjs`:

```js
// LP が使う画像の決まり（場所・寸法・重さの上限）。生成・素材の準備・検査が同じ値を使う。

/** 各言語のアプリの画面。元は 1320×2868 で、表示の2倍の密度に足りる幅に縮める。 */
export const SCREEN_IMAGE = Object.freeze({ width: 640, height: 1391 });

/** 各言語で用意する画面の名前（assets/img/<言語>/<名前>.webp）。 */
export const SCREENS = Object.freeze(['home-light', 'home-dark', 'home-mint', 'schedule', 'money', 'oshi', 'record']);

/** アプリのアイコン（favicon と最後の CTA）。 */
export const APP_ICON = Object.freeze({ size: 192, file: 'assets/img/common/app-icon.png' });

/** 共有用の画像（OG）。 */
export const OG_IMAGE = Object.freeze({ width: 1200, height: 630 });

const KILOBYTE = 1024;

/** ファイルの重さの上限（バイト）。表示の速さのため。 */
export const BYTE_BUDGETS = Object.freeze({
  screen: 150 * KILOBYTE,
  appIcon: 60 * KILOBYTE,
  ogImage: 300 * KILOBYTE,
  video: 1536 * KILOBYTE,
  videoPoster: 80 * KILOBYTE,
});

export function screenPath(localeCode, screen) {
  return `assets/img/${localeCode}/${screen}.webp`;
}

export function badgePath(localeCode) {
  return `assets/badges/${localeCode}.svg`;
}

export function ogImagePath(localeCode) {
  return `assets/og/${localeCode}.jpg`;
}
```

- [ ] **Step 2: 素材のテストを書く**

`tests/site/assets.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { APP_ICON, BYTE_BUDGETS, SCREEN_IMAGE, SCREENS, badgePath, screenPath } from '../../_src/lib/assets.mjs';
import { readPngSize, readSvgSize, readWebpSize } from '../../_src/lib/image-size.mjs';

for (const locale of LOCALES) {
  test(`${locale.code}: Apple の App Store バッジ（SVG）がある`, () => {
    const svg = readFileSync(path.join(REPOSITORY_ROOT, badgePath(locale.code)), 'utf8');
    const size = readSvgSize(svg);
    assert.ok(size.width > 0 && size.height > 0);
    assert.match(svg, /Download_on_the_App_Store_Badge/);
  });

  test(`${locale.code}: 画面の画像がそろい、寸法と重さが決まりどおり`, () => {
    for (const screen of SCREENS) {
      const file = path.join(REPOSITORY_ROOT, screenPath(locale.code, screen));
      const buffer = readFileSync(file);
      assert.deepEqual(readWebpSize(buffer), { width: SCREEN_IMAGE.width, height: SCREEN_IMAGE.height }, file);
      assert.ok(buffer.length <= BYTE_BUDGETS.screen, `${file} が ${buffer.length} バイト`);
    }
  });
}

test('アプリのアイコンがあり、寸法と重さが決まりどおり', () => {
  const buffer = readFileSync(path.join(REPOSITORY_ROOT, APP_ICON.file));
  assert.deepEqual(readPngSize(buffer), { width: APP_ICON.size, height: APP_ICON.size });
  assert.ok(buffer.length <= BYTE_BUDGETS.appIcon, `${buffer.length} バイト`);
});
```

- [ ] **Step 3: テストが落ちることを確かめる**

Run: `node --test tests/site/assets.test.mjs`
Expected: FAIL（`ENOENT ... assets/badges/ja.svg` など。11 tests 中 11 fail）

- [ ] **Step 4: 素材を作るスクリプトを書く**

`_src/assets/fetch-badges.mjs`:

```js
// Apple の App Store Marketing Tools から、5言語の App Store バッジ（黒）を取って assets/badges/ に置く。
// バッジは Apple の公式のものだけを使う（自分で訳したり作り直したりしない）。
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, badgeDownloadUrl } from '../lib/locales.mjs';
import { badgePath } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));

for (const locale of LOCALES) {
  const response = await fetch(badgeDownloadUrl(locale));
  if (!response.ok) throw new Error(`${locale.code} のバッジを取れません（${response.status}）`);
  const svg = await response.text();
  if (!svg.trimStart().startsWith('<svg')) throw new Error(`${locale.code} のバッジが SVG ではありません`);
  const file = path.join(REPOSITORY_ROOT, badgePath(locale.code));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, svg);
  console.log(`${path.relative(REPOSITORY_ROOT, file)}（${svg.length} バイト）`);
}
```

`_src/assets/prepare-screens.mjs`:

```js
// 各言語のアプリの素の画面（1320×2868 の PNG）を、Web 向けの WebP にして assets/img/<言語>/ に置く。
// 元の画像はリポジトリの外にある（product-page の場所を引数で渡す）。cwebp（Homebrew の webp）を使う。
// 使い方: node _src/assets/prepare-screens.mjs ~/Desktop/OshiLife-2.0.0-scan-assets/product-page
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../lib/locales.mjs';
import { SCREEN_IMAGE, screenPath } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const WEBP_QUALITY = 80;
const FOLDER_PLACEHOLDER = '<folder>';

/** 画面の名前と、product-page の中の元の画像。02 の合成画像（App Store の宣伝用）は使わない。 */
const SCREEN_SOURCES = Object.freeze({
  'home-light': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/01_01-home-light.png`,
  'home-dark': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/02_02-home-dark.png`,
  'home-mint': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/03_03-home-mint-light.png`,
  schedule: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/04_04-schedule-light.png`,
  money: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/05_05-money-light.png`,
  oshi: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/07_07-oshi-light.png`,
  record: `08-record-${FOLDER_PLACEHOLDER}.png`,
});

const [sourceRoot] = process.argv.slice(2);
if (!sourceRoot) {
  console.error('使い方: node _src/assets/prepare-screens.mjs <product-page の場所>');
  process.exit(1);
}

for (const locale of LOCALES) {
  for (const [screen, sourcePattern] of Object.entries(SCREEN_SOURCES)) {
    const source = path.join(sourceRoot, sourcePattern.replaceAll(FOLDER_PLACEHOLDER, locale.screenshotFolder));
    if (!existsSync(source)) throw new Error(`元の画像がありません: ${source}`);
    const output = path.join(REPOSITORY_ROOT, screenPath(locale.code, screen));
    mkdirSync(path.dirname(output), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', String(WEBP_QUALITY), '-resize', String(SCREEN_IMAGE.width), String(SCREEN_IMAGE.height), source, '-o', output]);
    console.log(path.relative(REPOSITORY_ROOT, output));
  }
}
```

`_src/assets/prepare-icon.mjs`:

```js
// アプリのアイコン（1024px の PNG）を、ページで使う大きさにする。macOS の sips を使う。
// 使い方: node _src/assets/prepare-icon.mjs ~/Documents/GitHub/OshiLife/OshiLife/Assets.xcassets/AppIcon.appiconset/Icon-1024.png
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ICON } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const [source] = process.argv.slice(2);
if (!source) {
  console.error('使い方: node _src/assets/prepare-icon.mjs <Icon-1024.png の場所>');
  process.exit(1);
}

const output = path.join(REPOSITORY_ROOT, APP_ICON.file);
mkdirSync(path.dirname(output), { recursive: true });
execFileSync('sips', ['-z', String(APP_ICON.size), String(APP_ICON.size), source, '--out', output], { stdio: 'ignore' });
console.log(path.relative(REPOSITORY_ROOT, output));
```

- [ ] **Step 5: 素材を作る**

```bash
node _src/assets/fetch-badges.mjs
node _src/assets/prepare-screens.mjs ~/Desktop/OshiLife-2.0.0-scan-assets/product-page
node _src/assets/prepare-icon.mjs ~/Documents/GitHub/OshiLife/OshiLife/Assets.xcassets/AppIcon.appiconset/Icon-1024.png
```

Expected: バッジ5つ・画面35枚・アイコン1つのパスが並ぶ。どこかで「元の画像がありません」「バッジを取れません」と出たら止めてユーザーに知らせる（元の画像の場所か、Apple の配布元が変わった）。

- [ ] **Step 6: テストが通ることを確かめ、画面を目で見る**

Run: `node --test tests/site/assets.test.mjs`
Expected: PASS（11 tests）。重さの上限を超えた画面があれば、`WEBP_QUALITY` を 75 に下げて Step 5 の2行目からやり直す。

目で見る: `sips -s format png assets/img/en/record.webp --out _tmp/record-en.png` と `sips -s format png assets/img/ko/home-light.webp --out _tmp/home-ko.png` を作って Read で開き、その言語の画面であること・02 の合成画像（見出しが焼き込まれたもの）でないことを確かめる。

- [ ] **Step 7: コミットする**

```bash
git add _src/lib/assets.mjs _src/assets assets tests/site/assets.test.mjs
git commit -m "feat: App Store のバッジ・アイコン・各言語の画面の素材を用意する

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 日本語の文（ja.json）と文の検査

**Files:**
- Create: `_src/content/ja.json`、`tests/helpers/content.mjs`
- Test: `tests/unit/content.test.mjs`

**Interfaces:**
- Consumes: `FACTS`・`fillFacts`（Task 2）、`LOCALES`（Task 2）
- Produces: `_src/content/ja.json`（4 言語の文はこの形に合わせる。キーの一覧は下の JSON がすべて）。描画（Task 5）が引く道筋: `meta.*`・`nav.*`・`media.*`・`hero.*`・`snap.*`・`color.*`・`schedule.*`・`money.*`・`oshi.*`・`more.*`・`plans.*`・`faq.*`・`start.*`・`footer.*`。要点（`points`）の要素は `title`・`body` と、Premium の機能だけ `tag`。

- [ ] **Step 1: 文の検査を書く**

`tests/helpers/content.mjs`（訳語の検査（Task 10）も使う）:

```js
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from './repository.mjs';

/** その言語の文（_src/content/<code>.json）。無ければ null。 */
export function readContent(code) {
  const file = path.join(REPOSITORY_ROOT, '_src', 'content', `${code}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/** 文を道筋つきで平らに集める（道筋は 'snap.points.0.title' の形）。 */
export function collectStrings(value, dottedPath = '') {
  if (typeof value === 'string') return [{ dottedPath, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${dottedPath}.${index}`));
  return Object.entries(value).flatMap(([key, child]) => collectStrings(child, dottedPath ? `${dottedPath}.${key}` : key));
}
```

`tests/unit/content.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { fillFacts } from '../../_src/lib/facts.mjs';
import { collectStrings, readContent } from '../helpers/content.mjs';

const PLACEHOLDER_PATTERN = /\{[A-Za-z][\w.]*\}/g;
/** 文に直接書いてよい数字は 0 と 1 だけ（ほかは facts.mjs から参照する）。 */
const FORBIDDEN_NUMBER_PATTERN = /[2-9]|\d{2,}/;
/** 設計書 5 節・6 節で、誤り・言い過ぎと分かった言い回し（日本語の文）。 */
const FORBIDDEN_JAPANESE_PHRASES = Object.freeze([
  'この範囲で全機能', '全機能を使え', '無料で全機能', '数回のタップ', '手で打ち直すところがありません',
  '入力は、それで終わりです', '送られません', '当日の流れ', '多段', '色分けしたカレンダー', 'アイコンが推しの色に変わ',
]);
/** 自分の記録は「思い出」。「レポート」は共有のタイムライン「みんなのレポート」だけに使う。 */
const STRAY_REPORT_PATTERN = /(?<!みんなの)レポート/;

for (const locale of LOCALES) {
  const content = readContent(locale.code);
  if (content === null) continue;
  const strings = collectStrings(content);

  test(`${locale.code}: 文の中の参照がすべて facts にある`, () => {
    for (const { dottedPath, text } of strings) assert.doesNotThrow(() => fillFacts(text), dottedPath);
  });

  test(`${locale.code}: 数値を文に直接書いていない`, () => {
    for (const { dottedPath, text } of strings) {
      assert.doesNotMatch(text.replace(PLACEHOLDER_PATTERN, ''), FORBIDDEN_NUMBER_PATTERN, `${dottedPath}: ${text}`);
    }
  });
}

test('ja: 持ち込まない言い回しと、思い出を「レポート」と呼ぶ文が無い', () => {
  const content = readContent('ja');
  assert.ok(content, '_src/content/ja.json がありません');
  for (const { dottedPath, text } of collectStrings(content)) {
    for (const phrase of FORBIDDEN_JAPANESE_PHRASES) assert.ok(!text.includes(phrase), `${dottedPath}: 「${phrase}」`);
    assert.doesNotMatch(text, STRAY_REPORT_PATTERN, dottedPath);
  }
});
```

- [ ] **Step 2: テストが落ちることを確かめる**

Run: `node --test tests/unit/content.test.mjs`
Expected: FAIL（「_src/content/ja.json がありません」）

- [ ] **Step 3: 日本語の文を書く**

`_src/content/ja.json`（この内容のまま書く。直すときは設計書 5 節・6 節と照らす）:

```json
{
  "meta": {
    "title": "Oshi Life｜推し活の予定・当落・お金を記録する iPhone アプリ",
    "description": "チケットやレシートを撮ると、予定・支出・グッズの下書きができる iPhone アプリ。抽選の締切や当落発表、推しに使ったお金をまとめて記録できます。",
    "ogTitle": "撮ったら、下書きまでできてる。｜Oshi Life",
    "ogImageAlt": "Oshi Life のロゴと、アプリのホーム画面"
  },
  "nav": {
    "skipToContent": "本文へ移動",
    "languageLabel": "言語",
    "appStore": "App Store",
    "appStoreBadgeAlt": "App Store からダウンロード"
  },
  "media": {
    "pause": "アニメーションを一時停止",
    "play": "アニメーションを再生"
  },
  "hero": {
    "eyebrow": "推し活の記録アプリ Oshi Life {appVersion}",
    "headline": "撮ったら、\n下書きまでできてる。",
    "lead": "チケットやレシートを撮ると、予定や支出、グッズの下書きができます。中身を確かめて保存すれば、手で打つのは直したいところだけ。申込の締切や当落発表、推しに使ったお金まで、iPhone ひとつで管理できます。",
    "note": "撮って記録は、Free プランだと月{free.scansPerMonth}回まで（チケットとレシートを合わせた回数）。Premium は回数の制限がありません。",
    "requirements": "無料（アプリ内課金あり）・iOS {minimumIOSVersion} 以降の iPhone",
    "media": {
      "description": "レシートを撮ると品目ごとのグッズと支出の下書きに分かれ、ホームの今月の支出に加わる様子のアニメーション。",
      "screens": [
        "Oshi Life のホーム画面。推しの色で塗られたカードの下に、次の予定とやること、今月の支出が並んでいる。"
      ]
    }
  },
  "snap": {
    "eyebrow": "撮って記録",
    "headline": "レシートの品目が、\nそのままグッズと支出に。",
    "lead": "遠征から帰って、財布の中のレシートを1枚ずつ打ち込む。その作業を、撮って中身を確かめる作業に変えます。",
    "points": [
      {
        "title": "レシートは品目ごとに",
        "body": "アクリルスタンドとマフラータオルを買ったレシートなら、品目ごとにグッズと支出の記録が1件ずつできます。税などの残りは「その他」の支出にまとめ、品目が読めないときは合計を支出にします。"
      },
      {
        "title": "チケットは予定に",
        "body": "公演名・日時・会場・座席・代金を読み取って、予定の下書きにします。代金が読めていれば、予定を保存したあとにチケット代も支出に残せます。"
      },
      {
        "title": "電子チケットのスクショも",
        "body": "撮るほかに、写真から選ぶこともできます。チケットとレシートを読み違えたときは、同じ画像をもう一方として読み直せます。"
      }
    ],
    "privacy": "読み取りは iPhone の中で行います。読み取りのために画像や文字を外へ送ることはありません。",
    "quota": "Free プランは月{free.scansPerMonth}回まで（チケットとレシートを合わせた回数）。Premium は回数の制限がありません。",
    "imageAlt": "記録の画面。いちばん上に「撮って記録」があり、その下に記録の種類が並んでいる。",
    "caption": "真ん中の「記録」（＋）から、どの画面でも開けます。"
  },
  "color": {
    "eyebrow": "推しの色とダークモード",
    "headline": "推しを切り替えると、\nアプリの色も変わる。",
    "lead": "ボタンやタブ、カードの差し色が、いま選んでいる推しの色になります。ピンクの推しならピンクに、ミントの推しならミントに。",
    "points": [
      {
        "title": "推しごとに色を決めておける",
        "body": "推しごとに色を選んでおくと、その推しに切り替えたときに、アプリ全体の色も一緒に変わります。"
      },
      {
        "title": "ダークモードにも",
        "body": "はじめは iPhone の設定に合わせて切り替わります。設定の「表示モード」で、ライトかダークに固定することもできます。"
      }
    ],
    "media": {
      "description": "ホームの差し色が推しの色に順に変わり、最後にダークモードに切り替わる様子のアニメーション。",
      "screens": [
        "ミントの推しを選んだときのホーム画面。",
        "ダークモードのホーム画面。"
      ]
    }
  },
  "schedule": {
    "eyebrow": "予定と当落",
    "headline": "申込の締切を、\nスクショで覚えておかなくていい。",
    "lead": "抽選に申し込んだら、その申込を Oshi Life に登録しておきます。申込締切や当落発表、入金期限が予定に並び、近づくとお知らせが届きます。",
    "timelineLabel": "抽選の申込を登録してからの流れ",
    "timeline": [
      { "title": "申込を登録する", "body": "申し込んだ公演と、締切や発表の日時を入れておきます。" },
      { "title": "予定が{lotteryDerivedEventCount}つ並ぶ", "body": "申込締切・当落発表・入金期限が、自動でカレンダーに入ります。" },
      { "title": "当選したら公演日も", "body": "当選を記録して公演日を入れると、公演の予定が加わります。" },
      { "title": "結果から当選率がわかる", "body": "当落の結果を記録していくと、これまでの当選率を見られます。" }
    ],
    "points": [
      {
        "title": "締切と入金は前日に",
        "body": "申込締切と入金期限は前日に、当落発表はその時刻にお知らせします。"
      },
      {
        "title": "{premiumExtraReminderDays}日前と当日の朝にも",
        "tag": "Premium",
        "body": "申込締切と入金期限を、前日に加えて{premiumExtraReminderDays}日前と当日の朝にもお知らせします。"
      },
      {
        "title": "当落ボード",
        "body": "予定タブの上の［カレンダー｜当落］で切り替えると、申込が「申込中」「当落待ち」「入金待ち」「参戦準備OK」「落選」に分かれて並びます。"
      },
      {
        "title": "予定は{eventKindCount}種類",
        "body": "ライブ、発売、配信、TV、ラジオ、YouTube、グッズなど。会場名も推しの名前も、自由に入力できます。"
      }
    ],
    "imageAlt": "予定タブのカレンダー。上に［カレンダー｜当落］の切り替えと、推しで絞り込むボタンが並んでいる。",
    "caption": "推しが{oshiFilterMinimumCount}人以上なら、推しで絞り込めます。"
  },
  "money": {
    "eyebrow": "お金",
    "headline": "今月いくら使ったか、\n電卓を出さずにわかる。",
    "lead": "チケット、グッズ、交通費、宿泊、飲食。記録した支出は推しごと・カテゴリごとに集計されて、お金タブで月ごとに見返せます。",
    "points": [
      {
        "title": "今月の様子を1画面で",
        "body": "合計と先月との差、内訳、一覧を、お金タブの1画面にまとめました。"
      },
      {
        "title": "入力を短く",
        "body": "よく使う支出は、テンプレートから入れられます。サブスクや会費は定期支出にしておくと、期日が来た分が自動で入ります。"
      },
      {
        "title": "グッズと支出をいっしょに",
        "body": "グッズを登録するときに「支出にも記録する」をオンにしておけば、支出の記録も一緒にできます。"
      },
      {
        "title": "推しごとに見る",
        "body": "推しが{oshiFilterMinimumCount}人以上なら、内訳と一覧を推しごとに絞り込めます。"
      },
      {
        "title": "予算",
        "tag": "Premium",
        "body": "月の予算を決めると、残りがホームとウィジェットに出ます。予算の{budgetWarningPercent}%に達したときと、超えたときにお知らせします。"
      }
    ],
    "imageAlt": "お金タブ。今月の合計の下に、内訳と支出の一覧が並んでいる。",
    "caption": "支出の CSV・PDF の書き出しは、Premium の機能です。"
  },
  "oshi": {
    "eyebrow": "推し",
    "headline": "帰りの電車で、\n今日のセトリを書いておく。",
    "lead": "思い出には、写真とセットリストを添えて残せます。推しのページには、プロフィールと記念日、グッズ、思い出がまとまっています。",
    "points": [
      {
        "title": "共有するかは1件ずつ",
        "body": "共有を選んだ思い出は、題と本文、セットリストが「みんなのレポート」でほかの人にも読まれます。写真は共有されません。"
      },
      {
        "title": "節目の日に気づける",
        "body": "推し始めてからの日数や誕生日、記念日。節目の日はホームでお祝いして、その日のうちなら記念カードを無料で作れます。誕生日と記念日には、朝{anniversaryNotificationHour}時にお知らせが届きます。"
      },
      {
        "title": "1年をカードに",
        "body": "1年のまとめは、無料でシェアカードにできます。"
      }
    ],
    "imageAlt": "推しのページ。プロフィールの下に、記念日やグッズ、思い出が並んでいる。",
    "caption": "推し活の振り返りと、月間のまとめ・記念日のシェアカードは Premium の機能です。"
  },
  "more": {
    "eyebrow": "そのほか",
    "headline": "ほかにできること",
    "lead": "ホーム画面やロック画面、Siri からも使えます。",
    "points": [
      {
        "title": "ウィジェット",
        "body": "「推し」のウィジェットに、推しの画像と推して何日目か、次の予定までの日数が出ます。「カウントダウン」と「今月の推し活費」のウィジェットは Premium です。"
      },
      {
        "title": "ライブ当日のロック画面",
        "body": "開演の{liveActivityLeadHours}時間前から、ロック画面に開演までのカウントダウンが出ます。対応する iPhone では Dynamic Island にも出ます。"
      },
      {
        "title": "参戦のしおり",
        "body": "日時と会場、交通と宿、持ち物を1枚の画像にまとめて、同行者に送れます。金額は、はじめは画像に入らない設定です。"
      },
      {
        "title": "Siri とショートカット",
        "body": "Siri やショートカットから、予定の追加や次の予定、今月の支出の確認ができます。"
      },
      {
        "title": "ログインは任意",
        "body": "ゲストのままでも、ログインしたときと同じ機能を使えます。あとから Apple か Google でログインしても、記録は引き継がれます。"
      },
      {
        "title": "アプリロック",
        "body": "Face ID・Touch ID・パスコードで、アプリを開くときにロックをかけられます。"
      }
    ]
  },
  "plans": {
    "eyebrow": "Free と Premium",
    "headline": "まずは無料で。\nたくさん記録するなら Premium。",
    "lead": "Free プランには、記録できる数に上限があります。上限に達しても、それまでの記録はこれまでどおり見たり直したり消したりできます。",
    "free": {
      "name": "Free",
      "summary": "無料で使えるプランです。",
      "limitsCaption": "Free プランで記録できる数",
      "note": "当落ボードが作る予定は、予定の数に入りません。落選した申込と入金を済ませた申込は、同時に進める申込に数えません。"
    },
    "limits": [
      { "label": "推し", "value": "{free.oshi}人" },
      { "label": "予定", "value": "{free.events}件" },
      { "label": "支出", "value": "{free.expenses}件" },
      { "label": "思い出", "value": "{free.memories}件" },
      { "label": "グッズ", "value": "{free.goods}件" },
      { "label": "同時に進める抽選の申込", "value": "{free.activeLotteryEntries}件" },
      { "label": "撮って記録", "value": "月{free.scansPerMonth}回" }
    ],
    "premium": {
      "name": "Premium",
      "summary": "月額か年額の、自動更新のサブスクリプションです。価格は App Store でご確認ください。",
      "note": "購読は、期間が終わる{subscriptionCancelLeadHours}時間前までに自動更新をオフにしない限り、自動で更新されます。購読の管理と解約は、購入後に iPhone の設定から行えます。"
    },
    "premiumItems": [
      "推し・予定・支出・グッズ・思い出の数の上限がなくなる",
      "抽選の申込を何件でも同時に。申込締切と入金期限は{premiumExtraReminderDays}日前と当日の朝にもお知らせ",
      "撮って記録の回数の制限なし",
      "推し活の予算。残りをホームとウィジェットに出し、使いすぎをお知らせ",
      "推し活の振り返りと、月間のまとめ・記念日のシェアカード",
      "思い出の写真を1件{photosPerMemory.premium}枚まで（Free は{photosPerMemory.free}枚）。写真をクラウドにも保存",
      "アプリアイコンを{alternateIconCount}色から選べる",
      "支出の CSV・PDF の書き出し",
      "「カウントダウン」と「今月の推し活費」のウィジェット",
      "アプリ内の広告を非表示"
    ]
  },
  "faq": {
    "eyebrow": "サポート",
    "headline": "よくある質問",
    "lead": "ここにない質問は、ページのいちばん下の「お問い合わせ」から送ってください。",
    "items": [
      {
        "question": "撮った写真は、どこかへ送られますか？",
        "answer": "読み取りは iPhone の中で行い、読み取りのために画像や文字を外へ送ることはありません。Premium では、支出に付けたレシートや思い出の写真がクラウドにも保存されます。"
      },
      {
        "question": "無料で使えますか？",
        "answer": "無料で使えます。Free プランには記録できる数に上限があります（上の表）。上限に達しても、それまでの記録はこれまでどおり見たり直したり消したりできます。"
      },
      {
        "question": "ログインは必要ですか？",
        "answer": "いりません。ゲストのままでも、ログインしたときと同じ機能を使えます。あとから Apple か Google でログインしても、記録は引き継がれます。"
      },
      {
        "question": "思い出は、ほかの人に見られますか？",
        "answer": "共有を選んだ思い出だけが「みんなのレポート」に出ます。共有するかは1件ずつ選べて、写真はほかの人には見えません。"
      },
      {
        "question": "対応している端末と言語を教えてください。",
        "answer": "iOS {minimumIOSVersion} 以降の iPhone で使えます。言語は、日本語・英語・韓国語・中国語（簡体字・繁体字）に対応しています。"
      }
    ]
  },
  "start": {
    "headline": "次の申込から、\n記録してみてください。",
    "lead": "Oshi Life は無料でダウンロードできます。iOS {minimumIOSVersion} 以降の iPhone に対応しています。",
    "cta": "App Store で見る"
  },
  "footer": {
    "linksLabel": "サイトの情報",
    "terms": "利用規約",
    "privacy": "プライバシーポリシー",
    "contact": "お問い合わせ",
    "copyright": "© {copyrightYear} Shoya Matsubara"
  }
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `node --test tests/unit/content.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 5: 文の自己点検**

`copywriting` スキルの「No AI Tells」と `natural-japanese` スキルの観点で、ja.json を1文ずつ読む。直したら Step 4 を流し直す。
点検すること: 言い換えの決め台詞・三連の羅列が1節に2つ以上・体言止めの連発・20字を超える文の読みにくさ・事実（設計書 6 節）を越えた主張・アプリの画面の呼び名（「撮って記録」「記録」（＋）「表示モード」「当落ボード」「みんなのレポート」「参戦のしおり」）との食い違い。

- [ ] **Step 6: コミットする**

```bash
git add _src/content/ja.json tests/helpers/content.mjs tests/unit/content.test.mjs
git commit -m "feat: LP の日本語の文と、文の検査（参照・数字・言い回し）を足す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 描画（部品・節・ヘッダーとフッター・head・ページ）

**Files:**
- Create: `_src/lib/videos.json`、`_src/lib/media.mjs`、`_src/lib/context.mjs`、`_src/lib/components.mjs`、`_src/lib/sections.mjs`、`_src/lib/layout.mjs`、`_src/lib/head.mjs`、`_src/lib/page.mjs`
- Test: `tests/unit/render.test.mjs`

**Interfaces:**
- Consumes: `createTextLookup`・`renderPhrases`（Task 2）、`LOCALES`・`findLocale`・`pageHref`・`rootPrefix`・`absolutePageUrl`・`SITE_URL`・`CONTACT_FORM_URL`・`DEFAULT_LOCALE_CODE`（Task 2）、`escapeHtml`（Task 2）、`SCREEN_IMAGE`・`APP_ICON`・`OG_IMAGE`・`screenPath`・`badgePath`・`ogImagePath`（Task 3）、`_src/content/ja.json`（Task 4）
- Produces:
  - `MEDIA_SLOTS`（`hero`・`color`。各 `{ theme: 'light'|'dark', loading: 'eager'|'lazy', screens: string[], video: null | { src, poster, width, height } }`）
  - `createPageContext({ locale, locales, content, badge })` → `{ locale, locales, badge, t, assetPrefix }`
  - `renderMediaSlot(context, slotName, slot = MEDIA_SLOTS[slotName]): string`
  - `SECTION_IDS = ['top','snap','color','schedule','money','oshi','more','plans','faq','start']`、`renderMain(context)`
  - `renderHeader(context)`・`renderFooter(context)`・`renderHead(context)`・`renderPage(context): string`（末尾に改行）
  - CSS が使うクラス名（Task 7 が同じ名前で書く）: `site-header` `site-header__inner` `site-header__cta` `wordmark` `wordmark__oshi` `wordmark__life` `language-menu` `language-menu__icon` `button` `button--small` `button--large` `skip-link` `section` `section__inner` `section__inner--split` `section--reverse` `section--dark` `section__text` `section__media` `section__title` `section__lead` `section__note` `section__caption` `eyebrow` `hero` `hero__title` `hero__lead` `hero__actions` `hero__note` `hero__requirements` `app-store-badge` `media-slot` `media-slot--light` `media-slot--dark` `media-slot__video` `media-slot__still` `media-slot__toggle` `phone` `points` `points--grid` `point` `point__title` `point__tag` `callout` `timeline` `timeline__step` `timeline__title` `plans` `plan` `plan--free` `plan--premium` `plan__header` `plan__name` `plan__body` `plan__summary` `plan__note` `limits` `checklist` `faq` `faq__item` `faq__answer` `start` `start__icon` `start__title` `start__lead` `site-footer` `site-footer__inner` `site-footer__copyright` `visually-hidden` `phrase`

- [ ] **Step 1: 描画の単体テストを書く**

`tests/unit/render.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCALES, SITE_URL, findLocale } from '../../_src/lib/locales.mjs';
import { FACTS } from '../../_src/lib/facts.mjs';
import { createPageContext } from '../../_src/lib/context.mjs';
import { renderPage } from '../../_src/lib/page.mjs';
import { SECTION_IDS } from '../../_src/lib/sections.mjs';
import { renderMediaSlot } from '../../_src/lib/components.mjs';

const content = JSON.parse(readFileSync(new URL('../../_src/content/ja.json', import.meta.url), 'utf8'));
const BADGE = Object.freeze({ width: 109, height: 40 });
const VIDEO = Object.freeze({ src: 'assets/video/hero.mp4', poster: 'assets/video/hero-poster.webp', width: 1080, height: 1080 });

function createContext(code, locales = LOCALES) {
  return createPageContext({ locale: findLocale(code), locales, content, badge: BADGE });
}

function render(code, locales = LOCALES) {
  return renderPage(createContext(code, locales));
}

test('節を決めた順と id で並べる', () => {
  const ids = [...render('ja').matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, SECTION_IDS);
});

test('html の lang はその言語のコード', () => {
  assert.match(render('en'), /<html lang="en">/);
});

test('hreflang は作る言語すべてと x-default を、絶対 URL で指す', () => {
  const alternates = [...render('ko').matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(alternates, [...LOCALES.map((locale) => [locale.code, SITE_URL + locale.directory]), ['x-default', SITE_URL]]);
});

test('作らない言語は、hreflang にも言語の切り替えにも出さない', () => {
  const html = render('ja', [findLocale('ja')]);
  assert.doesNotMatch(html, /hreflang="en"/);
  assert.doesNotMatch(html, />English</);
});

test('直下のページと言語のフォルダのページで、素材への相対パスが変わる', () => {
  assert.match(render('ja'), /href="assets\/site\.css"/);
  assert.match(render('en'), /href="\.\.\/assets\/site\.css"/);
  assert.match(render('zh-Hant'), /src="\.\.\/assets\/img\/zh-Hant\/home-light\.webp"/);
});

test('App Store へのリンクは、日本語のページだけ日本のストア', () => {
  assert.match(render('ja'), /href="https:\/\/apps\.apple\.com\/jp\/app\/oshi-life\/id6780718555"/);
  assert.doesNotMatch(render('en'), /apps\.apple\.com\/jp\//);
});

test('App Store のバッジは1ページに1つだけ', () => {
  assert.equal(render('ja').match(/class="app-store-badge"/g).length, 1);
});

test('規約とプライバシーポリシーは、その言語のページを指す', () => {
  assert.match(render('ja'), /href="ja\/terms\.html"/);
  assert.match(render('ko'), /href="\.\.\/ko\/privacy\.html"/);
});

test('数値を埋め、参照の記号を残さない', () => {
  const html = render('ja');
  assert.doesNotMatch(html, /\{[A-Za-z][\w.]*\}/);
  assert.match(html, new RegExp(`月${FACTS.free.scansPerMonth}回`));
});

test('動画が無いあいだは、動画の枠に各言語の画面を置く', () => {
  const html = render('ja');
  assert.doesNotMatch(html, /<video/);
  assert.match(html, /<figure class="media-slot media-slot--light">/);
});

test('動画があるときは、動画・静止画・一時停止のボタンを置き、最初の画面の動画だけ自動で再生する', () => {
  const context = createContext('ja');
  const eager = renderMediaSlot(context, 'hero', { theme: 'light', loading: 'eager', screens: ['home-light'], video: VIDEO });
  assert.match(eager, /<figure class="media-slot media-slot--light" data-media="autoplay">/);
  assert.match(eager, /<video [^>]*muted loop playsinline autoplay preload="auto"/);
  assert.match(eager, /<img class="media-slot__still" src="assets\/video\/hero-poster\.webp" alt=""/);
  assert.match(eager, /<button class="media-slot__toggle" type="button" hidden/);
  const lazy = renderMediaSlot(context, 'color', { theme: 'dark', loading: 'lazy', screens: ['home-mint', 'home-dark'], video: VIDEO });
  assert.match(lazy, /data-media="lazy"/);
  assert.match(lazy, /preload="none"/);
  assert.doesNotMatch(lazy, /autoplay/);
});

test('よくある質問は1問目だけ開いておく', () => {
  assert.equal(render('ja').match(/<details class="faq__item" open>/g).length, 1);
});
```

- [ ] **Step 2: テストが落ちることを確かめる**

Run: `node --test tests/unit/render.test.mjs`
Expected: FAIL（`Cannot find module '.../_src/lib/context.mjs'`）

- [ ] **Step 3: 動画の枠の設定と、ページの材料を書く**

`_src/lib/videos.json`（動画を差し込むまでは空。Task 12 の `encode-video.mjs` が書く）:

```json
{}
```

`_src/lib/media.mjs`:

```js
// 動画の枠（ヒーローと推しの色の節）に何を置くか。動画が届くまでは各言語のアプリの画面を置く（設計書 9 節）。
import VIDEOS from './videos.json' with { type: 'json' };

/**
 * theme: 枠の地の色（動画の地の色と同じにする）。
 * loading: 'eager' は最初の画面にあって自動で再生する。'lazy' は画面に入ってから再生する。
 * screens: 動画が無いあいだに置く画面。video: videos.json にあれば { src, poster, width, height }、無ければ null。
 */
export const MEDIA_SLOTS = Object.freeze({
  hero: Object.freeze({ theme: 'light', loading: 'eager', screens: Object.freeze(['home-light']), video: VIDEOS.hero ?? null }),
  color: Object.freeze({ theme: 'dark', loading: 'lazy', screens: Object.freeze(['home-mint', 'home-dark']), video: VIDEOS.color ?? null }),
});
```

`_src/lib/context.mjs`:

```js
import { createTextLookup } from './text.mjs';
import { rootPrefix } from './locales.mjs';

/**
 * 1ページを描くための材料。
 * locale: その言語。locales: このビルドで作る言語（hreflang と言語の切り替えに使う）。badge: その言語のバッジの寸法。
 */
export function createPageContext({ locale, locales, content, badge }) {
  return Object.freeze({ locale, locales, badge, t: createTextLookup(content), assetPrefix: rootPrefix(locale) });
}
```

- [ ] **Step 4: 部品を書く**

`_src/lib/components.mjs`:

```js
// ページの部品。t(...) はエスケープ済みの文を返すので、そのまま HTML に入れる。
import { MEDIA_SLOTS } from './media.mjs';
import { APP_ICON, SCREEN_IMAGE, badgePath, screenPath } from './assets.mjs';
import { renderPhrases } from './text.mjs';

/** アプリの画面を、端末の形の枠に入れる。alt はエスケープ済みの文。 */
export function renderPhone(context, screen, alt, { isLazy = true } = {}) {
  const loading = isLazy ? ' loading="lazy"' : '';
  return `<div class="phone"><img src="${context.assetPrefix}${screenPath(context.locale.code, screen)}" alt="${alt}" width="${SCREEN_IMAGE.width}" height="${SCREEN_IMAGE.height}" decoding="async"${loading}></div>`;
}

/** 動画の枠。動画が無ければ画面を並べ、あれば動画・動きを減らす人向けの静止画・一時停止のボタンを置く。 */
export function renderMediaSlot(context, slotName, slot = MEDIA_SLOTS[slotName]) {
  const { t, assetPrefix } = context;
  const isEager = slot.loading === 'eager';
  const className = `media-slot media-slot--${slot.theme}`;
  if (slot.video === null) {
    const phones = slot.screens.map((screen, index) => renderPhone(context, screen, t(`${slotName}.media.screens.${index}`), { isLazy: !isEager }));
    return `<figure class="${className}">${phones.join('')}</figure>`;
  }
  const { video } = slot;
  const playback = isEager ? ' autoplay preload="auto"' : ' preload="none"';
  return [
    `<figure class="${className}" data-media="${isEager ? 'autoplay' : 'lazy'}">`,
    `<video class="media-slot__video" src="${assetPrefix}${video.src}" poster="${assetPrefix}${video.poster}" width="${video.width}" height="${video.height}" muted loop playsinline${playback} aria-hidden="true"></video>`,
    `<img class="media-slot__still" src="${assetPrefix}${video.poster}" alt="" width="${video.width}" height="${video.height}" loading="lazy" decoding="async">`,
    `<figcaption class="visually-hidden">${t(`${slotName}.media.description`)}</figcaption>`,
    `<button class="media-slot__toggle" type="button" hidden data-label-pause="${t('media.pause')}" data-label-play="${t('media.play')}" aria-label="${t('media.pause')}"></button>`,
    '</figure>',
  ].join('\n');
}

/** Apple の App Store バッジ。1ページに1つだけ（ヒーロー）。 */
export function renderBadge(context) {
  const { t, locale, badge, assetPrefix } = context;
  return `<a class="app-store-badge" href="${locale.appStoreUrl}"><img src="${assetPrefix}${badgePath(locale.code)}" alt="${t('nav.appStoreBadgeAlt')}" width="${badge.width}" height="${badge.height}"></a>`;
}

/** 要点の一覧。要素に tag があれば札（Premium など）を付ける。 */
export function renderPoints(context, listPath, { isGrid = false } = {}) {
  const { t } = context;
  const items = t.list(listPath).map((_point, index) => {
    const itemPath = `${listPath}.${index}`;
    const tag = t.has(`${itemPath}.tag`) ? ` <span class="point__tag">${t(`${itemPath}.tag`)}</span>` : '';
    return `<li class="point"><h3 class="point__title">${t(`${itemPath}.title`)}${tag}</h3><p>${t(`${itemPath}.body`)}</p></li>`;
  });
  return `<ul class="points${isGrid ? ' points--grid' : ''}">\n${items.join('\n')}\n</ul>`;
}

/** 節の見出し（小見出し・見出し・リード）。 */
export function renderSectionHeading(context, contentKey, headingId) {
  const { t } = context;
  return [
    `<p class="eyebrow">${t(`${contentKey}.eyebrow`)}</p>`,
    `<h2 id="${headingId}" class="section__title">${renderPhrases(t(`${contentKey}.headline`))}</h2>`,
    `<p class="section__lead">${t(`${contentKey}.lead`)}</p>`,
  ].join('\n');
}

/** 節の横に置く画面と、その説明。 */
export function renderScreenFigure(context, contentKey, screen) {
  const { t } = context;
  return `<figure class="section__media">${renderPhone(context, screen, t(`${contentKey}.imageAlt`))}<figcaption class="section__caption">${t(`${contentKey}.caption`)}</figcaption></figure>`;
}

/** アプリのアイコン（飾り。読み上げない）。 */
export function renderAppIcon(context) {
  return `<img class="start__icon" src="${context.assetPrefix}${APP_ICON.file}" alt="" width="${APP_ICON.size}" height="${APP_ICON.size}" loading="lazy" decoding="async">`;
}
```

- [ ] **Step 5: 本文の節を書く**

`_src/lib/sections.mjs`:

```js
// 本文の10の節。並びと id は言語で変えない（設計書 4 節）。
import { renderPhrases } from './text.mjs';
import {
  renderAppIcon, renderBadge, renderMediaSlot, renderPoints, renderScreenFigure, renderSectionHeading,
} from './components.mjs';

export const SECTION_IDS = Object.freeze(['top', 'snap', 'color', 'schedule', 'money', 'oshi', 'more', 'plans', 'faq', 'start']);

/** よくある質問のうち、初めから開いておく1問。 */
const INITIALLY_OPEN_QUESTION_INDEX = 0;

function wrapSection(id, { sectionClass = '', innerClass = '' }, body) {
  const sectionClasses = ['section', sectionClass].filter(Boolean).join(' ');
  const innerClasses = ['section__inner', innerClass].filter(Boolean).join(' ');
  return `<section id="${id}" class="${sectionClasses}" aria-labelledby="${id}-title">\n<div class="${innerClasses}">\n${body}\n</div>\n</section>`;
}

function renderTextColumn(...parts) {
  return ['<div class="section__text">', ...parts, '</div>'].join('\n');
}

export function renderHero(context) {
  const { t } = context;
  const text = renderTextColumn(
    `<p class="eyebrow">${t('hero.eyebrow')}</p>`,
    `<h1 id="top-title" class="hero__title">${renderPhrases(t('hero.headline'))}</h1>`,
    `<p class="hero__lead">${t('hero.lead')}</p>`,
    `<div class="hero__actions">${renderBadge(context)}</div>`,
    `<p class="hero__note">${t('hero.note')}</p>`,
    `<p class="hero__requirements">${t('hero.requirements')}</p>`,
  );
  const media = `<div class="section__media">${renderMediaSlot(context, 'hero')}</div>`;
  return wrapSection('top', { sectionClass: 'hero', innerClass: 'section__inner--split' }, `${text}\n${media}`);
}

export function renderSnap(context) {
  const { t } = context;
  const text = renderTextColumn(
    renderSectionHeading(context, 'snap', 'snap-title'),
    renderPoints(context, 'snap.points'),
    `<p class="callout">${t('snap.privacy')}</p>`,
    `<p class="section__note">${t('snap.quota')}</p>`,
  );
  return wrapSection('snap', { innerClass: 'section__inner--split' }, `${text}\n${renderScreenFigure(context, 'snap', 'record')}`);
}

export function renderColor(context) {
  const text = renderTextColumn(renderSectionHeading(context, 'color', 'color-title'), renderPoints(context, 'color.points'));
  const media = `<div class="section__media">${renderMediaSlot(context, 'color')}</div>`;
  return wrapSection('color', { sectionClass: 'section--dark section--reverse', innerClass: 'section__inner--split' }, `${text}\n${media}`);
}

export function renderSchedule(context) {
  const { t } = context;
  const steps = t.list('schedule.timeline').map((_step, index) => (
    `<li class="timeline__step"><h3 class="timeline__title">${t(`schedule.timeline.${index}.title`)}</h3><p>${t(`schedule.timeline.${index}.body`)}</p></li>`
  ));
  const text = renderTextColumn(
    renderSectionHeading(context, 'schedule', 'schedule-title'),
    `<ol class="timeline" aria-label="${t('schedule.timelineLabel')}">\n${steps.join('\n')}\n</ol>`,
    renderPoints(context, 'schedule.points'),
  );
  return wrapSection('schedule', { innerClass: 'section__inner--split' }, `${text}\n${renderScreenFigure(context, 'schedule', 'schedule')}`);
}

export function renderMoney(context) {
  const text = renderTextColumn(renderSectionHeading(context, 'money', 'money-title'), renderPoints(context, 'money.points'));
  return wrapSection('money', { sectionClass: 'section--reverse', innerClass: 'section__inner--split' }, `${text}\n${renderScreenFigure(context, 'money', 'money')}`);
}

export function renderOshi(context) {
  const text = renderTextColumn(renderSectionHeading(context, 'oshi', 'oshi-title'), renderPoints(context, 'oshi.points'));
  return wrapSection('oshi', { innerClass: 'section__inner--split' }, `${text}\n${renderScreenFigure(context, 'oshi', 'oshi')}`);
}

export function renderMore(context) {
  const text = renderTextColumn(renderSectionHeading(context, 'more', 'more-title'));
  return wrapSection('more', {}, `${text}\n${renderPoints(context, 'more.points', { isGrid: true })}`);
}

export function renderPlans(context) {
  const { t } = context;
  const limitRows = t.list('plans.limits').map((_limit, index) => (
    `<tr><th scope="row">${t(`plans.limits.${index}.label`)}</th><td>${t(`plans.limits.${index}.value`)}</td></tr>`
  ));
  const premiumItems = t.list('plans.premiumItems').map((_item, index) => `<li>${t(`plans.premiumItems.${index}`)}</li>`);
  const freePlan = [
    '<article class="plan plan--free" aria-labelledby="plan-free-title">',
    `<div class="plan__header"><h3 id="plan-free-title" class="plan__name">${t('plans.free.name')}</h3></div>`,
    '<div class="plan__body">',
    `<p class="plan__summary">${t('plans.free.summary')}</p>`,
    `<table class="limits"><caption>${t('plans.free.limitsCaption')}</caption><tbody>\n${limitRows.join('\n')}\n</tbody></table>`,
    `<p class="plan__note">${t('plans.free.note')}</p>`,
    '</div>',
    '</article>',
  ].join('\n');
  const premiumPlan = [
    '<article class="plan plan--premium" aria-labelledby="plan-premium-title">',
    `<div class="plan__header"><h3 id="plan-premium-title" class="plan__name">${t('plans.premium.name')}</h3></div>`,
    '<div class="plan__body">',
    `<p class="plan__summary">${t('plans.premium.summary')}</p>`,
    `<ul class="checklist">\n${premiumItems.join('\n')}\n</ul>`,
    `<p class="plan__note">${t('plans.premium.note')}</p>`,
    '</div>',
    '</article>',
  ].join('\n');
  const text = renderTextColumn(renderSectionHeading(context, 'plans', 'plans-title'));
  return wrapSection('plans', {}, `${text}\n<div class="plans">\n${freePlan}\n${premiumPlan}\n</div>`);
}

export function renderFaq(context) {
  const { t } = context;
  const items = t.list('faq.items').map((_item, index) => {
    const openAttribute = index === INITIALLY_OPEN_QUESTION_INDEX ? ' open' : '';
    return `<details class="faq__item"${openAttribute}><summary>${t(`faq.items.${index}.question`)}</summary><div class="faq__answer"><p>${t(`faq.items.${index}.answer`)}</p></div></details>`;
  });
  const text = renderTextColumn(renderSectionHeading(context, 'faq', 'faq-title'));
  return wrapSection('faq', {}, `${text}\n<div class="faq">\n${items.join('\n')}\n</div>`);
}

export function renderStart(context) {
  const { t, locale } = context;
  return wrapSection('start', { sectionClass: 'start' }, [
    renderAppIcon(context),
    `<h2 id="start-title" class="start__title">${renderPhrases(t('start.headline'))}</h2>`,
    `<p class="start__lead">${t('start.lead')}</p>`,
    `<a class="button button--large" href="${locale.appStoreUrl}">${t('start.cta')}</a>`,
  ].join('\n'));
}

const SECTION_RENDERERS = Object.freeze({
  top: renderHero,
  snap: renderSnap,
  color: renderColor,
  schedule: renderSchedule,
  money: renderMoney,
  oshi: renderOshi,
  more: renderMore,
  plans: renderPlans,
  faq: renderFaq,
  start: renderStart,
});

export function renderMain(context) {
  return SECTION_IDS.map((id) => SECTION_RENDERERS[id](context)).join('\n');
}
```

- [ ] **Step 6: ヘッダー・フッター・head・ページを書く**

`_src/lib/layout.mjs`:

```js
// ヘッダー（ワードマーク・言語の切り替え・App Store の文字のボタン）とフッター。
import { escapeHtml } from './escape.mjs';
import { CONTACT_FORM_URL, pageHref, rootPrefix } from './locales.mjs';

const GLOBE_ICON = '<svg class="language-menu__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

function renderLanguageLinks(context) {
  return context.locales.map((target) => {
    const currentAttribute = target.code === context.locale.code ? ' aria-current="page"' : '';
    return `<li><a href="${pageHref(context.locale, target)}" hreflang="${target.code}" lang="${target.code}"${currentAttribute}>${escapeHtml(target.label)}</a></li>`;
  }).join('');
}

export function renderHeader(context) {
  const { t, locale } = context;
  return [
    '<header class="site-header">',
    '<div class="site-header__inner">',
    `<a class="wordmark" href="${pageHref(locale, locale)}" aria-label="Oshi Life"><span class="wordmark__oshi" aria-hidden="true">Oshi </span><span class="wordmark__life" aria-hidden="true">Life</span></a>`,
    `<details class="language-menu"><summary>${GLOBE_ICON}<span class="visually-hidden">${t('nav.languageLabel')}</span><span lang="${locale.code}">${escapeHtml(locale.label)}</span></summary><ul>${renderLanguageLinks(context)}</ul></details>`,
    `<a class="button button--small site-header__cta" href="${locale.appStoreUrl}">${t('nav.appStore')}</a>`,
    '</div>',
    '</header>',
  ].join('\n');
}

export function renderFooter(context) {
  const { t, locale } = context;
  const legalBase = rootPrefix(locale) + locale.legalDirectory;
  return [
    '<footer class="site-footer">',
    '<div class="site-footer__inner">',
    `<nav aria-label="${t('nav.languageLabel')}"><ul>${renderLanguageLinks(context)}</ul></nav>`,
    `<nav aria-label="${t('footer.linksLabel')}"><ul><li><a href="${legalBase}terms.html">${t('footer.terms')}</a></li><li><a href="${legalBase}privacy.html">${t('footer.privacy')}</a></li><li><a href="${CONTACT_FORM_URL}" rel="noopener" target="_blank">${t('footer.contact')}</a></li></ul></nav>`,
    `<p class="site-footer__copyright">${t('footer.copyright')}</p>`,
    '</div>',
    '</footer>',
  ].join('\n');
}
```

`_src/lib/head.mjs`:

```js
// <head>: 題・説明・canonical・hreflang・OG・アイコン・CSS と JS。
import { DEFAULT_LOCALE_CODE, SITE_URL, absolutePageUrl, findLocale } from './locales.mjs';
import { APP_ICON, OG_IMAGE, ogImagePath } from './assets.mjs';

/** ブラウザの枠の色（アプリの画面の地の色 NeutralPalette.screen と同じ）。 */
const THEME_COLOR = '#FBF6F8';

export function renderHead(context) {
  const { t, locale, locales, assetPrefix } = context;
  const alternates = locales.map((target) => `<link rel="alternate" hreflang="${target.code}" href="${absolutePageUrl(target)}">`);
  if (locales.some((target) => target.code === DEFAULT_LOCALE_CODE)) {
    alternates.push(`<link rel="alternate" hreflang="x-default" href="${absolutePageUrl(findLocale(DEFAULT_LOCALE_CODE))}">`);
  }
  const ogLocaleAlternates = locales
    .filter((target) => target.code !== locale.code)
    .map((target) => `<meta property="og:locale:alternate" content="${target.ogLocale}">`);
  return [
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${t('meta.title')}</title>`,
    `<meta name="description" content="${t('meta.description')}">`,
    `<link rel="canonical" href="${absolutePageUrl(locale)}">`,
    ...alternates,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Oshi Life">',
    `<meta property="og:title" content="${t('meta.ogTitle')}">`,
    `<meta property="og:description" content="${t('meta.description')}">`,
    `<meta property="og:url" content="${absolutePageUrl(locale)}">`,
    `<meta property="og:image" content="${SITE_URL}${ogImagePath(locale.code)}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:image:alt" content="${t('meta.ogImageAlt')}">`,
    `<meta property="og:locale" content="${locale.ogLocale}">`,
    ...ogLocaleAlternates,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="theme-color" content="${THEME_COLOR}">`,
    `<link rel="icon" type="image/png" href="${assetPrefix}${APP_ICON.file}">`,
    `<link rel="apple-touch-icon" href="${assetPrefix}${APP_ICON.file}">`,
    `<link rel="stylesheet" href="${assetPrefix}assets/site.css">`,
    `<script src="${assetPrefix}assets/site.js" defer></script>`,
    '</head>',
  ].join('\n');
}
```

`_src/lib/page.mjs`:

```js
import { renderHead } from './head.mjs';
import { renderFooter, renderHeader } from './layout.mjs';
import { renderMain } from './sections.mjs';

/** 1ページ全体の HTML（末尾に改行）。 */
export function renderPage(context) {
  const { t, locale } = context;
  return [
    '<!doctype html>',
    `<html lang="${locale.code}">`,
    renderHead(context),
    '<body>',
    `<a class="skip-link" href="#main">${t('nav.skipToContent')}</a>`,
    renderHeader(context),
    '<main id="main">',
    renderMain(context),
    '</main>',
    renderFooter(context),
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
```

- [ ] **Step 7: テストが通ることを確かめる**

Run: `node --test tests/unit/render.test.mjs`
Expected: PASS（12 tests）

- [ ] **Step 8: verify を通してコミットする**

Run: `./Scripts/verify.sh`
Expected: 終了コード 0

```bash
git add _src/lib tests/unit/render.test.mjs
git commit -m "feat: LP の描画（部品・節・ヘッダーとフッター・head）を作る

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 生成（build.mjs）と日本語のページ・静的検査・フェーズ1

**Files:**
- Create: `_src/build.mjs`、`assets/site.css`（`:root` の値だけ。Task 7 で全体を書く）、`assets/site.js`（説明のコメントだけ。Task 8 で動きを書く）、`tests/site/html-text.mjs`、`tests/site/pages.test.mjs`
- Modify: `index.html`（旧 LP を、生成した日本語のページで置き換える）、`Scripts/verify.sh`（フェーズ1を足す）

**Interfaces:**
- Consumes: Task 2〜5 のすべて
- Produces: `renderAllPages(): Promise<{ file: string, html: string }[]>`（`_src/build.mjs`）、`node _src/build.mjs [--check]`、`extractUserFacingText(html): string`（`tests/site/html-text.mjs`）

- [ ] **Step 1: 生成したページの静的検査を書く**

`tests/site/html-text.mjs`:

```js
// 生成した HTML から、読み手の目と耳に届く文（本文と、alt・aria-label・title・content・ボタンの読み上げの属性）を取り出す。
const USER_FACING_ATTRIBUTE_PATTERN = /\s(?:alt|aria-label|title|content|data-label-pause|data-label-play)="([^"]*)"/g;
const ENTITY_PATTERN = /&(?:amp|lt|gt|quot|#39);/g;
const ENTITIES = Object.freeze({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" });

export function extractUserFacingText(html) {
  const withoutCode = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ');
  const attributeTexts = [...withoutCode.matchAll(USER_FACING_ATTRIBUTE_PATTERN)].map((match) => match[1]);
  const bodyText = withoutCode.replace(/<[^>]+>/g, ' ');
  return [...attributeTexts, bodyText].join(' ').replace(ENTITY_PATTERN, (entity) => ENTITIES[entity]).replace(/\s+/g, ' ').trim();
}
```

`tests/site/pages.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { DEFAULT_LOCALE_CODE, LOCALES, absolutePageUrl, rootPrefix } from '../../_src/lib/locales.mjs';
import { SECTION_IDS } from '../../_src/lib/sections.mjs';
import { extractUserFacingText } from './html-text.mjs';

const EXTERNAL_REFERENCE_PATTERN = /^(?:https?:|mailto:)/;
const KANA_PATTERN = /[぀-ヿ]+/g;
const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

test('日本語のページが生成されている', () => {
  assert.ok(generatedLocales.some((locale) => locale.code === DEFAULT_LOCALE_CODE));
});

for (const locale of generatedLocales) {
  const pageFile = path.join(REPOSITORY_ROOT, locale.directory, 'index.html');
  const html = readFileSync(pageFile, 'utf8');

  test(`${locale.code}: lang・canonical・節の並び`, () => {
    assert.match(html, new RegExp(`<html lang="${locale.code}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${absolutePageUrl(locale)}">`));
    assert.deepEqual([...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]), SECTION_IDS);
  });

  test(`${locale.code}: hreflang は生成したすべての言語と x-default を指す`, () => {
    const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(hreflangs, [...generatedLocales.map((target) => target.code), 'x-default']);
  });

  test(`${locale.code}: ページの中の参照先がすべてある`, () => {
    const references = [...html.matchAll(/\s(?:src|href|poster)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((reference) => !EXTERNAL_REFERENCE_PATTERN.test(reference));
    for (const reference of references) {
      if (reference.startsWith('#')) {
        assert.ok(html.includes(` id="${reference.slice(1)}"`), reference);
        continue;
      }
      const target = path.resolve(path.dirname(pageFile), reference);
      const file = reference.endsWith('/') ? path.join(target, 'index.html') : target;
      assert.ok(existsSync(file), `${reference} が見つからない`);
    }
  });

  test(`${locale.code}: 画像にはすべて alt がある`, () => {
    for (const tag of html.match(/<img\b[^>]*>/g) ?? []) assert.match(tag, /\salt="/, tag);
  });

  test(`${locale.code}: 外から読み込むものが無い`, () => {
    assert.doesNotMatch(html, /<(?:script|img|video|source|iframe)\b[^>]*\ssrc="https?:/);
    assert.doesNotMatch(html, /<link\b[^>]*\srel="(?:stylesheet|icon|apple-touch-icon|preload)"[^>]*\shref="https?:/);
  });

  test(`${locale.code}: App Store のバッジは1つで、App Store へのリンクはその言語の URL だけ`, () => {
    assert.equal(html.match(/class="app-store-badge"/g)?.length, 1);
    const storeLinks = [...html.matchAll(/href="(https:\/\/apps\.apple\.com\/[^"]+)"/g)].map((match) => match[1]);
    assert.ok(storeLinks.length > 0);
    assert.deepEqual([...new Set(storeLinks)], [locale.appStoreUrl]);
  });

  test(`${locale.code}: 規約とプライバシーポリシーは、その言語のページを指す`, () => {
    const legalBase = rootPrefix(locale) + locale.legalDirectory;
    assert.ok(html.includes(`href="${legalBase}terms.html"`));
    assert.ok(html.includes(`href="${legalBase}privacy.html"`));
  });

  test(`${locale.code}: 参照の記号が残っていない`, () => {
    assert.doesNotMatch(html, /\{[A-Za-z][\w.]*\}/);
  });

  if (locale.code !== DEFAULT_LOCALE_CODE) {
    test(`${locale.code}: 読み手に見える文に、かなが残っていない`, () => {
      assert.deepEqual(extractUserFacingText(html).match(KANA_PATTERN) ?? [], []);
    });
  }
}
```

- [ ] **Step 2: 検査が落ちることを確かめる**

Run: `node --test tests/site/pages.test.mjs`
Expected: FAIL（今の `index.html` は旧 LP なので、`lang・canonical・節の並び` などが落ちる）

- [ ] **Step 3: 生成のスクリプトを書く**

`_src/build.mjs`:

```js
// 5言語のページを _src から生成する。--check のときは書き込まず、コミットされた HTML と同じかだけを確かめる（verify のフェーズ1）。
// 文の無い言語はまだ作らない（hreflang と言語の切り替えにも出さない）。日本語の文は必ず要る。
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LOCALE_CODE, LOCALES } from './lib/locales.mjs';
import { findShapeDifferences } from './lib/content.mjs';
import { createPageContext } from './lib/context.mjs';
import { renderPage } from './lib/page.mjs';
import { readSvgSize } from './lib/image-size.mjs';
import { badgePath } from './lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const CONTENT_DIRECTORY = path.join(REPOSITORY_ROOT, '_src', 'content');

async function loadContents() {
  const contents = new Map();
  for (const locale of LOCALES) {
    const file = path.join(CONTENT_DIRECTORY, `${locale.code}.json`);
    if (existsSync(file)) contents.set(locale.code, JSON.parse(await readFile(file, 'utf8')));
  }
  if (!contents.has(DEFAULT_LOCALE_CODE)) throw new Error(`日本語の文（_src/content/${DEFAULT_LOCALE_CODE}.json）がありません`);
  return contents;
}

function assertSameShape(contents) {
  const reference = contents.get(DEFAULT_LOCALE_CODE);
  for (const [code, content] of contents) {
    const { missing, extra } = findShapeDifferences(reference, content);
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(`${code}.json の形が ${DEFAULT_LOCALE_CODE}.json と違います。足りない: ${missing.join(', ') || 'なし'}／余分: ${extra.join(', ') || 'なし'}`);
    }
  }
}

export async function renderAllPages() {
  const contents = await loadContents();
  assertSameShape(contents);
  const locales = LOCALES.filter((locale) => contents.has(locale.code));
  const pages = [];
  for (const locale of locales) {
    const badge = readSvgSize(await readFile(path.join(REPOSITORY_ROOT, badgePath(locale.code)), 'utf8'));
    const context = createPageContext({ locale, locales, content: contents.get(locale.code), badge });
    pages.push({ file: path.join(REPOSITORY_ROOT, locale.directory, 'index.html'), html: renderPage(context) });
  }
  return pages;
}

async function findStalePages(pages) {
  const stale = [];
  for (const page of pages) {
    const current = existsSync(page.file) ? await readFile(page.file, 'utf8') : null;
    if (current !== page.html) stale.push(path.relative(REPOSITORY_ROOT, page.file));
  }
  return stale;
}

async function main() {
  const isCheckOnly = process.argv.includes('--check');
  const pages = await renderAllPages();
  if (isCheckOnly) {
    const stale = await findStalePages(pages);
    if (stale.length > 0) {
      console.error(`生成し直しが要るページ: ${stale.join(', ')}（npm run build を実行する）`);
      process.exitCode = 1;
      return;
    }
    console.log(`生成済みのページは最新です（${pages.length} ページ）`);
    return;
  }
  for (const page of pages) {
    await mkdir(path.dirname(page.file), { recursive: true });
    await writeFile(page.file, page.html);
  }
  console.log(`${pages.length} ページを生成しました`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 4: CSS と JS の入れ物を作る**

ページが参照する2つのファイルを先に置く（中身は Task 7 と Task 8 で書く）。

`assets/site.css`:

```css
/* Oshi Life の LP の見た目。全体は Task 7 で書く。 */
:root {
  --color-screen: #FBF6F8;
  --color-text: #2E2534;
}

body {
  margin: 0;
  background: var(--color-screen);
  color: var(--color-text);
}
```

`assets/site.js`:

```js
// 動画の枠（data-media）の制御。動きは Task 8 で書く。
```

- [ ] **Step 5: 生成して、検査が通ることを確かめる**

Run: `node _src/build.mjs && node --test tests/site/pages.test.mjs`
Expected: 「1 ページを生成しました」、PASS（9 tests）。旧 LP の `index.html` は生成したページで置き換わる。

Run: `node _src/build.mjs --check`
Expected: 「生成済みのページは最新です（1 ページ）」、終了コード 0。

- [ ] **Step 6: verify にフェーズ1を足す**

`Scripts/verify.sh` を次の内容にする:

```bash
#!/usr/bin/env bash
# Oshi Life の LP の検証。終了コードが完了判定（必須のフェーズがすべて 0 なら完了）。
set -euo pipefail
cd "$(dirname "$0")/.."

# node --test に渡すテストのファイルを、指定したフォルダから集める（無いフォルダは飛ばす）。
collect_tests() {
  find "$@" -name '*.test.mjs' -type f 2>/dev/null | sort
}

echo "== フェーズ1: 生成した HTML が _src と一致しているか"
node _src/build.mjs --check

echo "== フェーズ2: 静的検査と単体テスト"
# shellcheck disable=SC2046
node --test $(collect_tests tests/unit tests/site tests/i18n)

echo "verify: 必須のフェーズはすべて通過"
```

Run: `./Scripts/verify.sh`
Expected: 終了コード 0

- [ ] **Step 7: コミットする**

```bash
git add _src/build.mjs assets/site.css assets/site.js index.html tests/site/html-text.mjs tests/site/pages.test.mjs Scripts/verify.sh
git commit -m "feat: 日本語の LP を生成して、旧 LP の index.html を置き換える

旧 LP は main に残っている（公開中のサイトは main のまま変わらない）。

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 見た目（site.css）と描画の検査（フェーズ3）

**Files:**
- Modify: `assets/site.css`（全体を書く）、`Scripts/verify.sh`（フェーズ3を足す）
- Create: `tests/render/contrast.mjs`、`tests/render/pages.test.mjs`

**Interfaces:**
- Consumes: Task 5 のクラス名、Task 6 の生成したページ
- Produces: `CONTRAST_THRESHOLDS`、`inspectPage(thresholds)`（ブラウザの中で動く。戻り値 `{ horizontalOverflow, brokenImages, lowContrastTexts, manualChecks }`）。撮った画像 `_tmp/shots/<言語>-{mobile,desktop}-{fold,full}.png`

- [ ] **Step 1: 描画の検査を書く**

`tests/render/contrast.mjs`:

```js
// ページの中で動かす検査（page.evaluate に渡す）。inspectPage はモジュールの外の名前を使わないこと
// （関数の本体だけがブラウザに送られる）。

/** WCAG 2.2 の文字のコントラストの基準。 */
export const CONTRAST_THRESHOLDS = Object.freeze({
  normalTextRatio: 4.5,
  largeTextRatio: 3,
  largeTextSize: 24,
  largeBoldTextSize: 18.66,
  boldWeight: 700,
});

export function inspectPage(thresholds) {
  const RED_WEIGHT = 0.2126;
  const GREEN_WEIGHT = 0.7152;
  const BLUE_WEIGHT = 0.0722;
  const CHANNEL_MAXIMUM = 255;
  const LINEAR_THRESHOLD = 0.03928;
  const LINEAR_DIVISOR = 12.92;
  const GAMMA_OFFSET = 0.055;
  const GAMMA_DIVISOR = 1.055;
  const GAMMA_EXPONENT = 2.4;
  const LUMINANCE_OFFSET = 0.05;
  const DESCRIPTION_LENGTH = 24;
  const OPAQUE = 1;
  const WHITE = { red: CHANNEL_MAXIMUM, green: CHANNEL_MAXIMUM, blue: CHANNEL_MAXIMUM, alpha: OPAQUE };

  const parseColor = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [red, green, blue, alpha = OPAQUE] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { red, green, blue, alpha };
  };
  const toLinear = (channel) => {
    const value = channel / CHANNEL_MAXIMUM;
    return value <= LINEAR_THRESHOLD ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA_EXPONENT;
  };
  const luminance = (color) => RED_WEIGHT * toLinear(color.red) + GREEN_WEIGHT * toLinear(color.green) + BLUE_WEIGHT * toLinear(color.blue);
  const composite = (top, bottom) => ({
    red: top.red * top.alpha + bottom.red * (OPAQUE - top.alpha),
    green: top.green * top.alpha + bottom.green * (OPAQUE - top.alpha),
    blue: top.blue * top.alpha + bottom.blue * (OPAQUE - top.alpha),
    alpha: OPAQUE,
  });
  const contrastRatio = (first, second) => {
    const [lighter, darker] = [luminance(first), luminance(second)].sort((left, right) => right - left);
    return (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET);
  };
  const describe = (element) => `<${element.tagName.toLowerCase()} class="${element.className}">「${element.textContent.trim().slice(0, DESCRIPTION_LENGTH)}」`;

  /** 文字の後ろの色を、親をたどって重ねて求める。画像やグラデーションに当たったら null（自動では決めない）。 */
  const resolveBackground = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') return null;
      const color = parseColor(style.backgroundColor);
      if (color && color.alpha > 0) {
        layers.push(color);
        if (color.alpha >= OPAQUE) break;
      }
    }
    return layers.reverse().reduce((bottom, top) => composite(top, bottom), WHITE);
  };

  const lowContrastTexts = [];
  const manualChecks = [];
  const checkedElements = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!node.textContent.trim() || checkedElements.has(element)) continue;
    checkedElements.add(element);
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (style.visibility === 'hidden' || box.width === 0 || box.height === 0 || element.closest('.visually-hidden')) continue;
    if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') {
      manualChecks.push(describe(element));
      continue;
    }
    const foreground = parseColor(style.color);
    const background = resolveBackground(element);
    if (!foreground || !background) {
      manualChecks.push(describe(element));
      continue;
    }
    const fontSize = parseFloat(style.fontSize);
    const isBold = Number(style.fontWeight) >= thresholds.boldWeight;
    const isLargeText = fontSize >= thresholds.largeTextSize || (isBold && fontSize >= thresholds.largeBoldTextSize);
    const minimumRatio = isLargeText ? thresholds.largeTextRatio : thresholds.normalTextRatio;
    const ratio = contrastRatio(composite(foreground, background), background);
    if (ratio < minimumRatio) lowContrastTexts.push(`${describe(element)} ${ratio.toFixed(2)}:1（${minimumRatio}:1 以上が要る）`);
  }
  const brokenImages = [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
  return {
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    brokenImages,
    lowContrastTexts,
    manualChecks,
  };
}
```

`tests/render/pages.test.mjs`:

```js
// verify のフェーズ3。生成したページを 390px と 1280px で描き、はみ出し・読み込みの失敗・文字のコントラストを確かめる。
// 撮った画像は _tmp/shots/ に残す（目で見て確かめるため）。当落の流れはスクロールで現れるので、撮影は「動きを減らす」設定で行う
// （動画の枠の動きは media.test.mjs が見る）。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { CONTRAST_THRESHOLDS, inspectPage } from './contrast.mjs';

const SHOTS_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'shots');
const VIEWPORTS = Object.freeze([
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 1 },
]);
const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

let browser;
before(async () => {
  browser = await chromium.launch();
  await mkdir(SHOTS_DIRECTORY, { recursive: true });
});
after(async () => {
  await browser?.close();
});

for (const locale of generatedLocales) {
  for (const viewport of VIEWPORTS) {
    test(`${locale.code} @ ${viewport.width}px: はみ出し・読み込み・コントラスト`, async (context) => {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
        reducedMotion: 'reduce',
      });
      const problems = [];
      page.on('pageerror', (error) => problems.push(`スクリプトの例外: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
      });
      page.on('requestfailed', (request) => problems.push(`読み込みの失敗: ${request.url()}`));
      try {
        await page.goto(pathToFileURL(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')).href);
        await page.evaluate(() => {
          for (const image of document.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
        });
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => undefined))));
        const result = await page.evaluate(inspectPage, CONTRAST_THRESHOLDS);
        const shotPrefix = path.join(SHOTS_DIRECTORY, `${locale.code}-${viewport.name}`);
        await page.screenshot({ path: `${shotPrefix}-fold.png` });
        await page.screenshot({ path: `${shotPrefix}-full.png`, fullPage: true });
        for (const item of result.manualChecks) context.diagnostic(`目で確かめる: ${item}`);
        assert.equal(result.horizontalOverflow, 0, `横に ${result.horizontalOverflow}px はみ出している`);
        assert.deepEqual(result.brokenImages, [], '表示できない画像');
        assert.deepEqual(result.lowContrastTexts, [], 'コントラストの足りない文字');
        assert.deepEqual(problems, []);
      } finally {
        await page.close();
      }
    });
  }
}
```

- [ ] **Step 2: 今の（ほぼ素の）CSS で流して、検査が動くことを確かめる**

Run: `node --test tests/render/pages.test.mjs`
Expected: 2 tests が実行される（結果は PASS でも FAIL でもよい。検査が動き、`_tmp/shots/ja-mobile-fold.png` ができること）。

- [ ] **Step 3: site.css の全体を書く**

`.media-slot` の縦横比（下の `aspect-ratio: 1 / 1`）は、ユーザーから Motion の書き出しの比率を聞いたら、その比率に合わせる（聞く前は 1:1）。

`assets/site.css` を次の内容にする:

```css
/* Oshi Life の LP の見た目。色はアプリのコードの値（設計書 8 節）。値を足すときは :root の名前つきの変数にする。 */

:root {
  --color-screen: #FBF6F8;
  --color-surface: #FFFFFF;
  --color-tint: #FBEAF0;
  --color-line: #EADFE6;
  --color-text: #2E2534;
  --color-text-secondary: #5F5368;
  --color-text-tertiary: #746982;
  --color-accent-text: #A23F66;
  --color-brand: #E86B8F;
  --color-on-ink: #FFFFFF;
  --color-on-gradient: #FFFFFF;
  --color-dark-screen: #141116;
  --color-dark-surface: #1E1A21;
  --color-dark-raised: #28232C;
  --color-dark-text: #F4EEF6;
  --color-dark-text-secondary: #C9BFD0;
  --color-dark-accent-text: #F08FAD;
  --color-header-glass: rgba(251, 246, 248, 0.92);
  --color-shadow: rgba(46, 37, 52, 0.10);
  --color-shadow-strong: rgba(46, 37, 52, 0.20);
  --gradient-brand-readable: linear-gradient(135deg, #B15C73 0%, #BA5673 50%, #7A69C6 100%);
  --gradient-wordmark: linear-gradient(135deg, #E8568E 0%, #8E5BD0 100%);
  --font-body: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif;
  --font-rounded: ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", var(--font-body);
  --content-width: 1120px;
  --text-width: 36rem;
  --radius-card: 20px;
  --radius-panel: 28px;
  --radius-phone: 34px;
  --phone-border: 7px;
  --phone-aspect-ratio: 640 / 1391;
  --shadow-card: 0 12px 32px var(--color-shadow);
  --shadow-phone: 0 24px 60px var(--color-shadow-strong);
  --space-section: clamp(72px, 10vw, 128px);
  --space-gutter: clamp(20px, 5vw, 40px);
  --header-height: 64px;
  --touch-target: 44px;
  --badge-height: 48px;
}

html:lang(en) {
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

html:lang(ko) {
  --font-body: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

html:lang(zh-Hans) {
  --font-body: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
}

html:lang(zh-Hant) {
  --font-body: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
  scroll-padding-top: var(--header-height);
}

body {
  margin: 0;
  background: var(--color-screen);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

img,
video {
  display: block;
  max-width: 100%;
  height: auto;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1,
h2,
h3 {
  line-height: 1.3;
  text-wrap: balance;
}

a {
  color: var(--color-accent-text);
  text-underline-offset: 0.2em;
}

:focus-visible {
  outline: 3px solid var(--color-text);
  outline-offset: 3px;
  border-radius: 6px;
}

.phrase {
  display: inline-block;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  top: -64px;
  left: 12px;
  z-index: 30;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--color-text);
  color: var(--color-on-ink);
  font-weight: 700;
  text-decoration: none;
}

.skip-link:focus {
  top: 12px;
}

/* ヘッダー */

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-header-glass);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: var(--content-width);
  min-height: var(--header-height);
  margin: 0 auto;
  padding: 0 var(--space-gutter);
}

.wordmark {
  margin-right: auto;
  color: var(--color-text);
  font-family: var(--font-rounded);
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.wordmark__life {
  background: var(--gradient-wordmark);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.language-menu {
  position: relative;
}

.language-menu summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--touch-target);
  padding: 0 12px;
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
  list-style: none;
  cursor: pointer;
}

.language-menu summary::-webkit-details-marker {
  display: none;
}

.language-menu summary:hover,
.language-menu[open] summary {
  background: var(--color-tint);
  color: var(--color-text);
}

.language-menu ul {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 11rem;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--color-line);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  list-style: none;
}

.language-menu a {
  display: block;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--color-text);
  text-decoration: none;
}

.language-menu a:hover {
  background: var(--color-tint);
}

.language-menu a[aria-current="page"] {
  color: var(--color-accent-text);
  font-weight: 700;
}

/* ボタン */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: 0 22px;
  border-radius: 999px;
  background: var(--color-text);
  color: var(--color-on-ink);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.button:hover {
  background: var(--color-accent-text);
}

.button--small {
  padding: 0 16px;
  font-size: 0.875rem;
}

.button--large {
  min-height: 56px;
  padding: 0 32px;
  font-size: 1.0625rem;
}

/* 節の共通の形 */

.section {
  padding: var(--space-section) var(--space-gutter);
}

.section__inner {
  display: grid;
  align-items: center;
  gap: clamp(40px, 6vw, 72px);
  max-width: var(--content-width);
  margin: 0 auto;
}

.section__text {
  max-width: var(--text-width);
}

.section__media {
  min-width: 0;
  margin: 0;
}

@media (min-width: 880px) {
  .section__inner--split {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
  }

  .section--reverse .section__inner--split {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  }

  .section--reverse .section__media {
    order: -1;
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-accent-text);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.eyebrow::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand);
}

.section__title {
  font-size: clamp(1.75rem, 1.15rem + 2.4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.01em;
}

.section__lead {
  margin-top: 20px;
  color: var(--color-text-secondary);
  font-size: 1.0625rem;
}

.section__note {
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.section__caption {
  margin-top: 20px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

/* 暗い節（推しの色とダークモード） */

.section--dark {
  background: var(--color-dark-screen);
  color: var(--color-dark-text);
}

.section--dark :focus-visible {
  outline-color: var(--color-dark-text);
}

.section--dark .eyebrow {
  color: var(--color-dark-accent-text);
}

.section--dark .section__lead,
.section--dark .point p {
  color: var(--color-dark-text-secondary);
}

.section--dark .point {
  border-color: var(--color-dark-raised);
  background: var(--color-dark-surface);
}

.section--dark .point__tag {
  background: var(--color-dark-raised);
  color: var(--color-dark-accent-text);
}

/* ヒーロー */

.hero {
  padding-top: clamp(40px, 8vw, 96px);
}

.hero__title {
  font-size: clamp(2.25rem, 1.3rem + 4.2vw, 3.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.hero__lead {
  margin-top: 24px;
  color: var(--color-text-secondary);
  font-size: 1.125rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

/* Apple の決まり: 高さは 40px 以上、まわりにバッジの高さの 1/4 の余白。 */
.app-store-badge {
  display: inline-block;
  padding: calc(var(--badge-height) / 4) 0;
}

.app-store-badge img {
  width: auto;
  height: var(--badge-height);
}

.hero__note {
  margin-top: 8px;
  padding: 14px 18px;
  border: 1px solid var(--color-line);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.hero__requirements {
  margin-top: 12px;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

/* 動画の枠と、端末の形の枠 */

.media-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 3vw, 24px);
  width: 100%;
  max-width: 560px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  padding: clamp(16px, 5vw, 40px);
  border-radius: var(--radius-panel);
}

.media-slot:has(video) {
  padding: 0;
  overflow: hidden;
}

.media-slot--light {
  background: var(--color-screen);
}

.media-slot--dark {
  background: var(--color-dark-screen);
}

.media-slot .phone {
  width: auto;
  height: 100%;
  aspect-ratio: var(--phone-aspect-ratio);
}

.media-slot .phone img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-slot__video,
.media-slot__still {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-slot__still {
  display: none;
}

.media-slot__toggle {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: grid;
  place-items: center;
  width: var(--touch-target);
  height: var(--touch-target);
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.media-slot__toggle[hidden] {
  display: none;
}

/* 再生中は一時停止の印（縦線2本）、止まっているときは再生の印（三角）。 */
.media-slot__toggle::before {
  content: "";
  width: 12px;
  height: 14px;
  border-inline: 4px solid currentColor;
}

.media-slot__toggle[data-state="paused"]::before {
  width: 14px;
  height: 16px;
  border: 0;
  background: currentColor;
  clip-path: polygon(15% 0, 100% 50%, 15% 100%);
}

.phone {
  overflow: hidden;
  border: var(--phone-border) solid var(--color-dark-surface);
  border-radius: var(--radius-phone);
  background: var(--color-dark-surface);
  box-shadow: var(--shadow-phone);
}

.phone img {
  width: 100%;
  height: auto;
}

.section__media > .phone {
  width: min(72vw, 300px);
  margin: 0 auto;
}

/* 要点の一覧 */

.points {
  display: grid;
  gap: 14px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .points--grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1000px) {
  .points--grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.point {
  padding: 20px 22px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.point__title {
  font-size: 1.0625rem;
  font-weight: 700;
}

.point__tag {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-tint);
  color: var(--color-accent-text);
  font-size: 0.75rem;
  font-weight: 700;
  vertical-align: 0.15em;
}

.point p {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.callout {
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--color-tint);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 700;
}

/* 当落の流れ（画面に入ると順に現れる。動きを減らす設定と、対応しないブラウザでは初めから全部見せる） */

.timeline {
  display: grid;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: timeline-step;
}

.timeline__step {
  position: relative;
  padding: 0 0 24px 48px;
  counter-increment: timeline-step;
}

.timeline__step::before {
  content: counter(timeline-step);
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-on-ink);
  font-size: 0.875rem;
  font-weight: 700;
}

.timeline__step::after {
  content: "";
  position: absolute;
  top: 34px;
  bottom: 4px;
  left: 14px;
  width: 2px;
  background: var(--color-line);
}

.timeline__step:last-child {
  padding-bottom: 0;
}

.timeline__step:last-child::after {
  display: none;
}

.timeline__title {
  font-size: 1rem;
  font-weight: 700;
}

.timeline__step p {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

@keyframes timeline-reveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .timeline__step {
      animation: timeline-reveal linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }
}

/* Free と Premium */

.plans {
  display: grid;
  gap: 24px;
  margin-top: 40px;
}

@media (min-width: 880px) {
  .plans {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

.plan {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
}

.plan__header {
  padding: 22px 28px;
  border-bottom: 1px solid var(--color-line);
}

/* グラデーションの上の白い文字は 24px 以上の太字だけ（設計書 8 節）。 */
.plan--premium .plan__header {
  border-bottom: 0;
  background: var(--gradient-brand-readable);
  color: var(--color-on-gradient);
}

.plan__name {
  font-size: 1.75rem;
  font-weight: 800;
}

.plan__body {
  padding: 24px 28px 28px;
}

.plan__summary {
  font-weight: 700;
}

.plan__note {
  margin-top: 20px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.limits {
  width: 100%;
  margin-top: 16px;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.limits caption {
  margin-bottom: 6px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
  text-align: left;
}

.limits th,
.limits td {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
  font-weight: 400;
  text-align: left;
}

.limits td {
  padding-left: 12px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.checklist {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.checklist li {
  position: relative;
  padding-left: 28px;
}

.checklist li::before {
  content: "";
  position: absolute;
  top: 0.6em;
  left: 3px;
  width: 13px;
  height: 7px;
  border-bottom: 2.5px solid var(--color-brand);
  border-left: 2.5px solid var(--color-brand);
  transform: rotate(-45deg);
}

/* よくある質問 */

.faq {
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin-top: 32px;
}

.faq__item {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.faq__item summary {
  position: relative;
  padding: 18px 56px 18px 22px;
  font-weight: 700;
  list-style: none;
  cursor: pointer;
}

.faq__item summary::-webkit-details-marker {
  display: none;
}

.faq__item summary::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 24px;
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--color-text-secondary);
  border-bottom: 2px solid var(--color-text-secondary);
  transform: translateY(-70%) rotate(45deg);
}

.faq__item[open] summary::after {
  transform: translateY(-30%) rotate(-135deg);
}

.faq__answer {
  padding: 0 22px 20px;
  color: var(--color-text-secondary);
}

/* 最後の CTA */

.start .section__inner {
  justify-items: center;
  gap: 20px;
  text-align: center;
}

.start__icon {
  width: 88px;
  height: 88px;
  border-radius: 20px;
  box-shadow: var(--shadow-card);
}

.start__title {
  font-size: clamp(1.75rem, 1.15rem + 2.6vw, 2.75rem);
  font-weight: 800;
}

.start__lead {
  max-width: var(--text-width);
  color: var(--color-text-secondary);
}

/* フッター */

.site-footer {
  padding: 48px var(--space-gutter) 56px;
  border-top: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.site-footer__inner {
  display: grid;
  gap: 20px;
  max-width: var(--content-width);
  margin: 0 auto;
}

.site-footer ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-footer a {
  color: var(--color-text-secondary);
}

.site-footer a[aria-current="page"] {
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

/* 動きを減らす設定 */

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .media-slot__video {
    display: none;
  }

  .media-slot__still {
    display: block;
  }
}
```

- [ ] **Step 4: 検査を流して直す**

Run: `node --test tests/render/pages.test.mjs`
Expected: PASS（2 tests）。`# 目で確かめる:` にワードマークの「Life」と Premium の札の見出しが出る（グラデーションの上なので自動では測らない）。
落ちたら、出た要素と比を見て site.css の色か大きさを直す（色はアプリの値の組み合わせで選び直す。値を増やすなら `:root` に名前を付けて足す）。

- [ ] **Step 5: 撮った画像を目で見る**

Read で次を開く: `_tmp/shots/ja-mobile-fold.png`、`_tmp/shots/ja-mobile-full.png`、`_tmp/shots/ja-desktop-fold.png`、`_tmp/shots/ja-desktop-full.png`。
確かめること: ヘッダーが1行に収まる／見出しが語の途中で折れていない／バッジの高さと余白／画面の画像が切れていない（動画の枠の中の端末）／暗い節の文字が読める／要点・表・FAQ の並び／1280px で左右の並びが交互になっている／フッターのリンク。
直す所があれば site.css を直し、Step 4 からやり直す。最後に、直した所と見た画像を `_tmp/visual-review.md` に書き残す（コミットしない）。

- [ ] **Step 6: verify にフェーズ3を足す**

`Scripts/verify.sh` の「フェーズ2」の後ろ（`echo "verify: ...` の前）に足す:

```bash
echo "== フェーズ3: 5言語 × 390px・1280px の描画（撮った画像は _tmp/shots/）"
# shellcheck disable=SC2046
node --test --test-concurrency=1 $(collect_tests tests/render)
```

Run: `./Scripts/verify.sh`
Expected: 終了コード 0

- [ ] **Step 7: コミットする**

**実装で変えたこと（2026-10-26 の目視から）:** site.css は上の内容から3か所を直した（ヒーローの文の列を `1.15fr` にして見出しの最大を `3.5rem` に／PC 幅では文の長い節の画面の画像を上にそろえて `position: sticky` に／1列の節の `gap` を 0 に）。
`_src/lib/text.mjs` に、製品名と機能名（`App Store`・`Oshi Life`・`Face ID`・`Touch ID`・`Dynamic Island`）の空白を `&nbsp;` にする処理と、そのテスト（`tests/unit/core.test.mjs`）を足した。

```bash
git add assets/site.css tests/render Scripts/verify.sh
git commit -m "feat: LP の見た目と、描画の検査（はみ出し・読み込み・コントラスト）を足す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 動画の枠の動き（site.js）

**Files:**
- Modify: `assets/site.js`
- Create: `tests/render/media.test.mjs`

**Interfaces:**
- Consumes: `renderMediaSlot`（Task 5。`data-media="autoplay|lazy"`・`.media-slot__video`・`.media-slot__toggle[hidden][data-label-pause][data-label-play]`）、`createPageContext`（Task 5）
- Produces: `assets/site.js` の動き: 一時停止のボタンを出す（`hidden` を外す）／押すと止める・再開する（`data-state="playing|paused"` と `aria-label` を切り替える）／`data-media="lazy"` は枠が 25% 見えたら再生し、外れたら止める／動きを減らす設定では止めてボタンを隠す

- [ ] **Step 1: 動きの検査を書く**

`tests/render/media.test.mjs`:

```js
// 動画の枠の動き（site.js）を、テスト用の動画（VP9 の WebM。Playwright の Chromium で再生できる）で確かめる。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { findLocale } from '../../_src/lib/locales.mjs';
import { createPageContext } from '../../_src/lib/context.mjs';
import { renderMediaSlot } from '../../_src/lib/components.mjs';

const FIXTURE_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'fixtures');
const FIXTURE_PAGE = path.join(FIXTURE_DIRECTORY, 'media.html');
const VIDEO_SIZE = 320;
const VIDEO_SECONDS = 2;
const PLAYBACK_TIMEOUT_MILLISECONDS = 5000;
const SPACER_HEIGHT = 3000;
const VIDEO = Object.freeze({ src: 'slot.webm', poster: 'slot-poster.png', width: VIDEO_SIZE, height: VIDEO_SIZE });

function writeFixture() {
  mkdirSync(FIXTURE_DIRECTORY, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `testsrc=size=${VIDEO_SIZE}x${VIDEO_SIZE}:duration=${VIDEO_SECONDS}`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', path.join(FIXTURE_DIRECTORY, VIDEO.src)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(FIXTURE_DIRECTORY, VIDEO.src), '-frames:v', '1', path.join(FIXTURE_DIRECTORY, VIDEO.poster)]);
  const content = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'content', 'ja.json'), 'utf8'));
  const context = createPageContext({ locale: findLocale('ja'), locales: [findLocale('ja')], content, badge: { width: 1, height: 1 } });
  const eager = renderMediaSlot(context, 'hero', { theme: 'light', loading: 'eager', screens: ['home-light'], video: VIDEO });
  const lazy = renderMediaSlot(context, 'color', { theme: 'dark', loading: 'lazy', screens: ['home-mint', 'home-dark'], video: VIDEO });
  writeFileSync(FIXTURE_PAGE, `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="../../assets/site.css"><script src="../../assets/site.js" defer></script></head>
<body><div id="eager">${eager}</div><div style="height: ${SPACER_HEIGHT}px"></div><div id="lazy">${lazy}</div></body></html>`);
}

const isPlaying = (selector) => {
  const video = document.querySelector(`${selector} video`);
  return Boolean(video) && !video.paused;
};

/** ボタンの表示が切り替わるのを待つ（play と pause のイベントは少し遅れて届くので、すぐには読まない）。 */
function waitForToggleState(page, selector, state) {
  return page.waitForFunction(
    ([slotSelector, expectedState]) => document.querySelector(`${slotSelector} .media-slot__toggle`)?.dataset.state === expectedState,
    [selector, state],
    { timeout: PLAYBACK_TIMEOUT_MILLISECONDS },
  );
}

let browser;
before(async () => {
  writeFixture();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('最初の画面の動画は自動で再生し、ボタンで止めて再開できる', async () => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForFunction(isPlaying, '#eager', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  const toggle = page.locator('#eager .media-slot__toggle');
  await assert.doesNotReject(toggle.waitFor({ state: 'visible', timeout: PLAYBACK_TIMEOUT_MILLISECONDS }));
  await waitForToggleState(page, '#eager', 'playing');
  await toggle.click();
  await waitForToggleState(page, '#eager', 'paused');
  assert.equal(await page.evaluate(() => document.querySelector('#eager video').paused), true);
  assert.equal(await toggle.getAttribute('aria-label'), await toggle.getAttribute('data-label-play'));
  await toggle.click();
  await waitForToggleState(page, '#eager', 'playing');
  assert.equal(await toggle.getAttribute('aria-label'), await toggle.getAttribute('data-label-pause'));
  await page.close();
});

test('画面の外の動画は、画面に入るまで再生しない', async () => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForFunction(isPlaying, '#eager', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  assert.equal(await page.evaluate(() => document.querySelector('#lazy video').paused), true);
  await page.locator('#lazy .media-slot').scrollIntoViewIfNeeded();
  await page.waitForFunction(isPlaying, '#lazy', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  await page.close();
});

test('動きを減らす設定では、動画を隠して静止画を出し、ボタンも出さない', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForLoadState('load');
  const state = await page.evaluate(() => {
    const slot = document.querySelector('#eager .media-slot');
    return {
      videoDisplay: getComputedStyle(slot.querySelector('video')).display,
      stillDisplay: getComputedStyle(slot.querySelector('.media-slot__still')).display,
      isToggleHidden: slot.querySelector('.media-slot__toggle').hidden,
      isVideoPaused: slot.querySelector('video').paused,
    };
  });
  assert.deepEqual(state, { videoDisplay: 'none', stillDisplay: 'block', isToggleHidden: true, isVideoPaused: true });
  await page.close();
});
```

- [ ] **Step 2: 検査が落ちることを確かめる**

Run: `node --test --test-concurrency=1 tests/render/media.test.mjs`
Expected: 1つ目と2つ目が FAIL（1つ目はボタンが `hidden` のまま見えず `waitFor` が時間切れ、2つ目は画面に入っても再生されない）。3つ目は CSS だけで動画が隠れ、ブラウザが見えない動画を止めることがあるので、この時点で通ってもよい。

- [ ] **Step 3: site.js を書く**

`assets/site.js` を次の内容にする:

```js
// 動画の枠（data-media）の制御だけを受け持つ: 一時停止のボタン、画面に入ったときの再生、動きを減らす設定への対応。
// JavaScript が無くてもページは読める（最初の画面の動画は autoplay で動き、ほかの動画は静止画のまま）。
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
/** 枠がこの割合だけ見えたら、画面に入ったとみなす。 */
const VISIBLE_RATIO = 0.25;

function setUpMediaSlot(slot) {
  const video = slot.querySelector('video');
  const toggle = slot.querySelector('.media-slot__toggle');
  if (!video || !toggle) return;
  const isLazy = slot.dataset.media === 'lazy';
  let isPausedByUser = false;
  let isInView = !isLazy;

  const updateToggle = () => {
    const isPlaying = !video.paused;
    toggle.dataset.state = isPlaying ? 'playing' : 'paused';
    toggle.setAttribute('aria-label', isPlaying ? toggle.dataset.labelPause : toggle.dataset.labelPlay);
  };

  const playIfAllowed = () => {
    if (reducedMotionQuery.matches || isPausedByUser || !isInView) return;
    video.play().catch(updateToggle);
  };

  const applyMotionPreference = () => {
    toggle.hidden = reducedMotionQuery.matches;
    if (reducedMotionQuery.matches) {
      video.pause();
    } else {
      playIfAllowed();
    }
  };

  video.addEventListener('play', updateToggle);
  video.addEventListener('pause', updateToggle);
  toggle.addEventListener('click', () => {
    if (video.paused) {
      isPausedByUser = false;
      isInView = true;
      playIfAllowed();
    } else {
      isPausedByUser = true;
      video.pause();
    }
  });
  reducedMotionQuery.addEventListener('change', applyMotionPreference);

  if (isLazy) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isInView = entry.isIntersecting;
        if (isInView) {
          playIfAllowed();
        } else {
          video.pause();
        }
      }
    }, { threshold: VISIBLE_RATIO });
    observer.observe(slot);
  }

  applyMotionPreference();
  updateToggle();
}

document.querySelectorAll('[data-media]').forEach(setUpMediaSlot);
```

- [ ] **Step 4: 検査が通ることを確かめる**

Run: `node --test --test-concurrency=1 tests/render/media.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 5: verify を通してコミットする**

Run: `./Scripts/verify.sh`
Expected: 終了コード 0（フェーズ3に media.test.mjs も入る）

```bash
git add assets/site.js tests/render/media.test.mjs
git commit -m "feat: 動画の枠の一時停止と、画面に入ったときの再生を足す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 共有用の画像（OG）

**Files:**
- Create: `_src/og/render-og.mjs`、`assets/og/ja.jpg`（生成物）、`tests/site/og.test.mjs`

**Interfaces:**
- Consumes: `OG_IMAGE`・`ogImagePath`・`screenPath`（Task 3）、`createTextLookup`・`renderPhrases`（Task 2）、`readJpegSize`（Task 2）、`assets/site.css` のワードマークと端末の枠（Task 7）
- Produces: `node _src/og/render-og.mjs`（文のある言語ぶん `assets/og/<言語>.jpg` を描く）

- [ ] **Step 1: 検査を書く**

`tests/site/og.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES, SITE_URL } from '../../_src/lib/locales.mjs';
import { BYTE_BUDGETS, OG_IMAGE, ogImagePath } from '../../_src/lib/assets.mjs';
import { readJpegSize } from '../../_src/lib/image-size.mjs';

const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

for (const locale of generatedLocales) {
  test(`${locale.code}: 共有用の画像があり、寸法と重さが決まりどおりで、ページが指している`, () => {
    const buffer = readFileSync(path.join(REPOSITORY_ROOT, ogImagePath(locale.code)));
    assert.deepEqual(readJpegSize(buffer), { width: OG_IMAGE.width, height: OG_IMAGE.height });
    assert.ok(buffer.length <= BYTE_BUDGETS.ogImage, `${buffer.length} バイト`);
    const html = readFileSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html'), 'utf8');
    assert.ok(html.includes(`<meta property="og:image" content="${SITE_URL}${ogImagePath(locale.code)}">`));
  });
}
```

- [ ] **Step 2: 検査が落ちることを確かめる**

Run: `node --test tests/site/og.test.mjs`
Expected: FAIL（`ENOENT ... assets/og/ja.jpg`）

- [ ] **Step 3: 描くスクリプトを書く**

`_src/og/render-og.mjs`:

```js
// 言語ごとの共有用の画像（1200×630 の JPEG）を、ひな形の HTML から Playwright で描いて assets/og/ に置く。
// ひな形はサイトの CSS（ワードマークと端末の枠）を使う。文のある言語だけ描く。
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { LOCALES } from '../lib/locales.mjs';
import { OG_IMAGE, ogImagePath, screenPath } from '../lib/assets.mjs';
import { createTextLookup, renderPhrases } from '../lib/text.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const WORK_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'og');
/** _tmp/og/ からサイトの直下へ戻る相対パス。 */
const ROOT_FROM_WORK_DIRECTORY = '../../';
const JPEG_QUALITY = 85;
const PHONE_WIDTH = 300;
const HORIZONTAL_PADDING = 88;
const COLUMN_GAP = 56;
const PHONE_TOP = 64;
const WORDMARK_SIZE = 44;
const TITLE_SIZE = 66;

function renderOgHtml(locale, t) {
  return `<!doctype html>
<html lang="${locale.code}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${ROOT_FROM_WORK_DIRECTORY}assets/site.css">
<style>
  body { width: ${OG_IMAGE.width}px; height: ${OG_IMAGE.height}px; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) ${PHONE_WIDTH}px; align-items: center; gap: ${COLUMN_GAP}px; padding: 0 ${HORIZONTAL_PADDING}px; }
  .og__wordmark { display: inline-block; margin-bottom: 28px; font-size: ${WORDMARK_SIZE}px; }
  .og__title { font-size: ${TITLE_SIZE}px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
  .og__phone { align-self: start; width: ${PHONE_WIDTH}px; margin-top: ${PHONE_TOP}px; }
</style>
</head>
<body>
<div>
<span class="wordmark og__wordmark"><span class="wordmark__oshi">Oshi </span><span class="wordmark__life">Life</span></span>
<h1 class="og__title">${renderPhrases(t('hero.headline'))}</h1>
</div>
<div class="phone og__phone"><img src="${ROOT_FROM_WORK_DIRECTORY}${screenPath(locale.code, 'home-light')}" alt=""></div>
</body>
</html>`;
}

await mkdir(WORK_DIRECTORY, { recursive: true });
const browser = await chromium.launch();
try {
  for (const locale of LOCALES) {
    const contentFile = path.join(REPOSITORY_ROOT, '_src', 'content', `${locale.code}.json`);
    if (!existsSync(contentFile)) continue;
    const t = createTextLookup(JSON.parse(await readFile(contentFile, 'utf8')));
    const htmlFile = path.join(WORK_DIRECTORY, `${locale.code}.html`);
    await writeFile(htmlFile, renderOgHtml(locale, t));
    const page = await browser.newPage({ viewport: { width: OG_IMAGE.width, height: OG_IMAGE.height } });
    await page.goto(pathToFileURL(htmlFile).href);
    await page.waitForLoadState('networkidle');
    const output = path.join(REPOSITORY_ROOT, ogImagePath(locale.code));
    await mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, type: 'jpeg', quality: JPEG_QUALITY });
    await page.close();
    console.log(path.relative(REPOSITORY_ROOT, output));
  }
} finally {
  await browser.close();
}
```

- [ ] **Step 4: 描いて、検査が通ることを確かめ、目で見る**

Run: `node _src/og/render-og.mjs && node --test tests/site/og.test.mjs`
Expected: `assets/og/ja.jpg` と出て、PASS（1 test）。

Read で `assets/og/ja.jpg` を開く。確かめること: ワードマークと見出しが左に読める大きさで入り、右に端末の上半分が見える／見出しが語の途中で折れていない／文字が切れていない。直すときは `render-og.mjs` の名前つきの値を変えて Step 4 をやり直す。

- [ ] **Step 5: verify を通してコミットする**

Run: `./Scripts/verify.sh`
Expected: 終了コード 0

```bash
git add _src/og assets/og tests/site/og.test.mjs
git commit -m "feat: LP の共有用の画像（OG）を描く

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 4言語の訳（英語・韓国語・中国語の簡体字と繁体字）

**Files:**
- Create: `_src/i18n/extract-glossary.mjs`、`_src/i18n/glossary.json`（生成物）、`_src/content/en.json`、`_src/content/ko.json`、`_src/content/zh-Hans.json`、`_src/content/zh-Hant.json`、`tests/i18n/glossary.test.mjs`
- Modify（生成物）: `index.html`、`en/index.html`・`ko/index.html`・`zh-Hans/index.html`・`zh-Hant/index.html`（新規）、`assets/og/{en,ko,zh-Hans,zh-Hant}.jpg`（新規）

**Interfaces:**
- Consumes: `ja.json`（Task 4）、`readContent`・`collectStrings`（Task 4 の `tests/helpers/content.mjs`）、`build.mjs`（Task 6）、`render-og.mjs`（Task 9）
- Produces: `glossary.json`（`{ source, terms: [{ ja, isStrict, translations: { en, ko, 'zh-Hans', 'zh-Hant' } }] }`）

- [ ] **Step 1: アプリの訳語表を作るスクリプトを書いて、表を作る**

`_src/i18n/extract-glossary.mjs`:

```js
// アプリの文言の表（Localizable.xcstrings）から、LP が使う画面の呼び名の訳を引いて _src/i18n/glossary.json に書く。
// isStrict の語は、日本語の文に出てくる所では、訳でも必ずアプリと同じ訳を使う（tests/i18n/glossary.test.mjs が見る）。
// 使い方: node _src/i18n/extract-glossary.mjs ~/Documents/GitHub/OshiLife
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_FILE = fileURLToPath(new URL('./glossary.json', import.meta.url));
const TRANSLATED_LOCALE_CODES = Object.freeze(['en', 'ko', 'zh-Hans', 'zh-Hant']);
const CATALOG_PATHS = Object.freeze({ app: 'OshiLife/Localizable.xcstrings', widget: 'widget/Localizable.xcstrings' });

const TERMS = Object.freeze([
  { ja: '撮って記録', catalog: 'app', isStrict: true },
  { ja: 'みんなのレポート', catalog: 'app', isStrict: true },
  { ja: '当落ボード', catalog: 'app', isStrict: true },
  { ja: '参戦のしおり', catalog: 'app', isStrict: true },
  { ja: '表示モード', catalog: 'app', isStrict: true },
  { ja: '支出にも記録する', catalog: 'app', isStrict: true },
  { ja: '推し活の振り返り', catalog: 'app', isStrict: true },
  { ja: '申込締切', catalog: 'app', isStrict: true },
  { ja: '入金期限', catalog: 'app', isStrict: true },
  { ja: '申込中', catalog: 'app', isStrict: true },
  { ja: '当落待ち', catalog: 'app', isStrict: true },
  { ja: '入金待ち', catalog: 'app', isStrict: true },
  { ja: '参戦準備OK', catalog: 'app', isStrict: true },
  { ja: 'カウントダウン', catalog: 'widget', isStrict: true },
  { ja: '今月の推し活費', catalog: 'widget', isStrict: true },
  { ja: '当落発表', catalog: 'app', isStrict: false },
  { ja: '落選', catalog: 'app', isStrict: false },
  { ja: 'ホーム', catalog: 'app', isStrict: false },
  { ja: '予定', catalog: 'app', isStrict: false },
  { ja: '記録', catalog: 'app', isStrict: false },
  { ja: 'お金', catalog: 'app', isStrict: false },
  { ja: '推し', catalog: 'app', isStrict: false },
  { ja: '思い出', catalog: 'app', isStrict: false },
  { ja: 'グッズ', catalog: 'app', isStrict: false },
  { ja: '支出', catalog: 'app', isStrict: false },
  { ja: 'カレンダー', catalog: 'app', isStrict: false },
  { ja: '当落', catalog: 'app', isStrict: false },
  { ja: 'テンプレート', catalog: 'app', isStrict: false },
  { ja: '定期支出', catalog: 'app', isStrict: false },
  { ja: 'シェアカード', catalog: 'app', isStrict: false },
  { ja: '記念カード', catalog: 'app', isStrict: false },
  { ja: '月間まとめ', catalog: 'app', isStrict: false },
  { ja: '記念日', catalog: 'app', isStrict: false },
  { ja: 'セットリスト', catalog: 'app', isStrict: false },
  { ja: 'ゲスト', catalog: 'app', isStrict: false },
  { ja: 'ライト', catalog: 'app', isStrict: false },
  { ja: 'ダーク', catalog: 'app', isStrict: false },
  { ja: 'チケット', catalog: 'app', isStrict: false },
  { ja: 'レシート', catalog: 'app', isStrict: false },
  { ja: '当選率', catalog: 'app', isStrict: false },
  { ja: '公演日', catalog: 'app', isStrict: false },
  { ja: 'その他', catalog: 'app', isStrict: false },
]);

const [appRepository] = process.argv.slice(2);
if (!appRepository) {
  console.error('使い方: node _src/i18n/extract-glossary.mjs <OshiLife のリポジトリの場所>');
  process.exit(1);
}

const catalogs = Object.fromEntries(Object.entries(CATALOG_PATHS).map(([name, relativePath]) => (
  [name, JSON.parse(readFileSync(path.join(appRepository, relativePath), 'utf8')).strings]
)));

const terms = TERMS.map((term) => {
  const entry = catalogs[term.catalog][term.ja];
  if (!entry) throw new Error(`${CATALOG_PATHS[term.catalog]} に「${term.ja}」がありません`);
  const translations = Object.fromEntries(TRANSLATED_LOCALE_CODES.map((code) => {
    const value = entry.localizations?.[code]?.stringUnit?.value;
    if (!value) throw new Error(`「${term.ja}」の ${code} の訳がありません`);
    return [code, value];
  }));
  return { ja: term.ja, isStrict: term.isStrict, translations };
});

writeFileSync(OUTPUT_FILE, `${JSON.stringify({ source: 'OshiLife の Localizable.xcstrings（アプリと widget）', terms }, null, 2)}\n`);
console.log(`${terms.length} 語を ${path.relative(process.cwd(), OUTPUT_FILE)} に書きました`);
```

Run: `node _src/i18n/extract-glossary.mjs ~/Documents/GitHub/OshiLife`
Expected: 「42 語を _src/i18n/glossary.json に書きました」。例外が出たら、その語をアプリの表で探し直す（キーの綴りが違う）。

- [ ] **Step 2: 訳語の検査を書く**

`tests/i18n/glossary.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { collectStrings, readContent } from '../helpers/content.mjs';
import { DEFAULT_LOCALE_CODE, LOCALES } from '../../_src/lib/locales.mjs';

const glossary = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'i18n', 'glossary.json'), 'utf8'));
const strictTerms = glossary.terms.filter((term) => term.isStrict);
const japaneseStrings = collectStrings(readContent(DEFAULT_LOCALE_CODE));
/** 英語は文頭や文中で大文字と小文字が変わるので、区別せずに探す。 */
const CASE_INSENSITIVE_LOCALE_CODES = new Set(['en']);

for (const locale of LOCALES.filter((candidate) => candidate.code !== DEFAULT_LOCALE_CODE)) {
  const content = readContent(locale.code);
  if (content === null) continue;
  const translatedTexts = new Map(collectStrings(content).map(({ dottedPath, text }) => [dottedPath, text]));
  const isCaseInsensitive = CASE_INSENSITIVE_LOCALE_CODES.has(locale.code);

  test(`${locale.code}: アプリの画面の呼び名を、アプリと同じ訳で書いている`, () => {
    const misses = [];
    for (const term of strictTerms) {
      const expected = term.translations[locale.code];
      for (const { dottedPath, text } of japaneseStrings) {
        if (!text.includes(term.ja)) continue;
        const translated = translatedTexts.get(dottedPath) ?? '';
        const isFound = isCaseInsensitive
          ? translated.toLowerCase().includes(expected.toLowerCase())
          : translated.includes(expected);
        if (!isFound) misses.push(`${dottedPath}: 「${term.ja}」は「${expected}」`);
      }
    }
    assert.deepEqual(misses, []);
  });
}
```

Run: `node --test tests/i18n/glossary.test.mjs`
Expected: 0 tests（訳の文がまだ無い）。PASS 扱いで終わる。

- [ ] **Step 3: 4言語の文を書く**

`_src/content/ja.json` を元に、`en.json`・`ko.json`・`zh-Hans.json`・`zh-Hant.json` を書く。決まり:

- キー・配列の長さ・`tag` の有無は ja.json と同じ（生成の時点で `findShapeDifferences` が止める）。`tag` の値は全言語で `Premium`。
- `{...}` の参照はそのまま残す。数字は直接書かず、参照を使う（例: 英語の「3 days before」は `{premiumExtraReminderDays} days before`）。
- 画面の呼び名は `_src/i18n/glossary.json` の訳を使う（`isStrict` の語は必ず。ほかの語も、文として自然な範囲でそろえる）。「推し」は英語で `oshi`（タブ名は `Oshi`）、韓国語で `최애`、中国語で `本命`。
- 事実は設計書 6 節の範囲だけ。日本語の文より強く言わない（「書かないこと」の言い回しの訳も持ち込まない。例: 「all features for free」）。
- 直訳にしない。その言語の読み手が LP として自然に読める文にする。見出しの改行（`\n`）は、その言語で自然な位置に置くか、無くす。
- `meta.title` は 60 文字ほどまで。`nav.appStoreBadgeAlt` は、その言語のバッジの画像に描かれている文字をそのまま書く（`assets/badges/<言語>.svg` を PNG にして Read で開いて確かめる。例: `sips -s format png assets/badges/ko.svg --out _tmp/badge-ko.png`。Apple の文言を変えない）。
- `footer.copyright` は全言語で `© {copyrightYear} Shoya Matsubara`。
- 言語の切り替えの表示名（日本語・English など）は `locales.mjs` が持つので、文には入れない。

- [ ] **Step 4: 生成して、検査を流す**

Run: `node _src/build.mjs && node --test tests/unit/content.test.mjs tests/i18n/glossary.test.mjs tests/site/pages.test.mjs`
Expected: 「5 ページを生成しました」、PASS（content 11・glossary 4・pages 45）。
落ちたら: 形の食い違いは build の例外に出る道筋を直す／数字は参照に置き換える／訳語は glossary の訳に合わせる／かなが残った所は訳し直す。

- [ ] **Step 5: 訳を、言語ごとに独立した審査員に点検させる**

Workflow ツールで次を流す（4人が並行で読む。ファイルは書き換えさせない）:

```js
export const meta = {
  name: 'oshilife-lp-translation-review',
  description: 'LP の4言語の訳を、言語ごとに独立した審査員が点検する',
  phases: [{ title: 'Review', detail: '言語ごとに訳を点検する' }],
}

const ROOT = '/Users/s/Documents/GitHub/OshiLife-Docs'
const LOCALE_CODES = ['en', 'ko', 'zh-Hans', 'zh-Hant']
const SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string', description: "文の道筋（例 'snap.points.0.body'）" },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          problem: { type: 'string' },
          suggestion: { type: 'string', description: 'その言語での直した文' },
        },
        required: ['path', 'severity', 'problem', 'suggestion'],
      },
    },
  },
  required: ['issues'],
}

phase('Review')
const results = await parallel(LOCALE_CODES.map((code) => () => agent(`あなたは ${code} を母語とする編集者。iPhone アプリ Oshi Life の LP の訳を点検する。
- 原文: ${ROOT}/_src/content/ja.json。訳: ${ROOT}/_src/content/${code}.json。アプリの訳語表: ${ROOT}/_src/i18n/glossary.json。
- 事実の正本: ${ROOT}/_docs/superpowers/specs/2026-10-26-landing-page-design.md の 6 節（「書かないこと」を含む）。数値は ${ROOT}/_src/lib/facts.mjs。
- 見ること: 意味のずれ・抜け・足し／その言語の読み手にとって不自然な言い回し（直訳調）／アプリの画面の呼び名が訳語表と違う所／6 節の事実を越えた主張／{...} の参照が壊れていないか／数字を直接書いていないか／見出しの改行（\\n）の位置がその言語で自然か。
- 参照しないもの: 旧 LP、App Store の宣伝文、ほかのプロジェクト。
- ファイルは書き換えない。問題だけを返す。問題が無ければ issues は空の配列。`, { label: `review:${code}`, phase: 'Review', schema: SCHEMA })
  .then((result) => result && { code, ...result })))
return results.filter(Boolean)
```

返ってきた問題のうち high と medium は直す。low は、直すと良くなると言える物だけ直す（直さなかった物と理由を `_tmp/translation-review.md` に残す）。直したら Step 4 を流し直す。

- [ ] **Step 6: 共有用の画像を描き、描画の検査と目視**

Run: `node _src/og/render-og.mjs && ./Scripts/verify.sh`
Expected: `assets/og/` に5枚、終了コード 0（フェーズ3は 5言語 × 2幅 = 10 tests と media 3 tests）。

Read で、各言語の `_tmp/shots/<言語>-mobile-fold.png`・`<言語>-mobile-full.png`・`<言語>-desktop-fold.png` と `assets/og/<言語>.jpg` を開く。
確かめること: 長くなった英語の見出し・ボタン・表がはみ出していない／韓国語が語の途中で折れていない／中国語が日本語の字形になっていない（`lang` と字体の指定）／バッジがその言語のもの／画面の画像がその言語のもの。直したら Step 4 からやり直す。

**実装で変えたこと（2026-10-26）:** 英語と韓国語の見出しで、折り返しの単位どうしが空白なしでつながった（「Start withyour」「찍으면,초안까지」）。
`LOCALES` に `phraseSeparator`（ja・zh は ''、en・ko は ' '）を足し、`renderPhrases(escapedText, separator)` で単位をつなぐようにした（テストを `tests/unit/core.test.mjs`・`render.test.mjs` に追加）。
中国語の文では日本語の区切りの「・」（U+30FB）を使わない（かなの検査が拾う）。バッジの代替テキストは、バッジの画像の文字（ko「App Store에서 다운로드 하기」、zh-Hans「App Store 下载」、zh-Hant「App Store 下載」）にした。

- [ ] **Step 7: コミットする**

```bash
git add _src/i18n _src/content tests/i18n index.html en/index.html ko/index.html zh-Hans/index.html zh-Hant/index.html assets/og
git commit -m "feat: LP を英語・韓国語・中国語（簡体字・繁体字）に訳す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 全体の検証（キーボード・外部リンク・フェーズ4）

**Files:**
- Create: `tests/render/keyboard.test.mjs`、`tests/network/check-links.mjs`
- Modify: `Scripts/verify.sh`（フェーズ4を足す）

**Interfaces:**
- Consumes: 生成した5ページ（Task 10）
- Produces: `VERIFY_NETWORK=1 ./Scripts/verify.sh`

- [ ] **Step 1: キーボードの検査を書く**

`tests/render/keyboard.test.mjs`:

```js
// キーボードだけで使えるかの最小の検査: 最初の Tab で「本文へ移動」が見え、押すと本文へ移る。言語の切り替えが開ける。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

const PAGE_URL = pathToFileURL(path.join(REPOSITORY_ROOT, 'index.html')).href;

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('最初の Tab で「本文へ移動」が画面に出て、Enter で本文へ移る', async () => {
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  await page.keyboard.press('Tab');
  const skipLink = await page.evaluate(() => {
    const element = document.activeElement;
    return { className: element.className, top: element.getBoundingClientRect().top };
  });
  assert.equal(skipLink.className, 'skip-link');
  assert.ok(skipLink.top >= 0, `画面の外にある（top ${skipLink.top}）`);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.location.hash), '#main');
  await page.close();
});

test('言語の切り替えをキーボードで開ける', async () => {
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  await page.locator('.language-menu summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.language-menu').getAttribute('open'), '');
  await page.close();
});
```

Run: `node --test --test-concurrency=1 tests/render/keyboard.test.mjs`
Expected: PASS（2 tests）。落ちたら site.css の `.skip-link:focus` と `.language-menu summary` を直す。

- [ ] **Step 2: 外部リンクの検査を書く**

`tests/network/check-links.mjs`:

```js
// verify のフェーズ4。生成したページから App Store とお問い合わせのリンクを集め、生きているかを確かめる（ネットワークが要る）。
// hreflang などの公開の URL は、公開する前は旧 LP のままなので見ない。
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../../_src/lib/locales.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CHECKED_LINK_PATTERN = /\shref="(https:\/\/(?:apps\.apple\.com|forms\.gle)\/[^"]*)"/g;
const LAST_SUCCESS_STATUS = 399;

const urls = new Set();
for (const locale of LOCALES) {
  const pageFile = path.join(REPOSITORY_ROOT, locale.directory, 'index.html');
  if (!existsSync(pageFile)) continue;
  for (const match of readFileSync(pageFile, 'utf8').matchAll(CHECKED_LINK_PATTERN)) urls.add(match[1]);
}

let hasFailure = false;
for (const url of urls) {
  const response = await fetch(url, { redirect: 'follow' });
  const isAlive = response.status <= LAST_SUCCESS_STATUS;
  console.log(`${isAlive ? 'OK' : 'NG'} ${response.status} ${url}`);
  if (!isAlive) hasFailure = true;
}
if (hasFailure) process.exitCode = 1;
```

Run: `node tests/network/check-links.mjs`
Expected: App Store の2つの URL とフォームの URL が `OK` で並び、終了コード 0。

- [ ] **Step 3: verify にフェーズ4を足す**

`Scripts/verify.sh` の「フェーズ3」の後ろ（`echo "verify: ...` の前）に足す:

```bash
if [[ "${VERIFY_NETWORK:-0}" == "1" ]]; then
  echo "== フェーズ4: 外部リンク"
  node tests/network/check-links.mjs
fi
```

Run: `VERIFY_NETWORK=1 ./Scripts/verify.sh`
Expected: 終了コード 0

- [ ] **Step 4: 設計書と照らす**

設計書の 4 節（12の節）・5 節（文の決まり）・7 節（ファイル）・8 節（見た目）・11 節（多言語）・12 節（検証）を1項目ずつ読み、どこで満たしたかを `_tmp/spec-coverage.md` に書く（コミットしない）。満たしていない項目があれば、その場で直すか、動画（Task 12）の待ちであることを書く。

**実装で変えたこと（2026-10-26）:** `check-links.mjs` は、App Store が 429（問い合わせが多すぎる）を返したときに待って問い合わせ直し、それでも 429 なら「確かめられない」と出して止めない。
来る人の多くは iPhone の Safari なので、`tests/render/pages.test.mjs` を Chromium と WebKit の両方で回すようにした（`npx playwright install webkit` が要る。撮った画像の名前の頭にブラウザ名が付く）。

- [ ] **Step 5: コミットする**

```bash
git add tests/render/keyboard.test.mjs tests/network/check-links.mjs Scripts/verify.sh
git commit -m "test: キーボードの操作と外部リンクの検査を足す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

ここで一度ユーザーに報告する（動画は静止画のまま。見てほしい画像の場所、Motion の動画を待っていること、push は 2.0 の配信後に指示を待つこと）。

---

### Task 12: 動画の差し込み（ユーザーが Claude Motion で作った MP4 が届いてから）

**この Task は、ユーザーから MP4 を受け取るまで始めない。** 設計書の付録 A の指示文で作った2本（`hero`・`color`）の置き場所を聞いてから進める。
`/motion` が使えないと分かったときは、設計書 9 節のとおり、同じ指示で Remotion で作る（そのときは Remotion の置き場所と依存の追加をユーザーに確かめてから、この Task の Step 3 に MP4 を渡す）。

**Files:**
- Create: `_src/assets/encode-video.mjs`、`tests/site/video.test.mjs`、`tests/render/real-video.test.mjs`、`assets/video/{hero,color}.mp4`・`assets/video/{hero,color}-poster.webp`（生成物）
- Modify: `_src/lib/videos.json`（スクリプトが書く）、5つの `index.html`（生成物）

**Interfaces:**
- Consumes: `BYTE_BUDGETS`（Task 3）、`MEDIA_SLOTS`（Task 5。`videos.json` を読む）、`readWebpSize`（Task 2）
- Produces: `node _src/assets/encode-video.mjs <hero|color> <MP4>`（`videos.json` に `{ src, poster, width, height }` を書く）

- [ ] **Step 1: 動画の検査を書く**

`tests/site/video.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { BYTE_BUDGETS } from '../../_src/lib/assets.mjs';
import { MEDIA_SLOTS } from '../../_src/lib/media.mjs';
import { readWebpSize } from '../../_src/lib/image-size.mjs';

const videos = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json'), 'utf8'));

test('動画の情報は、動画の枠の名前だけを持つ', () => {
  for (const slotName of Object.keys(videos)) assert.ok(slotName in MEDIA_SLOTS, slotName);
});

for (const [slotName, video] of Object.entries(videos)) {
  test(`${slotName}: 動画と静止画があり、重さが上限の中で、静止画の寸法が動画と同じ`, () => {
    const videoBytes = statSync(path.join(REPOSITORY_ROOT, video.src)).size;
    assert.ok(videoBytes <= BYTE_BUDGETS.video, `動画が ${videoBytes} バイト`);
    const poster = readFileSync(path.join(REPOSITORY_ROOT, video.poster));
    assert.ok(poster.length <= BYTE_BUDGETS.videoPoster, `静止画が ${poster.length} バイト`);
    assert.deepEqual(readWebpSize(poster), { width: video.width, height: video.height });
  });
}
```

`tests/render/real-video.test.mjs`:

```js
// 差し込んだ本物の動画（H.264）が再生されるかを、端末の Google Chrome で確かめる
// （Playwright の Chromium は H.264 を再生できない）。動画が無いあいだは飛ばす。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

const videos = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json'), 'utf8'));
const PLAYBACK_TIMEOUT_MILLISECONDS = 8000;

test('差し込んだ最初の画面の動画が Chrome で再生される', { skip: !videos.hero && '動画がまだ無い' }, async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(REPOSITORY_ROOT, 'index.html')).href);
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-media="autoplay"] video');
      return Boolean(video) && !video.paused && video.currentTime > 0;
    }, undefined, { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
    assert.equal(await page.locator('[data-media="autoplay"] .media-slot__toggle').isVisible(), true);
  } finally {
    await browser.close();
  }
});
```

Run: `node --test tests/site/video.test.mjs tests/render/real-video.test.mjs`
Expected: PASS（動画の情報が空なので、1 test と 1 skipped）

- [ ] **Step 2: 動画を Web 向けにするスクリプトを書く**

`_src/assets/encode-video.mjs`:

```js
// Claude Motion から書き出した MP4 を、Web 向けの H.264（音声なし・faststart・長辺 1080px 以下）と、
// 最初の1コマの静止画（WebP）にして、_src/lib/videos.json に書く。
// 使い方: node _src/assets/encode-video.mjs <hero|color> <書き出した MP4 の場所>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BYTE_BUDGETS } from '../lib/assets.mjs';
import { MEDIA_SLOTS } from '../lib/media.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const VIDEOS_FILE = path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json');
const LONGEST_EDGE = 1080;
const CONSTANT_RATE_FACTOR = 26;
const POSTER_QUALITY = 80;

const [slotName, source] = process.argv.slice(2);
if (!(slotName in MEDIA_SLOTS) || !source) {
  console.error('使い方: node _src/assets/encode-video.mjs <hero|color> <MP4 の場所>');
  process.exit(1);
}

const videoRelativePath = `assets/video/${slotName}.mp4`;
const posterRelativePath = `assets/video/${slotName}-poster.webp`;
const videoFile = path.join(REPOSITORY_ROOT, videoRelativePath);
const posterFile = path.join(REPOSITORY_ROOT, posterRelativePath);
const posterSourceFile = path.join(REPOSITORY_ROOT, '_tmp', `${slotName}-poster.png`);
mkdirSync(path.dirname(videoFile), { recursive: true });
mkdirSync(path.dirname(posterSourceFile), { recursive: true });

// 横長なら幅を、縦長なら高さを LONGEST_EDGE 以下にする（-2 は H.264 のために偶数にそろえる指定）。
const scaleFilter = `scale='if(gte(iw,ih),min(${LONGEST_EDGE},iw),-2)':'if(gte(iw,ih),-2,min(${LONGEST_EDGE},ih))'`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', source, '-an', '-c:v', 'libx264', '-preset', 'slow',
  '-crf', String(CONSTANT_RATE_FACTOR), '-pix_fmt', 'yuv420p', '-vf', scaleFilter, '-movflags', '+faststart', videoFile]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoFile, '-frames:v', '1', posterSourceFile]);
execFileSync('cwebp', ['-quiet', '-q', String(POSTER_QUALITY), posterSourceFile, '-o', posterFile]);

const [width, height] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', videoFile])
  .toString().trim().split(',').map(Number);
const videos = JSON.parse(readFileSync(VIDEOS_FILE, 'utf8'));
videos[slotName] = { src: videoRelativePath, poster: posterRelativePath, width, height };
writeFileSync(VIDEOS_FILE, `${JSON.stringify(videos, null, 2)}\n`);

const videoBytes = statSync(videoFile).size;
console.log(`${videoRelativePath}（${width}×${height}、${videoBytes} バイト）と ${posterRelativePath}`);
if (videoBytes > BYTE_BUDGETS.video) console.warn(`重さの上限 ${BYTE_BUDGETS.video} バイトを超えています。CONSTANT_RATE_FACTOR を上げて作り直す`);
```

- [ ] **Step 3: 届いた2本を差し込んで生成し直す**

```bash
node _src/assets/encode-video.mjs hero <ユーザーから受け取った hero の MP4>
node _src/assets/encode-video.mjs color <ユーザーから受け取った color の MP4>
node _src/build.mjs
```

Expected: 2本ぶんの寸法と重さが出て、「5 ページを生成しました」。重さの上限の警告が出たら `CONSTANT_RATE_FACTOR` を 28 に上げてやり直す（上げすぎて図形の縁が崩れたら、ユーザーに長さを短くした書き出しを頼む）。

- [ ] **Step 4: 検査と目視**

Run: `node --test tests/site/video.test.mjs tests/render/real-video.test.mjs && ./Scripts/verify.sh`
Expected: PASS（video 3 tests・real-video 1 test）、verify の終了コード 0。

フェーズ3（`tests/render/pages.test.mjs`）が、Playwright の Chromium で H.264 を読めないことによる `console.error` や読み込みの失敗で落ちたときは、`chromium.launch()` を `chromium.launch({ channel: 'chrome' })` に替える（このリポジトリの検証は Google Chrome の入ったこの Mac で行う）。

動画が入ると描画の検査が見る形が変わるので、`tests/render/pages.test.mjs` の `reducedMotion: 'reduce'` を一時的に `'no-preference'` にして一度流し、はみ出しとコントラストに問題が無いことを確かめてから戻す（戻し忘れないよう、流したあとに `git diff tests/render` が空であることを見る）。

Google Chrome で `index.html` を開き、動画の地の色がページの地と継ぎ目なくつながっていること、ループの継ぎ目、一時停止のボタンの位置を目で見る。継ぎ目が見えるときは、ユーザーに付録 A の「背景の色」の指定どおりに書き出し直してもらう。

- [ ] **Step 5: コミットする**

```bash
git add _src/assets/encode-video.mjs _src/lib/videos.json assets/video tests/site/video.test.mjs tests/render/real-video.test.mjs index.html en/index.html ko/index.html zh-Hans/index.html zh-Hant/index.html
git commit -m "feat: Claude Motion の動画2本を LP に差し込む

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## 完了のあとで（この計画の範囲の外）

- push と公開: 2.0 の配信後、ユーザーの指示で `lp-v2` を main に入れて push する（main に入った時点で公開される）。
- App Store Connect のマーケティング URL を、言語ごとのページ（`/en/` など）に向け直すかはユーザーが決める。
