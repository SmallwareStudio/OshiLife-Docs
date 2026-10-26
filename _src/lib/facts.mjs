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
