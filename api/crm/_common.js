import crypto from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { db } from "../_firebase.js";
export { db };

export const CRM_STAGES = ["new", "contacted", "qualified", "won", "lost"];
export const TASK_STATUSES = ["open", "done", "overdue"];
export const TASK_PRIORITIES = ["low", "med", "high"];

export function setCors(res, methods = "GET,POST,PATCH,OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

export function trimText(value, max = 400) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  if (max <= 3) return raw.slice(0, max);
  return `${raw.slice(0, max - 3)}...`;
}

export function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader) return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return "";
  return String(match[1] || "").trim();
}

export async function requireAuthUid(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    const uid = trimText(decoded?.uid || "", 140);
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    return uid;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

export function toIsoDate(value, fallbackNow = true) {
  if (!value && fallbackNow) return new Date().toISOString();
  const raw = String(value || "").trim();
  if (!raw) return fallbackNow ? new Date().toISOString() : "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallbackNow ? new Date().toISOString() : "";
  return parsed.toISOString();
}

export function normalizePhoneForDedupe(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

export function normalizeEmailForDedupe(value) {
  return trimText(value || "", 200).toLowerCase();
}

export function normalizeCrmStage(value, fallback = "new") {
  const stage = trimText(value || "", 40).toLowerCase();
  if (CRM_STAGES.includes(stage)) return stage;
  return fallback;
}

export function normalizeTaskStatus(value, fallback = "open") {
  const status = trimText(value || "", 40).toLowerCase();
  if (TASK_STATUSES.includes(status)) return status;
  return fallback;
}

export function normalizeTaskPriority(value, fallback = "med") {
  const priority = trimText(value || "", 40).toLowerCase();
  if (TASK_PRIORITIES.includes(priority)) return priority;
  return fallback;
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export function toNullableNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function chunkArray(items, size = 25) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizePayloadJson(value, depth = 0) {
  if (depth > 4) return null;
  if (value == null) return null;
  if (typeof value === "string") return trimText(value, 1000);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizePayloadJson(item, depth + 1));
  }
  if (isPlainObject(value)) {
    const output = {};
    for (const key of Object.keys(value).slice(0, 30)) {
      output[trimText(key, 60)] = sanitizePayloadJson(value[key], depth + 1);
    }
    return output;
  }
  return null;
}

export async function recordActivityEvent({
  clientId,
  entityType,
  entityId,
  type,
  payload = {},
  createdBy = "",
}) {
  const safeEntityType = trimText(entityType || "", 40).toLowerCase();
  const safeEntityId = trimText(entityId || "", 140);
  const safeType = trimText(type || "", 80).toLowerCase();
  if (!clientId || !safeEntityType || !safeEntityId || !safeType) return null;

  const nowIso = new Date().toISOString();
  const record = {
    client_id: trimText(clientId, 140),
    entity_type: safeEntityType,
    entity_id: safeEntityId,
    type: safeType,
    payload_json: sanitizePayloadJson(payload, 0),
    created_at: nowIso,
    created_by: trimText(createdBy, 140) || null,
  };
  return db.collection("activity_events").add(record);
}

export function buildOperationDocId(uid, idempotencyKey) {
  const raw = `${trimText(uid, 140)}|${trimText(idempotencyKey, 300)}`;
  const hash = crypto.createHash("sha1").update(raw).digest("hex");
  return `merge_${hash}`;
}

export function mergeContactData(base = {}, incoming = {}) {
  const baseName = trimText(base.name || "", 180);
  const incomingName = trimText(incoming.name || "", 180);
  const basePhone = trimText(base.phone || "", 60);
  const incomingPhone = trimText(incoming.phone || "", 60);
  const baseEmail = normalizeEmailForDedupe(base.email || "");
  const incomingEmail = normalizeEmailForDedupe(incoming.email || "");
  const baseInterest = trimText(base.interest || "", 300);
  const incomingInterest = trimText(incoming.interest || "", 300);
  const baseSource = trimText(base.source || "", 80);
  const incomingSource = trimText(incoming.source || "", 80);
  const baseLeadId = trimText(base.source_lead_id || "", 140);
  const incomingLeadId = trimText(incoming.source_lead_id || "", 140);
  const baseNotes = trimText(base.notes || "", 1600);
  const incomingNotes = trimText(incoming.notes || "", 1600);
  const baseStage = normalizeCrmStage(base.stage || "new");
  const incomingStage = normalizeCrmStage(incoming.stage || "new");

  let notes = baseNotes;
  if (!notes && incomingNotes) notes = incomingNotes;
  if (notes && incomingNotes && notes !== incomingNotes) notes = `${notes}\n${incomingNotes}`.slice(0, 1600);

  const stage = baseStage === "new" && incomingStage !== "new" ? incomingStage : baseStage;
  const name = baseName || incomingName || "Sin nombre";
  const phone = basePhone || incomingPhone;
  const email = baseEmail || incomingEmail;
  const interest = baseInterest || incomingInterest;
  const source = baseSource || incomingSource || "manual";
  const sourceLeadId = baseLeadId || incomingLeadId;
  const nowIso = new Date().toISOString();
  const createdAt = toIsoDate(base.created_at || incoming.created_at, true);

  return {
    name,
    phone,
    email,
    interest,
    stage,
    source,
    source_lead_id: sourceLeadId,
    notes,
    created_at: createdAt,
    updated_at: nowIso,
    last_activity_at: nowIso,
    dedupe_phone: normalizePhoneForDedupe(phone),
    dedupe_email: normalizeEmailForDedupe(email),
  };
}

export async function touchContactActivity(clientId, contactId) {
  const safeClientId = trimText(clientId, 140);
  const safeContactId = trimText(contactId, 140);
  if (!safeClientId || !safeContactId) return;
  const contactRef = db.collection("crm_contacts").doc(safeContactId);
  const snap = await contactRef.get();
  if (!snap.exists) return;
  const data = snap.data() || {};
  if (trimText(data.client_id || "", 140) !== safeClientId) return;
  await contactRef.set(
    {
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    },
    { merge: true },
  );
}

export function sanitizeContactInput(input = {}, clientId) {
  const nowIso = new Date().toISOString();
  const name = trimText(input.name || "", 180) || "Sin nombre";
  const phone = trimText(input.phone || "", 60);
  const email = normalizeEmailForDedupe(input.email || "");
  const interest = trimText(input.interest || "", 300);
  const notes = trimText(input.notes || "", 1600);
  const source = trimText(input.source || "", 80) || "manual";
  const sourceLeadId = trimText(input.source_lead_id || "", 140);
  const stage = normalizeCrmStage(input.stage || "new");
  return {
    client_id: trimText(clientId, 140),
    name,
    phone,
    email,
    interest,
    stage,
    source,
    source_lead_id: sourceLeadId,
    notes,
    created_at: toIsoDate(input.created_at, true),
    updated_at: nowIso,
    last_activity_at: nowIso,
    dedupe_phone: normalizePhoneForDedupe(phone),
    dedupe_email: normalizeEmailForDedupe(email),
  };
}
