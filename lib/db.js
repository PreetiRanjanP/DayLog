// lib/db.js – Shared MongoDB helpers for all Vercel serverless functions
"use strict";

const { MongoClient, ObjectId } = require("mongodb");

/* ---------- Cached connection (survives across warm invocations) ---------- */
let _clientPromise;

function getClient() {
  if (!_clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI environment variable is not set in Vercel settings");
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    _clientPromise = client.connect().catch((err) => {
      _clientPromise = null;
      global.__daylogMongo = null;
      throw err;
    });
    // Cache on global so even if the module is re-evaluated we keep it
    global.__daylogMongo = _clientPromise;
  }
  return _clientPromise;
}

// Re-hydrate from global cache if available (Vercel may snapshot global)
if (global.__daylogMongo) _clientPromise = global.__daylogMongo;

async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || "daylog");
}

/* ---------- One-time index creation (per cold start) ---------- */
let _indexReady = false;
async function ensureIndexes() {
  if (_indexReady) return;
  const db = await getDb();
  await db
    .collection("tasks")
    .createIndex({ date: 1, slot: 1 }, { unique: true, background: true })
    .catch(() => {}); // ignore "already exists"
  _indexReady = true;
}

/* ---------- Auth guard ---------- */
function checkAuth(req, res) {
  const key = process.env.APP_KEY;
  if (!key) return true; // auth disabled
  if (req.headers["x-app-key"] === key) return true;
  res.status(401).json({ error: "Unauthorised – invalid or missing x-app-key" });
  return false;
}

/* ---------- Method guard ---------- */
function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  res.status(405).json({ error: `Method ${req.method} not allowed` });
  return false;
}

/* ---------- Validation helpers ---------- */
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_SLOT = /^\d{2}:\d{2}$/;
const STATUSES = ["todo", "prog", "done", "block"];

function validDate(d) {
  return typeof d === "string" && RE_DATE.test(d);
}
function validSlot(s) {
  return typeof s === "string" && RE_SLOT.test(s);
}
function validStatus(s) {
  return STATUSES.includes(s);
}
function validObjectId(id) {
  return typeof id === "string" && ObjectId.isValid(id);
}

function trimCap(str, max) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, max);
}

function clampInt(n, min, max) {
  const v = parseInt(n, 10);
  if (isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendError(res, code, msg) {
  return res.status(code).json({ error: msg });
}

module.exports = {
  getDb,
  ensureIndexes,
  checkAuth,
  allowMethods,
  validDate,
  validSlot,
  validStatus,
  validObjectId,
  trimCap,
  clampInt,
  escapeRegex,
  sendError,
  ObjectId,
};
