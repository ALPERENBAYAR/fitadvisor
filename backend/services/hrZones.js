const ZONE_NOTE = 'Kisiye gore degisir; cihaz olcumune baglidir.';

function estimateMaxHr(age) {
  if (!Number.isFinite(age)) return null;
  return Math.max(80, 220 - age);
}

function zoneRange(zonePct, age) {
  if (!Array.isArray(zonePct) || zonePct.length !== 2) return null;
  const maxHr = estimateMaxHr(age);
  if (!maxHr) return null;
  const [lo, hi] = zonePct;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  return [Math.round(lo * maxHr), Math.round(hi * maxHr)];
}

module.exports = {
  estimateMaxHr,
  zoneRange,
  ZONE_NOTE,
};
