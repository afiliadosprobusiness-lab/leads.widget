import { db } from "./_firebase.js";

const OWNER_CACHE_TTL_MS = 10 * 60 * 1000;
const widgetOwnerCache = new Map();

function trimText(value, max = 300) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  if (max <= 3) return raw.slice(0, max);
  return `${raw.slice(0, max - 3)}...`;
}

function sanitizeSource(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["lead_chat", "widget_embed", "sales_widget", "dashboard_preview"].includes(normalized)) return normalized;
  return "unknown";
}

function sanitizeEventType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["whatsapp_open", "iacallcloser_open"].includes(normalized)) return normalized;
  return "unknown";
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0];
    return trimText(first, 80);
  }
  return trimText(req.headers["x-real-ip"] || req.socket?.remoteAddress || "", 80);
}

function sanitizeMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value;
  const output = {};
  for (const key of Object.keys(record).slice(0, 8)) {
    output[trimText(key, 32)] = trimText(record[key], 220);
  }
  return output;
}

async function resolveWidgetOwner(widgetIdentityRaw) {
  const widgetIdentity = trimText(widgetIdentityRaw, 140);
  if (!widgetIdentity) return null;

  const now = Date.now();
  const cached = widgetOwnerCache.get(widgetIdentity);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const lookups = ["widget_id", "user_id", "lead_chat_slug"];
  for (const field of lookups) {
    const snap = await db.collection("widget_configs").where(field, "==", widgetIdentity).limit(1).get();
    if (snap.empty) continue;
    const row = snap.docs[0]?.data() || {};
    const value = {
      clientId: trimText(row.user_id || "", 140),
      widgetId: trimText(row.widget_id || widgetIdentity, 140),
    };
    widgetOwnerCache.set(widgetIdentity, { value, expiresAt: now + OWNER_CACHE_TTL_MS });
    return value;
  }

  widgetOwnerCache.set(widgetIdentity, { value: null, expiresAt: now + 60 * 1000 });
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const widgetIdentity = trimText(body.widgetId || "", 140);
    const eventType = sanitizeEventType(body.eventType);
    if (!widgetIdentity) return res.status(400).json({ error: "widgetId is required" });
    if (eventType === "unknown") return res.status(400).json({ error: "eventType is invalid" });

    const owner = await resolveWidgetOwner(widgetIdentity);
    if (!owner?.clientId) return res.status(404).json({ error: "Widget owner not found" });

    const conversationIdCandidate = trimText(body.conversationId || "", 120);
    const conversationId =
      conversationIdCandidate || `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const record = {
      client_id: owner.clientId,
      widget_id: owner.widgetId || widgetIdentity,
      conversation_id: conversationId,
      source: sanitizeSource(body.source),
      event_type: eventType,
      event_meta: sanitizeMeta(body.meta),
      user_timezone: trimText(body.userTimezone || "", 80) || null,
      ip: getClientIp(req),
      user_agent: trimText(req.headers["user-agent"] || "", 260),
      referer: trimText(req.headers.referer || "", 260),
      created_at: new Date().toISOString(),
    };

    await db.collection("ai_chat_events").add(record);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to persist chat event", details: error?.message || "Unknown error" });
  }
}
