const seededRandom = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const mean = (list) => list.reduce((sum, v) => sum + v, 0) / (list.length || 1);

const std = (list, avg) => {
  const variance = list.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (list.length || 1);
  return Math.sqrt(variance) || 1;
};

const standardize = (points) => {
  const hrs = points.map((p) => p.avgHr);
  const steps = points.map((p) => p.steps);
  const meanHr = mean(hrs);
  const meanSteps = mean(steps);
  const stdHr = std(hrs, meanHr);
  const stdSteps = std(steps, meanSteps);
  const normalized = points.map((p) => ({
    avgHr: (p.avgHr - meanHr) / stdHr,
    steps: (p.steps - meanSteps) / stdSteps,
  }));
  return { normalized, stats: { meanHr, meanSteps, stdHr, stdSteps } };
};

const destandardize = (center, stats) => ({
  avgHr: center.avgHr * stats.stdHr + stats.meanHr,
  steps: center.steps * stats.stdSteps + stats.meanSteps,
});

const distanceSq = (a, b) => {
  const dHr = a.avgHr - b.avgHr;
  const dSteps = a.steps - b.steps;
  return dHr * dHr + dSteps * dSteps;
};

const pickInitialCenters = (points, k, seed) => {
  const rng = seededRandom(seed);
  const centers = [];
  const used = new Set();
  while (centers.length < k && centers.length < points.length) {
    const idx = Math.floor(rng() * points.length);
    if (used.has(idx)) continue;
    used.add(idx);
    centers.push({ ...points[idx] });
  }
  return centers;
};

const recomputeCenters = (points, assignments, k) => {
  const sums = Array.from({ length: k }, () => ({ avgHr: 0, steps: 0, count: 0 }));
  assignments.forEach((clusterId, idx) => {
    const bucket = sums[clusterId];
    bucket.avgHr += points[idx].avgHr;
    bucket.steps += points[idx].steps;
    bucket.count += 1;
  });
  return sums.map((s) => ({
    avgHr: s.count ? s.avgHr / s.count : 0,
    steps: s.count ? s.steps / s.count : 0,
    count: s.count,
  }));
};

const assignClusters = (points, centers) =>
  points.map((p) => {
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    centers.forEach((c, idx) => {
      const d = distanceSq(p, c);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    return bestIdx;
  });

const trainKMeans = ({ samples, k = 3, maxIter = 30, seed = 42 }) => {
  if (!Array.isArray(samples) || samples.length < k) {
    throw new Error('not enough samples to train');
  }
  const { normalized, stats } = standardize(samples);
  let centers = pickInitialCenters(normalized, k, seed);
  let assignments = assignClusters(normalized, centers);

  for (let i = 0; i < maxIter; i += 1) {
    const updated = recomputeCenters(normalized, assignments, k);
    const nextCenters = updated.map((c, idx) =>
      c.count ? { avgHr: c.avgHr, steps: c.steps } : centers[idx]
    );
    const nextAssignments = assignClusters(normalized, nextCenters);
    const changed = nextAssignments.some((val, idx) => val !== assignments[idx]);
    centers = nextCenters;
    assignments = nextAssignments;
    if (!changed) break;
  }

  const originalCenters = centers.map((c) => destandardize(c, stats));
  return originalCenters;
};

module.exports = { trainKMeans };
