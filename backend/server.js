// Simple Express backend for FitAdvisor (users, trainers, messages, notifications)
// Not production-ready: replace with a real database and auth before going live.
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { predictCluster } = require('./services/clusterPredictor');
const { estimateMaxHr, zoneRange, ZONE_NOTE } = require('./services/hrZones');
const { buildCoachMessage } = require('./services/recommendationTextGenerator');
const { trainKMeans } = require('./services/kmeansTrainer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data.json');
let lastWatchSnapshot = null;
const AUTO_TRAIN_EVERY = 20;

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: [],
      trainers: [],
      messages: [],
      notifications: [],
      mlSamples: [],
      lastTrainedAt: null,
      ...parsed,
    };
  } catch (e) {
    return {
      users: [],
      trainers: [],
      messages: [],
      notifications: [],
      mlSamples: [],
      lastTrainedAt: null,
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

const RULES_PATH = path.join(__dirname, 'model', 'cluster_rules.json');

function loadClusterRules() {
  const raw = fs.readFileSync(RULES_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveClusterRules(rules) {
  fs.writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2), 'utf-8');
}

function storeSample({ steps, avgHr }) {
  const data = loadData();
  data.mlSamples = Array.isArray(data.mlSamples) ? data.mlSamples : [];
  data.mlSamples.push({ steps, avgHr, createdAt: new Date().toISOString() });
  saveData(data);
  return data;
}

function retrainFromSamples(samples) {
  const centers = trainKMeans({ samples, k: 3, maxIter: 30, seed: 42 });
  const clusterRules = loadClusterRules();
  const sorted = [...centers].sort((a, b) => a.steps - b.steps);
  const updated = { ...clusterRules, clusters: { ...clusterRules.clusters } };
  sorted.forEach((c, idx) => {
    const id = String(idx + 1);
    const prev = updated.clusters[id];
    updated.clusters[id] = {
      ...prev,
      avgHr: Math.round(c.avgHr),
      steps: Math.round(c.steps),
      targetSteps: Math.round(c.steps + 1000),
    };
  });
  saveClusterRules(updated);
  return updated;
}

// Register user
app.post('/api/users/register', (req, res) => {
  const { name, username, password, age, goalType, height, weight, gender, programId, profilePhoto } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const data = loadData();
  if (data.users.find((u) => u.username === username)) {
    return res.status(400).json({ error: 'username already exists' });
  }
  const salt = crypto.randomBytes(8).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const user = {
    id: `u-${Date.now()}`,
    name: name || '',
    username,
    age: age || '',
    goalType: goalType || 'maintain',
    height: height || '',
    weight: weight || '',
    gender: gender || '',
    programId: programId || null,
    profilePhoto: profilePhoto || null,
    assignedTrainerId: null,
    salt,
    passwordHash,
  };
  data.users.push(user);
  saveData(data);
  res.json({ ok: true, user });
});

// Register trainer
app.post('/api/trainers/register', (req, res) => {
  const { name, username, password, specialty, bio, profilePhoto } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const data = loadData();
  if (data.trainers.find((t) => t.username === username)) {
    return res.status(400).json({ error: 'username already exists' });
  }
  const salt = crypto.randomBytes(8).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const trainer = {
    id: `t-${Date.now()}`,
    name: name || '',
    username,
    specialty: specialty || '',
    bio: bio || '',
    profilePhoto: profilePhoto || null,
    salt,
    passwordHash,
  };
  data.trainers.push(trainer);
  saveData(data);
  res.json({ ok: true, trainer });
});

// Login (user or trainer by role param)
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  const data = loadData();
  const collection = role === 'trainer' ? data.trainers : data.users;
  const found = collection.find((x) => x.username === username);
  if (!found) return res.status(400).json({ error: 'not found' });
  const candidate = hashPassword(password, found.salt);
  if (candidate !== found.passwordHash) return res.status(400).json({ error: 'invalid credentials' });
  res.json({ ok: true, user: found });
});

// List trainers
app.get('/api/trainers', (_req, res) => {
  const data = loadData();
  res.json({ ok: true, trainers: data.trainers });
});

// List users (optionally by assignedTrainerId)
app.get('/api/users', (req, res) => {
  const { assignedTrainerId } = req.query;
  const data = loadData();
  let users = data.users;
  if (assignedTrainerId) {
    users = users.filter((u) => u.assignedTrainerId === assignedTrainerId);
  }
  res.json({ ok: true, users });
});

// Assign trainer to user
app.post('/api/users/:userId/assign-trainer', (req, res) => {
  const { userId } = req.params;
  const { trainerId } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'user not found' });
  user.assignedTrainerId = trainerId;
  saveData(data);
  // create notification
  data.notifications.push({
    id: `n-${Date.now()}`,
    trainerId,
    userId,
    userName: user.name,
    userGoal: user.goalType,
    createdAt: new Date().toISOString(),
    type: 'assign_request',
  });
  saveData(data);
  res.json({ ok: true });
});

// Notifications for trainer
app.get('/api/trainers/:trainerId/notifications', (req, res) => {
  const { trainerId } = req.params;
  const data = loadData();
  const items = data.notifications.filter((n) => n.trainerId === trainerId);
  res.json({ ok: true, notifications: items });
});

// Messages list between trainer and student
app.get('/api/messages', (req, res) => {
  const { userId, trainerId } = req.query;
  const data = loadData();
  const items = data.messages
    .filter(
      (m) =>
        (m.senderId === userId && m.receiverId === trainerId) ||
        (m.senderId === trainerId && m.receiverId === userId)
    )
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  res.json({ ok: true, messages: items });
});

// Send message
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, senderType, text } = req.body;
  if (!senderId || !receiverId || !text) return res.status(400).json({ error: 'missing fields' });
  const data = loadData();
  const msg = {
    id: `m-${Date.now()}`,
    senderId,
    receiverId,
    senderType: senderType === 'trainer' ? 'trainer' : 'user',
    text,
    createdAt: new Date().toISOString(),
  };
  data.messages.push(msg);
  saveData(data);
  res.json({ ok: true, message: msg });
});

// Messages for a trainer (any student)
app.get('/api/trainers/:trainerId/messages', (req, res) => {
  const { trainerId } = req.params;
  const { limit = 20 } = req.query;
  const data = loadData();
  const trainerMsgs = data.messages
    .filter((m) => m.senderId === trainerId || m.receiverId === trainerId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, Number(limit) || 20);
  res.json({ ok: true, messages: trainerMsgs });
});

// Analyze HR + steps -> recommendation
app.post('/api/recommendation/analyze', (req, res) => {
  const { steps, avgHr, age, weight } = req.body;
  const stepsNum = Number(steps);
  const hrNum = Number(avgHr);
  const ageNum = age === undefined ? undefined : Number(age);
  const weightNum = weight === undefined ? undefined : Number(weight);
  if (!Number.isFinite(stepsNum) || !Number.isFinite(hrNum)) {
    return res.status(400).json({ error: 'steps and avgHr are required numbers' });
  }

  const dataAfterStore = storeSample({ steps: stepsNum, avgHr: hrNum });
  const samples = Array.isArray(dataAfterStore.mlSamples) ? dataAfterStore.mlSamples : [];
  if (samples.length >= AUTO_TRAIN_EVERY && samples.length % AUTO_TRAIN_EVERY === 0) {
    try {
      retrainFromSamples(samples);
      dataAfterStore.lastTrainedAt = new Date().toISOString();
      saveData(dataAfterStore);
    } catch {
      // keep serving with existing rules if training fails
    }
  }

  const clusterId = predictCluster({ steps: stepsNum, avgHr: hrNum });
  const clusterRules = loadClusterRules();
  const rule = clusterRules.clusters[String(clusterId)];
  if (!rule) return res.status(500).json({ error: 'cluster rule missing' });

  const zoneBpmRange = zoneRange(rule.zonePct, ageNum);
  const dynamicTargetSteps = stepsNum + 1000;
  const message = buildCoachMessage({
    clusterId,
    rule,
    steps: stepsNum,
    avgHr: hrNum,
    age: Number.isFinite(ageNum) ? ageNum : undefined,
    weight: Number.isFinite(weightNum) ? weightNum : undefined,
    zoneBpmRange,
    targetSteps: dynamicTargetSteps,
  });
  return res.json({
    cluster: clusterId,
    input: {
      steps: stepsNum,
      avgHr: hrNum,
      age: Number.isFinite(ageNum) ? ageNum : undefined,
      weight: Number.isFinite(weightNum) ? weightNum : undefined,
    },
    recommendation: {
      title: rule.title,
      message,
      targetSteps: dynamicTargetSteps,
      tips: rule.tips,
      zonePct: rule.zonePct,
      zoneBpmRange,
      zoneNote: ZONE_NOTE,
    },
  });
});

// Optional: ingest latest watch snapshot
app.post('/api/watch/ingest', (req, res) => {
  const { steps, avgHr, age, weight } = req.body;
  const stepsNum = Number(steps);
  const hrNum = Number(avgHr);
  const ageNum = age === undefined ? undefined : Number(age);
  const weightNum = weight === undefined ? undefined : Number(weight);
  if (!Number.isFinite(stepsNum) || !Number.isFinite(hrNum)) {
    return res.status(400).json({ error: 'steps and avgHr are required numbers' });
  }
  lastWatchSnapshot = {
    steps: stepsNum,
    avgHr: hrNum,
    age: Number.isFinite(ageNum) ? ageNum : undefined,
    weight: Number.isFinite(weightNum) ? weightNum : undefined,
    receivedAt: new Date().toISOString(),
  };
  res.json({ ok: true, latest: lastWatchSnapshot });
});

app.get('/api/watch/latest', (_req, res) => {
  res.json({ latest: lastWatchSnapshot });
});

app.get('/api/recommendation/latest', (_req, res) => {
  if (!lastWatchSnapshot) return res.status(404).json({ error: 'no snapshot ingested' });
  const clusterId = predictCluster({
    steps: lastWatchSnapshot.steps,
    avgHr: lastWatchSnapshot.avgHr,
  });
  const clusterRules = loadClusterRules();
  const rule = clusterRules.clusters[String(clusterId)];
  const zoneBpmRange = zoneRange(rule.zonePct, lastWatchSnapshot.age);
  const dynamicTargetSteps = Number.isFinite(lastWatchSnapshot.steps) ? lastWatchSnapshot.steps + 1000 : rule.targetSteps;
  const message = buildCoachMessage({
    clusterId,
    rule,
    steps: lastWatchSnapshot.steps,
    avgHr: lastWatchSnapshot.avgHr,
    age: lastWatchSnapshot.age,
    weight: lastWatchSnapshot.weight,
    zoneBpmRange,
    targetSteps: dynamicTargetSteps,
  });
  return res.json({
    cluster: clusterId,
    input: lastWatchSnapshot,
    recommendation: {
      title: rule.title,
      message,
      targetSteps: dynamicTargetSteps,
      tips: rule.tips,
      zonePct: rule.zonePct,
      zoneBpmRange,
      zoneNote: ZONE_NOTE,
    },
  });
});

// Collect training samples (steps + avgHr) for periodic retraining
app.post('/api/recommendation/learn', (req, res) => {
  const { steps, avgHr } = req.body;
  const stepsNum = Number(steps);
  const hrNum = Number(avgHr);
  if (!Number.isFinite(stepsNum) || !Number.isFinite(hrNum)) {
    return res.status(400).json({ error: 'steps and avgHr are required numbers' });
  }
  const data = storeSample({ steps: stepsNum, avgHr: hrNum });
  return res.json({ ok: true, count: Array.isArray(data.mlSamples) ? data.mlSamples.length : 0 });
});

// Retrain clusters from stored samples (offline but local)
app.post('/api/recommendation/retrain', (_req, res) => {
  const data = loadData();
  const samples = Array.isArray(data.mlSamples) ? data.mlSamples : [];
  if (samples.length < 3) {
    return res.status(400).json({ error: 'not enough samples to retrain' });
  }
  try {
    retrainFromSamples(samples);
  } catch (e) {
    return res.status(500).json({ error: 'training failed' });
  }
  data.lastTrainedAt = new Date().toISOString();
  saveData(data);
  return res.json({ ok: true, count: samples.length, lastTrainedAt: data.lastTrainedAt });
});

app.get('/api/recommendation/status', (_req, res) => {
  const data = loadData();
  return res.json({
    ok: true,
    samples: Array.isArray(data.mlSamples) ? data.mlSamples.length : 0,
    lastTrainedAt: data.lastTrainedAt || null,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`FitAdvisor backend running on http://localhost:${PORT}`);
});
