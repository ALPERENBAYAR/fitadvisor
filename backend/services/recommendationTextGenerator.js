const pickStable = (list, seed) => {
  if (!list.length) return '';
  const idx = Math.abs(Math.floor(seed)) % list.length;
  return list[idx];
};

const pctLabel = (zonePct) => `${Math.round(zonePct[0] * 100)}-${Math.round(zonePct[1] * 100)}% max HR`;

const bpmLabel = (zoneBpmRange) =>
  zoneBpmRange ? `${zoneBpmRange[0]}-${zoneBpmRange[1]} bpm` : null;

const buildCoachMessage = ({ clusterId, rule, steps, avgHr, age, weight, zoneBpmRange, targetSteps }) => {
  const seed = (steps || 0) + (avgHr || 0) + (age || 0) + (weight || 0) + clusterId * 13;
  const resolvedTarget = Number.isFinite(targetSteps) ? targetSteps : rule.targetSteps;
  const intros = [
    `Bugun ${rule.title.toLowerCase()} modundasin, net hedef koyuyoruz.`,
    `Sinyallerin ${rule.title.toLowerCase()} grubuna yakin, net bir plan ciziyoruz.`,
    `Veriler ${rule.title.toLowerCase()} seviyesinde, hedefi netlestiriyoruz.`,
  ];
  const actions = [
    `Gunluk hedefin ${resolvedTarget} adim; tempoyu hafta hafta kademeli arttir.`,
    `Hedef ${resolvedTarget} adim, duzenli kisa seanslarla istikrar kur.`,
    `Hedef ${resolvedTarget} adim, bugun odagin ritmi bozmadan surdurmek.`,
  ];
  const zoneText = zoneBpmRange
    ? `Nabiz yogunlugu ${pctLabel(rule.zonePct)} bandinda, yaklasik ${bpmLabel(zoneBpmRange)} araliginda kalsin.`
    : `Nabiz yogunlugu ${pctLabel(rule.zonePct)} bandinda kalsin; aralik kisiye gore degisir.`;
  const cues = [
    'Nabzi stabil tut, son 5-10 dakikada hizlanip sonra sogumaya gec.',
    'Duzgun nefes ve durusla ritmi koru, tempo dalgalanmasin.',
    'Ritmi koruyup adim kalitesine odaklan, acele etme.',
  ];
  const weightText =
    Number.isFinite(weight) && weight > 0
      ? `Kilo ${weight} kg; beslenme, uyku ve suyla toparlanmayi destekle.`
      : null;

  const parts = [
    pickStable(intros, seed),
    pickStable(actions, seed + 1),
    zoneText,
    pickStable(cues, seed + 2),
  ];
  if (weightText) parts.push(weightText);

  return parts.filter(Boolean).slice(0, weightText ? 4 : 3).join(' ');
};

module.exports = { buildCoachMessage };
