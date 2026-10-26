#!/usr/bin/env bash
# Oshi Life の LP の検証。終了コードが完了判定（必須のフェーズがすべて 0 なら完了）。
set -euo pipefail
cd "$(dirname "$0")/.."

# node --test に渡すテストのファイルを、指定したフォルダから集める（無いフォルダは飛ばす）。
collect_tests() {
  find "$@" -name '*.test.mjs' -type f 2>/dev/null | sort
}

echo "== フェーズ1: 生成した HTML が _src と一致しているか"
node _src/build.mjs --check

echo "== フェーズ2: 静的検査と単体テスト"
# shellcheck disable=SC2046
node --test $(collect_tests tests/unit tests/site tests/i18n)

echo "verify: 必須のフェーズはすべて通過"
