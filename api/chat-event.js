import { db } from "../server/firebase.js";

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

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 16) return "";
  return `${hasPlus ? "+" : ""}${digits}`;
}

function extractNameCandidate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const patterns = [
    /(?:mi nombre es|me llamo|soy)\s+([A-Za-zÀ-ÿ' -]{2,60})/i,
    /(?:my name is|i am)\s+([A-Za-zÀ-ÿ' -]{2,60})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const candidate = trimText(String(match[1] || "").replace(/\s+/g, " "), 80);
    if (candidate) return candidate;
  }
  return "";
}

function extractPhoneCandidate(value) {
  const text = String(value || "");
  if (!text) return "";
  const match = text.match(/(?:\+?\d[\d\s-]{7,}\d)/);
  if (!match?.[0]) return "";
  return normalizePhone(match[0]);
}

function mapCrmSource(value) {
  const source = sanitizeSource(value);
  if (source === "widget_embed") return "website_widget";
  if (source === "lead_chat") return "lead_chat";
  if (source === "sales_widget") return "sales_widget";
  if (source === "dashboard_preview") return "dashboard_preview";
  return "chat_event";
}

function buildCrmContactDocId(clientId, conversationId, eventType) {
  const raw = `chat_${clientId}_${conversationId}_${eventType}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180) || `chat_${Date.now()}`;
}

function pickPreferredText(currentValue, nextValue, placeholders = []) {
  const current = trimText(currentValue || "", 220);
  const next = trimText(nextValue || "", 220);
  if (!next) return current;
  if (!current) return next;
  const currentIsPlaceholder = placeholders.some((item) => current.toLowerCase() === String(item).toLowerCase());
  if (currentIsPlaceholder) return next;
  if (next.length > current.length + 8) return next;
  return current;
}

async function resolveConversationInsights(clientId, conversationId, fallbackMeta = {}) {
  const conversation = trimText(conversationId || "", 120);
  if (!conversation || !clientId) {
    return { hasLogs: false, name: "", phone: "", interest: "" };
  }

  try {
    const snap = await db.collection("ai_chat_logs").where("conversation_id", "==", conversation).limit(30).get();
    const rows = snap.docs
      .map((docSnap) => docSnap.data() || {})
      .filter((row) => trimText(row.client_id || "", 140) === clientId);

    if (rows.length === 0) {
      const fallbackText = trimText(fallbackMeta.summary || fallbackMeta.message || "", 420);
      return {
        hasLogs: false,
        name: extractNameCandidate(fallbackText),
        phone: normalizePhone(fallbackMeta.phone || "") || extractPhoneCandidate(fallbackText),
        interest: fallbackText,
      };
    }

    rows.sort((a, b) => new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime());
    const mergedText = rows
      .slice(0, 8)
      .map((row) => `${trimText(row.user_message || "", 400)} ${trimText(row.ai_response || "", 240)}`.trim())
      .filter(Boolean)
      .join(" ");

    const latestUserMessage =
      rows.find((row) => trimText(row.user_message || "", 400))?.user_message || trimText(fallbackMeta.summary || "", 420);
    const fallbackText = `${latestUserMessage} ${mergedText}`.trim();

    return {
      hasLogs: true,
      name: extractNameCandidate(fallbackText),
      phone: normalizePhone(fallbackMeta.phone || "") || extractPhoneCandidate(fallbackText),
      interest: trimText(latestUserMessage || fallbackMeta.summary || "", 420),
    };
  } catch {
    const fallbackText = trimText(fallbackMeta.summary || fallbackMeta.message || "", 420);
    return {
      hasLogs: false,
      name: extractNameCandidate(fallbackText),
      phone: normalizePhone(fallbackMeta.phone || "") || extractPhoneCandidate(fallbackText),
      interest: fallbackText,
    };
  }
}

async function upsertCrmContactFromChatEvent({ owner, conversationId, eventType, source, eventMeta }) {
  const nowIso = new Date().toISOString();
  const normalizedEvent = sanitizeEventType(eventType);
  if (!owner?.clientId || !conversationId || normalizedEvent === "unknown") return false;

  const insights = await resolveConversationInsights(owner.clientId, conversationId, eventMeta || {});
  if (!insights.hasLogs) return false;

  const defaultName = normalizedEvent === "whatsapp_open" ? "Lead WhatsApp" : "Lead IACloser";
  const defaultPhone = normalizedEvent === "whatsapp_open" ? "Clic en WhatsApp" : "Clic en IACloser";
  const sourceLeadId = `${conversationId}:${normalizedEvent}`;
  const docId = buildCrmContactDocId(owner.clientId, conversationId, normalizedEvent);
  const contactRef = db.collection("crm_contacts").doc(docId);
  const existingSnap = await contactRef.get();
  const existing = existingSnap.exists ? (existingSnap.data() || {}) : null;

  const preferredName = pickPreferredText(existing?.name || "", insights.name || defaultName, [defaultName]);
  const preferredPhone = pickPreferredText(existing?.phone || "", insights.phone || defaultPhone, [defaultPhone]);
  const preferredInterest = pickPreferredText(existing?.interest || "", insights.interest || "", [""]);
  const sourceLabel = mapCrmSource(source);
  const notesLine = `Auto-creado desde chat_event (${normalizedEvent})`;
  const dedupePhone = normalizePhone(preferredPhone);
  const dedupeEmail = "";

  if (!existing) {
    await contactRef.set({
      client_id: owner.clientId,
      name: preferredName || defaultName,
      phone: preferredPhone || defaultPhone,
      email: "",
      interest: preferredInterest,
      stage: "new",
      source: sourceLabel,
      source_lead_id: sourceLeadId,
      notes: notesLine,
      dedupe_phone: dedupePhone,
      dedupe_email: dedupeEmail,
      created_at: nowIso,
      updated_at: nowIso,
      last_activity_at: nowIso,
    });
    return true;
  }

  await contactRef.set(
    {
      name: preferredName || existing.name || defaultName,
      phone: preferredPhone || existing.phone || defaultPhone,
      interest: preferredInterest || existing.interest || "",
      source: trimText(existing.source || sourceLabel, 80) || sourceLabel,
      source_lead_id: trimText(existing.source_lead_id || sourceLeadId, 180) || sourceLeadId,
      notes: pickPreferredText(existing.notes || "", notesLine, [notesLine]),
      dedupe_phone: dedupePhone || trimText(existing.dedupe_phone || "", 40),
      dedupe_email: trimText(existing.dedupe_email || dedupeEmail, 120),
      updated_at: nowIso,
      last_activity_at: nowIso,
    },
    { merge: true },
  );
  return true;
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
    if (eventType === "whatsapp_open" || eventType === "iacallcloser_open") {
      try {
        await upsertCrmContactFromChatEvent({
          owner,
          conversationId,
          eventType,
          source: record.source,
          eventMeta: record.event_meta || {},
        });
      } catch (crmError) {
        console.error("chat-event: crm upsert failed", crmError?.message || crmError);
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to persist chat event", details: error?.message || "Unknown error" });
  }
}
