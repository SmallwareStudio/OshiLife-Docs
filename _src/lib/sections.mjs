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
