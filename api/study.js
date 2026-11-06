// api/study.js – CRUD for study entries
"use strict";

const {
  getDb,
  ensureIndexes,
  checkAuth,
  allowMethods,
  validDate,
  validObjectId,
  trimCap,
  clampInt,
  sendError,
  ObjectId,
} = require("../lib/db");

module.exports = async function handler(req, res) {
  try {
    if (!checkAuth(req, res)) return;
    if (!allowMethods(req, res, ["GET", "POST", "PUT", "DELETE"])) return;
    await ensureIndexes();
    const db = await getDb();
    const col = db.collection("study");

    /* ---- GET: entries for a date ---- */
    if (req.method === "GET") {
      const { date } = req.query;
      if (!validDate(date)) return sendError(res, 400, "Invalid date format");
      const docs = await col.find({ date }).sort({ createdAt: -1 }).toArray();
      return res.json(docs);
    }

    /* ---- POST: create new entry ---- */
    if (req.method === "POST") {
      const { date, subject, topic, notes, mins } = req.body || {};
      if (!validDate(date)) return sendError(res, 400, "Invalid date");
      const doc = {
        date,
        subject: trimCap(subject, 100),
        topic: trimCap(topic, 200),
        notes: trimCap(notes, 10000),
        mins: clampInt(mins, 0, 99999),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ ok: true, id: result.insertedId });
    }

    /* ---- PUT: update by id ---- */
    if (req.method === "PUT") {
      const { id } = req.query;
      if (!validObjectId(id)) return sendError(res, 400, "Invalid id");
      const { subject, topic, notes, mins } = req.body || {};
      const update = {
        subject: trimCap(subject, 100),
        topic: trimCap(topic, 200),
        notes: trimCap(notes, 10000),
        mins: clampInt(mins, 0, 99999),
        updatedAt: new Date(),
      };
      await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return res.json({ ok: true });
    }

    /* ---- DELETE: remove by id ---- */
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!validObjectId(id)) return sendError(res, 400, "Invalid id");
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.json({ ok: true });
    }
  } catch (err) {
    console.error("study error:", err);
    return sendError(res, 500, "Internal server error");
  }
};
