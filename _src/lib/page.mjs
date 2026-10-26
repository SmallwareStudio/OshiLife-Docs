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
