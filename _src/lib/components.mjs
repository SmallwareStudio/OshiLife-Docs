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
    `<h2 id="${headingId}" class="section__title">${renderPhrases(t(`${contentKey}.headline`), context.locale.phraseSeparator)}</h2>`,
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
