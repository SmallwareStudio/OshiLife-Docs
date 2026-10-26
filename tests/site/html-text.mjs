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
