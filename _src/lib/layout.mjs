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
