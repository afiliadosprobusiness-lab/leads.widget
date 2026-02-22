import {
  chunkArray,
  handleOptions,
  parseJsonBody,
  recordActivityEvent,
  requireAuthUid,
  sanitizePayloadJson,
  setCors,
  trimText,
} from "./_common.js";
import { db } from "../_firebase.js";

function normalizeTimelineEvent(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    client_id: trimText(data.client_id || "", 140),
    entity_type: trimText(data.entity_type || "", 40).toLowerCase(),
    entity_id: trimText(data.entity_id || "", 140),
    type: trimText(data.type || "", 80).toLowerCase(),
    payload_json: data.payload_json && typeof data.payload_json === "object" ? data.payload_json : {},
    created_at: trimText(data.created_at || "", 60) || new Date().toISOString(),
    created_by: trimText(data.created_by || "", 140) || null,
  };
}

function applyTimelineFilter(items, filter) {
  const normalizedFilter = trimText(filter || "all", 20).toLowerCase();
  if (normalizedFilter === "notes") {
    return items.filter((eventItem) => eventItem.type === "manual_note");
  }
  if (normalizedFilter === "stage") {
    return items.filter((eventItem) => eventItem.type.includes("stage"));
  }
  if (normalizedFilter === "tasks") {
    return items.filter((eventItem) => eventItem.type.startsWith("task_"));
  }
  return items;
}

export default async function handler(req, res) {
  setCors(res, "GET,POST,OPTIONS");
  if (handleOptions(req, res)) return;
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    if (req.method === "GET") {
      const entityType = trimText(req.query?.entityType || req.query?.entity_type || "", 40).toLowerCase();
      const entityId = trimText(req.query?.entityId || req.query?.entity_id || "", 140);
      const contactId = trimText(req.query?.contactId || "", 140);
      const filter = trimText(req.query?.filter || "all", 20).toLowerCase();
      const limitRaw = Number(req.query?.limit || 180);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.round(limitRaw), 20), 500) : 180;

      const events = [];

      if (entityType && entityId) {
        const snap = await db
          .collection("activity_events")
          .where("client_id", "==", uid)
          .where("entity_type", "==", entityType)
          .where("entity_id", "==", entityId)
          .get();
        snap.docs.forEach((docSnap) => events.push(normalizeTimelineEvent(docSnap)));
      } else if (contactId) {
        const contactEventsSnap = await db
          .collection("activity_events")
          .where("client_id", "==", uid)
          .where("entity_type", "==", "contact")
          .where("entity_id", "==", contactId)
          .get();
        contactEventsSnap.docs.forEach((docSnap) => events.push(normalizeTimelineEvent(docSnap)));

        const dealsSnap = await db
          .collection("deals")
          .where("client_id", "==", uid)
          .where("contact_id", "==", contactId)
          .get();
        const dealIds = dealsSnap.docs.map((docSnap) => docSnap.id).filter(Boolean);
        const chunks = chunkArray(dealIds, 30);
        for (const chunk of chunks) {
          if (chunk.length === 0) continue;
          const dealEventsSnap = await db
            .collection("activity_events")
            .where("client_id", "==", uid)
            .where("entity_type", "==", "deal")
            .where("entity_id", "in", chunk)
            .get();
          dealEventsSnap.docs.forEach((docSnap) => events.push(normalizeTimelineEvent(docSnap)));
        }
      } else {
        const snap = await db.collection("activity_events").where("client_id", "==", uid).get();
        snap.docs.forEach((docSnap) => events.push(normalizeTimelineEvent(docSnap)));
      }

      const sorted = events
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return res.status(200).json({
        events: applyTimelineFilter(sorted, filter),
      });
    }

    const body = parseJsonBody(req);
    const entityType = trimText(body.entity_type || body.entityType || "", 40).toLowerCase();
    const entityId = trimText(body.entity_id || body.entityId || "", 140);
    const type = trimText(body.type || "manual_note", 80).toLowerCase();
    const note = trimText(body.note || "", 2000);
    if (!entityType || !entityId) {
      return res.status(400).json({ error: "entity_type and entity_id are required" });
    }
    if (!["contact", "deal"].includes(entityType)) {
      return res.status(400).json({ error: "entity_type must be contact or deal" });
    }

    const allowedTypes = new Set([
      "manual_note",
      "contact_stage_changed",
      "deal_stage_changed",
      "task_created",
      "task_completed",
      "task_overdue",
      "task_reopened",
      "dedupe_merge",
      "contact_created",
      "contact_updated",
      "deal_created",
    ]);

    if (!allowedTypes.has(type)) {
      return res.status(400).json({ error: "Unsupported timeline event type" });
    }

    if (type === "manual_note" && !note) {
      return res.status(400).json({ error: "note is required for manual_note" });
    }

    const payload = type === "manual_note"
      ? { note }
      : sanitizePayloadJson(body.payload_json || body.payload || {}, 0);

    const createdRef = await recordActivityEvent({
      clientId: uid,
      entityType,
      entityId,
      type,
      payload,
      createdBy: uid,
    });

    return res.status(201).json({
      success: true,
      event: {
        id: createdRef?.id || "",
        entity_type: entityType,
        entity_id: entityId,
        type,
        payload_json: payload,
        created_at: new Date().toISOString(),
        created_by: uid,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process timeline",
      details: trimText(error?.message || "Unknown error", 240),
    });
  }
}
