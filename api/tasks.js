// api/tasks.js – CRUD for 1.5-hour task blocks
"use strict";

const {
  getDb,
  ensureIndexes,
  checkAuth,
  allowMethods,
  validDate,
  validSlot,
  validStatus,
  trimCap,
  clampInt,
  sendError,
} = require("../lib/db");

module.exports = async function handler(req, res) {
  try {
    if (!checkAuth(req, res)) return;
    if (!allowMethods(req, res, ["GET", "POST", "DELETE"])) return;
    await ensureIndexes();
    const db = await getDb();
    const col = db.collection("tasks");

    /* ---- GET: all slots for a date ---- */
    if (req.method === "GET") {
      const { date } = req.query;
      if (!validDate(date)) return sendError(res, 400, "Invalid date format");
      const docs = await col.find({ date }).sort({ slot: 1 }).toArray();
      return res.json(docs);
    }

    /* ---- POST: upsert a slot ---- */
    if (req.method === "POST") {
      const { date, slot, title, status, progress, report } = req.body || {};
      if (!validDate(date)) return sendError(res, 400, "Invalid date");
      if (!validSlot(slot)) return sendError(res, 400, "Invalid slot");
      if (!validStatus(status)) return sendError(res, 400, "Invalid status");

      const doc = {
        title: trimCap(title, 200),
        status,
        progress: clampInt(progress, 0, 100),
        report: trimCap(report, 4000),
        updatedAt: new Date(),
      };

      const result = await col.updateOne(
        { date, slot },
        { $set: doc, $setOnInsert: { date, slot, createdAt: new Date() } },
        { upsert: true }
      );
      return res.json({ ok: true, upsertedId: result.upsertedId || null });
    }

    /* ---- DELETE: remove a slot ---- */
    if (req.method === "DELETE") {
      const { date, slot } = req.query;
      if (!validDate(date)) return sendError(res, 400, "Invalid date");
      if (!validSlot(slot)) return sendError(res, 400, "Invalid slot");
      await col.deleteOne({ date, slot });
      return res.json({ ok: true });
    }
  } catch (err) {
    console.error("tasks error:", err);
    return sendError(res, 500, "Internal server error");
  }
};
