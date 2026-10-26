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
