// 言語ごとの文の形（キーの道筋と配列の長さ）。言語どうしで節や項目の数がずれていないかを比べる。

/** 値の形を、道筋の一覧にする。配列は長さも 'path#length=n' として入れる。葉は文字列でなければならない。 */
export function describeShape(value, dottedPath = '') {
  if (Array.isArray(value)) {
    return [`${dottedPath}#length=${value.length}`, ...value.flatMap((item, index) => describeShape(item, `${dottedPath}[${index}]`))];
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).sort().flatMap((key) => describeShape(value[key], dottedPath ? `${dottedPath}.${key}` : key));
  }
  if (typeof value !== 'string') throw new Error(`${dottedPath} は文字列でなければなりません`);
  return [dottedPath];
}

export function findShapeDifferences(reference, candidate) {
  const referencePaths = describeShape(reference);
  const candidatePaths = describeShape(candidate);
  const candidateSet = new Set(candidatePaths);
  const referenceSet = new Set(referencePaths);
  return {
    missing: referencePaths.filter((dottedPath) => !candidateSet.has(dottedPath)),
    extra: candidatePaths.filter((dottedPath) => !referenceSet.has(dottedPath)),
  };
}
