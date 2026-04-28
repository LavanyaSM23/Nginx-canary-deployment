const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory state
let canaryWeight = 20;

// Track feedback per version
let feedback = {
  "v1.0.0": { good: 0, bad: 0 },
  "v2.0.0": { good: 0, bad: 0 }
};

const startTime = Date.now();

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (username === "admin" && password === "admin") {
    return res.json({ role: "admin", username });
  }
  return res.json({ role: "user", username });
});

// ── Weight ────────────────────────────────────────────────────────────────────
app.get("/weight", (req, res) => {
  res.json({ weight: canaryWeight });
});

app.post("/set-weight", (req, res) => {
  const { weight } = req.body || {};
  const parsed = parseInt(weight, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    return res.status(400).json({ error: "Weight must be 0–100" });
  }
  canaryWeight = parsed;

  // Attempt kubectl update (may fail in non-k8s envs — that's OK)
  const cmd = `kubectl annotate ingress nginx-ingress-canary nginx.ingress.kubernetes.io/canary-weight="${parsed}" --overwrite`;
  exec(cmd, (err) => {
    if (err) {
      // kubectl not available — still update in-memory weight
      console.warn("kubectl not available:", err.message);
    }
  });

  res.json({ success: true, weight: canaryWeight });
});

// ── Feedback ──────────────────────────────────────────────────────────────────
app.post("/feedback", (req, res) => {
  const { type, version } = req.body || {};
  
  if (!version || !feedback[version]) {
    return res.status(400).json({ error: "Invalid or missing version" });
  }

  if (type === "good") feedback[version].good++;
  else if (type === "bad") feedback[version].bad++;
  else return res.status(400).json({ error: "type must be 'good' or 'bad'" });
  
  res.json({ success: true, feedback });
});

app.get("/stats", (req, res) => {
  // Calculate totals across all versions
  let totalGood = 0;
  let totalBad = 0;
  
  Object.values(feedback).forEach(v => {
    totalGood += v.good;
    totalBad += v.bad;
  });
  
  const grandTotal = totalGood + totalBad;

  res.json({
    versions: feedback,
    global: {
      good: totalGood,
      bad: totalBad,
      total: grandTotal,
      goodPct: grandTotal ? Math.round((totalGood / grandTotal) * 100) : 0,
      badPct: grandTotal ? Math.round((totalBad / grandTotal) * 100) : 0,
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅  Backend running on port ${PORT}`));