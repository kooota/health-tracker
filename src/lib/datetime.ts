/**
 * Health Planet `from` / `to` は測定日/登録日を yyyyMMddHHmm(ss) で、未指定時の to は日本の現時刻。
 * 日付部は JST（日本）の暦に合わせる必要がある（UTC で組むと JST 午前中の測定が範囲外になる）。
 */
export function formatYmdHmsForHealthPlanet(date: Date) {
  const t = date.getTime() + 9 * 60 * 60 * 1000;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}${hh}${min}${ss}`;
}

export function addMonthsUtc(date: Date, months: number) {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

