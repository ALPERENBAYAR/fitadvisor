const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'model', 'cluster_rules.json');

const loadCentroids = () => {
  const raw = fs.readFileSync(rulesPath, 'utf-8');
  const rules = JSON.parse(raw);
  const centroids = Object.entries(rules.clusters).map(([id, c]) => ({
    id: Number(id),
    avgHr: c.avgHr,
    steps: c.steps,
  }));
  const count = centroids.length;
  const meanHr = centroids.reduce((sum, c) => sum + c.avgHr, 0) / count;
  const meanSteps = centroids.reduce((sum, c) => sum + c.steps, 0) / count;
  const varHr = centroids.reduce((sum, c) => sum + (c.avgHr - meanHr) ** 2, 0) / count;
  const varSteps = centroids.reduce((sum, c) => sum + (c.steps - meanSteps) ** 2, 0) / count;
  const stats = {
    meanHr,
    meanSteps,
    stdHr: Math.sqrt(varHr) || 1,
    stdSteps: Math.sqrt(varSteps) || 1,
  };
  return { centroids, stats };
};

const toZ = (value, mean, std) => (value - mean) / std;

function predictCluster({ steps, avgHr }) {
  if (!Number.isFinite(steps) || !Number.isFinite(avgHr)) {
    throw new Error('steps and avgHr must be numbers');
  }
  const { centroids, stats } = loadCentroids();
  const zHr = toZ(avgHr, stats.meanHr, stats.stdHr);
  const zSteps = toZ(steps, stats.meanSteps, stats.stdSteps);
  let bestId = centroids[0].id;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of centroids) {
    const dHr = zHr - toZ(c.avgHr, stats.meanHr, stats.stdHr);
    const dSteps = zSteps - toZ(c.steps, stats.meanSteps, stats.stdSteps);
    const dist = dHr * dHr + dSteps * dSteps;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = c.id;
    }
  }
  return bestId;
}

module.exports = { predictCluster };
