// 動画1（ヒーロー）: レシートを撮る → 品目ごとの下書き（グッズと支出の札）に分かれる → ホームの今月の支出が増える。
// 同じ場所で時間の順に切り替え、8秒で最初のコマ（何も無い地）に戻る（設計書 9 節・付録 A）。
import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SCREEN } from "./palette";
import { CLAMP } from "./video";
import { RECEIPT, RECEIPT_ITEM_ROW_TOPS, RECEIPT_ROW_HEIGHT, Receipt, ViewfinderCorners } from "./Receipt";
import { DRAFT_CARD, DRAFT_CARD_TOPS, DraftCard, HOME_CARD, HomeCard } from "./Cards";

/** 場面の切り替えの時刻（秒）。 */
const TIMELINE = {
  receiptAppearStart: 0.15,
  receiptAppearEnd: 0.65,
  cornersStart: 0.55,
  cornersEnd: 1.35,
  scanStart: 1.35,
  scanEnd: 1.95,
  receiptFadeStart: 2.0,
  receiptFadeEnd: 2.6,
  cardsRiseStart: 2.1,
  cardsRiseEnd: 3.0,
  chipsStart: 3.0,
  chipStagger: 0.18,
  chipPopDuration: 0.35,
  checksStart: 4.3,
  checksEnd: 4.65,
  homeAppearStart: 4.4,
  homeAppearEnd: 4.9,
  firstCardDropStart: 4.8,
  secondCardDropStart: 5.1,
  cardDropDuration: 0.7,
  firstSpendingStepStart: 5.35,
  secondSpendingStepStart: 5.75,
  spendingStepDuration: 0.3,
  homeFadeStart: 6.6,
  homeFadeEnd: 7.4,
} as const;

/** 今月の支出の棒の長さ（はじめ・1枚目が入った後・2枚目が入った後）。 */
const SPENDING_RATIOS = [0.32, 0.56, 0.8] as const;
const CORNER_GAP_START = 110;
const CORNER_GAP_END = 24;
const SCAN_LIGHT_START_TOP = -170;
const RECEIPT_START_SCALE = 0.94;
const CARD_START_SCALE = 0.6;
const CARD_END_SCALE = 0.28;
const HOME_RISE_DISTANCE = 30;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (seconds: number) => seconds * fps;

  const receiptOpacity = interpolate(
    frame,
    [at(TIMELINE.receiptAppearStart), at(TIMELINE.receiptAppearEnd), at(TIMELINE.receiptFadeStart), at(TIMELINE.receiptFadeEnd)],
    [0, 1, 1, 0],
    CLAMP,
  );
  const receiptScale = interpolate(frame, [at(TIMELINE.receiptAppearStart), at(TIMELINE.receiptAppearEnd)], [RECEIPT_START_SCALE, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cornerGap = interpolate(frame, [at(TIMELINE.cornersStart), at(TIMELINE.cornersEnd)], [CORNER_GAP_START, CORNER_GAP_END], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cornerOpacity = Math.min(
    receiptOpacity,
    interpolate(frame, [at(TIMELINE.cornersStart), at(TIMELINE.cornersStart + TIMELINE.chipPopDuration)], [0, 1], CLAMP),
  );
  const scanLightTop = interpolate(frame, [at(TIMELINE.scanStart), at(TIMELINE.scanEnd)], [SCAN_LIGHT_START_TOP, RECEIPT.height], CLAMP);
  const scanLightOpacity = frame >= at(TIMELINE.scanStart) && frame <= at(TIMELINE.scanEnd) ? 1 : 0;

  const homeOpacity = interpolate(
    frame,
    [at(TIMELINE.homeAppearStart), at(TIMELINE.homeAppearEnd), at(TIMELINE.homeFadeStart), at(TIMELINE.homeFadeEnd)],
    [0, 1, 1, 0],
    CLAMP,
  );
  const homeRise = interpolate(frame, [at(TIMELINE.homeAppearStart), at(TIMELINE.homeAppearEnd)], [HOME_RISE_DISTANCE, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const spendingRatio = interpolate(
    frame,
    [
      at(TIMELINE.firstSpendingStepStart),
      at(TIMELINE.firstSpendingStepStart + TIMELINE.spendingStepDuration),
      at(TIMELINE.secondSpendingStepStart),
      at(TIMELINE.secondSpendingStepStart + TIMELINE.spendingStepDuration),
    ],
    [SPENDING_RATIOS[0], SPENDING_RATIOS[1], SPENDING_RATIOS[1], SPENDING_RATIOS[2]],
    { ...CLAMP, easing: EASE_OUT },
  );

  /** 下書きのカードの動き。レシートの品目の行から浮き上がり、あとでホームのカードへ吸い込まれる。 */
  const describeCard = (index: number, dropStart: number) => {
    const finalTop = DRAFT_CARD_TOPS[index];
    const finalCenter = finalTop + DRAFT_CARD.height / 2;
    const rowCenter = RECEIPT.top + RECEIPT_ITEM_ROW_TOPS[index] + RECEIPT_ROW_HEIGHT / 2;
    const homeCenter = HOME_CARD.top + HOME_CARD.height / 2;
    const rise = interpolate(frame, [at(TIMELINE.cardsRiseStart), at(TIMELINE.cardsRiseEnd)], [0, 1], { ...CLAMP, easing: EASE_OUT });
    const drop = interpolate(frame, [at(dropStart), at(dropStart + TIMELINE.cardDropDuration)], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
    const offsetY = (rowCenter - finalCenter) * (1 - rise) + (homeCenter - finalCenter) * drop;
    const scale = (CARD_START_SCALE + (1 - CARD_START_SCALE) * rise) * (1 - (1 - CARD_END_SCALE) * drop);
    const opacity = Math.min(rise, interpolate(drop, [0.55, 1], [1, 0], CLAMP));
    const chipStart = TIMELINE.chipsStart + index * 2 * TIMELINE.chipStagger;
    return {
      top: finalTop,
      style: { translate: `0px ${offsetY}px`, scale: String(scale), opacity },
      goodsChipScale: interpolate(frame, [at(chipStart), at(chipStart + TIMELINE.chipPopDuration)], [0, 1], {
        ...CLAMP,
        easing: Easing.spring({ damping: 12 }),
      }),
      expenseChipScale: interpolate(
        frame,
        [at(chipStart + TIMELINE.chipStagger), at(chipStart + TIMELINE.chipStagger + TIMELINE.chipPopDuration)],
        [0, 1],
        { ...CLAMP, easing: Easing.spring({ damping: 12 }) },
      ),
      checkScale: interpolate(frame, [at(TIMELINE.checksStart), at(TIMELINE.checksEnd)], [0, 1], {
        ...CLAMP,
        easing: Easing.spring({ damping: 12 }),
      }),
    };
  };

  const firstCard = describeCard(0, TIMELINE.firstCardDropStart);
  const secondCard = describeCard(1, TIMELINE.secondCardDropStart);

  return (
    <AbsoluteFill style={{ backgroundColor: SCREEN }}>
      <HomeCard spendingRatio={spendingRatio} style={{ opacity: homeOpacity, translate: `0px ${homeRise}px` }} />
      <Receipt
        style={{ opacity: receiptOpacity, scale: String(receiptScale) }}
        scanLightTop={scanLightTop}
        scanLightOpacity={scanLightOpacity}
      />
      <ViewfinderCorners gap={cornerGap} opacity={cornerOpacity} />
      <DraftCard nameBarWidth={230} amountBarWidth={110} {...firstCard} />
      <DraftCard nameBarWidth={190} amountBarWidth={124} {...secondCard} />
    </AbsoluteFill>
  );
};
