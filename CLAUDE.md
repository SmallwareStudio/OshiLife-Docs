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
| 3 | Playwright の Chromium と WebKit で 5言語 × 390px・1280px を描く（はみ出し・読み込み・コントラスト・動画の枠・キーボード）。撮った画像は `_tmp/shots/` | 必須 |
| 4 | 外部リンク（App Store・お問い合わせ）が生きている | `VERIFY_NETWORK=1` のときだけ |

「完了」と言う前に、フェーズ3で撮った画像を目で見て確かめる。

## コマンド

```bash
npm run build                                   # 5ページを生成する
node _src/build.mjs --check                     # 生成物が最新かだけを見る
node _src/assets/fetch-badges.mjs               # App Store のバッジを取り直す
node _src/assets/prepare-screens.mjs <product-page の場所>   # 画面の画像を作り直す
node _src/og/render-og.mjs                      # 共有用の画像を描き直す
node _src/assets/encode-video.mjs <hero|color> <MP4>        # 動画を差し込む（計画の Task 12 で作る。それまでは無い）
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
