const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
    status: "healthy"
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
