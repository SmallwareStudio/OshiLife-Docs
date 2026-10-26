import { escapeHtml } from './escape.mjs';
import { fillFacts } from './facts.mjs';

/** 途中で改行すると読みにくい、空白を含む製品名と機能名。 */
const UNBREAKABLE_NAMES = Object.freeze(['App Store', 'Oshi Life', 'Face ID', 'Touch ID', 'Dynamic Island']);
const NON_BREAKING_SPACE = '&nbsp;';

/** 製品名と機能名の中の空白を、改行しない空白にする（エスケープした後の文に使う）。 */
function keepNamesTogether(escapedText) {
  return UNBREAKABLE_NAMES.reduce((text, name) => text.replaceAll(name, name.replaceAll(' ', NON_BREAKING_SPACE)), escapedText);
}

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
    return keepNamesTogether(escapeHtml(fillFacts(value)));
  };
  lookup.list = (dottedPath) => {
    const value = readPath(content, dottedPath);
    if (!Array.isArray(value)) throw new Error(`一覧 ${dottedPath} がありません`);
    return value;
  };
  lookup.has = (dottedPath) => readPath(content, dottedPath) !== undefined;
  return lookup;
}

/**
 * 見出しを改行（\n）の位置で折り返しの単位に分ける。日本語の見出しが語の途中で折れないようにするため。
 * separator は単位どうしのつなぎ（言語の phraseSeparator を渡す。英語と韓国語は空白）。
 */
export function renderPhrases(escapedText, separator = '') {
  return escapedText.split('\n').map((phrase) => `<span class="phrase">${phrase}</span>`).join(separator);
}
