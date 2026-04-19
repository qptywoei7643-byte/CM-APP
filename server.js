const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

let currentRun = null;
let lastRunId = 0;

function nowIso() {
  return new Date().toISOString();
}

function buildRunSummary() {
  if (!currentRun) {
    return {
      ok: true,
      idle: true,
      hasActiveRun: false,
      run: null
    };
  }

  return {
    ok: true,
    idle: currentRun.status !== "running",
    hasActiveRun: true,
    run: {
      runId: currentRun.runId,
      status: currentRun.status,
      createdAt: currentRun.createdAt,
      startedAt: currentRun.startedAt,
      finishedAt: currentRun.finishedAt,
      stoppedAt: currentRun.stoppedAt,
      input: currentRun.input,
      error: currentRun.error,
      planMeta: currentRun.planMeta
    }
  };
}

function getPlanMeta(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const meta = {
    keys: Object.keys(plan),
    stepCount: Array.isArray(plan.steps) ? plan.steps.length : 0
  };

  if (typeof plan.name === "string" && plan.name.trim()) {
    meta.name = plan.name.trim();
  }

  if (typeof plan.storeId === "string" || typeof plan.storeId === "number") {
    meta.storeId = String(plan.storeId);
  }

  return meta;
}

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "cm-app-runner",
    message: "Runner is running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "cm-app-runner",
    status: "healthy"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "cm-app-runner",
    status: "healthy",
    endpoints: [
      "POST /api/macro/start",
      "GET /api/macro/wait-idle",
      "POST /api/macro/stop",
      "POST /api/macro/input"
    ]
  });
});

app.post("/api/macro/start", async (req, res) => {
  const body = req.body || {};
  const plan = body.plan;

  if (!plan || typeof plan !== "object") {
    return res.status(400).json({
      ok: false,
      error: "invalid_plan",
      message: "plan object is required"
    });
  }

  if (currentRun && currentRun.status === "running") {
    return res.status(409).json({
      ok: false,
      error: "already_running",
      message: "A macro run is already in progress",
      runId: currentRun.runId
    });
  }

  lastRunId += 1;

  currentRun = {
    runId: `run_${lastRunId}`,
    status: "running",
    createdAt: nowIso(),
    startedAt: nowIso(),
    finishedAt: null,
    stoppedAt: null,
    input: null,
    error: null,
    plan,
    planMeta: getPlanMeta(plan)
  };

  return res.status(200).json({
    ok: true,
    message: "Macro run started",
    runId: currentRun.runId,
    status: currentRun.status,
    planMeta: currentRun.planMeta
  });
});

app.get("/api/macro/wait-idle", async (req, res) => {
  return res.status(200).json(buildRunSummary());
});

app.post("/api/macro/stop", async (req, res) => {
  if (!currentRun) {
    return res.status(200).json({
      ok: true,
      message: "No active run",
      stopped: false
    });
  }

  if (currentRun.status === "running") {
    currentRun.status = "stopped";
    currentRun.stoppedAt = nowIso();
    currentRun.finishedAt = nowIso();
  }

  return res.status(200).json({
    ok: true,
    message: "Macro run stopped",
    stopped: true,
    runId: currentRun.runId,
    status: currentRun.status
  });
});

app.post("/api/macro/input", async (req, res) => {
  const body = req.body || {};

  if (!currentRun) {
    return res.status(404).json({
      ok: false,
      error: "no_active_run",
      message: "There is no active run to receive input"
    });
  }

  currentRun.input = body;

  return res.status(200).json({
    ok: true,
    message: "Input received",
    runId: currentRun.runId,
    status: currentRun.status,
    input: currentRun.input
  });
});

app.post("/run", async (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Runner received request",
    received: req.body || null
  });
});

app.post("/api/run", async (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Runner received request",
    received: req.body || null
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "not_found",
    path: req.originalUrl
  });
});

app.listen(port, () => {
  console.log(`cm-app-runner listening on port ${port}`);
});
