// api/search.js – Global keyword search across tasks and study collections
"use strict";

const {
  getDb,
  ensureIndexes,
  checkAuth,
  allowMethods,
  trimCap,
  escapeRegex,
  sendError,
} = require("../lib/db");

module.exports = async function handler(req, res) {
  try {
    if (!checkAuth(req, res)) return;
    if (!allowMethods(req, res, ["GET"])) return;
    await ensureIndexes();

    const q = trimCap(req.query.q, 80);
    if (!q) return sendError(res, 400, "Query parameter q is required");

    const db = await getDb();
    const pattern = new RegExp(escapeRegex(q), "i");

    const [tasks, study] = await Promise.all([
      db
        .collection("tasks")
        .find({ $or: [{ title: pattern }, { report: pattern }] })
        .sort({ date: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("study")
        .find({
          $or: [
            { subject: pattern },
            { topic: pattern },
            { notes: pattern },
          ],
        })
        .sort({ date: -1 })
        .limit(100)
        .toArray(),
    ]);

    return res.json({ tasks, study });
  } catch (err) {
    console.error("search error:", err);
    return sendError(res, 500, "Internal server error");
  }
};
