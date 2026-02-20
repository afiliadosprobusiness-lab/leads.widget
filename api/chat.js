import { db } from "./_firebase.js";

const BACKEND_URL = (process.env.BACKEND_URL || "https://leads-widget-backend-319905500449.us-central1.run.app").replace(/\/$/, "");
const OWNER_CACHE_TTL_MS = 10 * 60 * 1000;
const widgetOwnerCache = new Map();

function trimText(value, max = 500) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  if (max <= 3) return raw.slice(0, max);
  return `${raw.slice(0, max - 3)}...`;
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0];
    return trimText(first, 80);
  }
  return trimText(req.headers["x-real-ip"] || req.socket?.remoteAddress || "", 80);
}

function sanitizeSource(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "unknown";
  if (["lead_chat", "widget_embed", "sales_widget", "dashboard_preview"].includes(normalized)) return normalized;
  return "unknown";
}

function buildHistoryExcerpt(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === "object")
    .slice(-6)
    .map((item) => ({
      role: trimText(item.role || "unknown", 20),
      content: trimText(item.content || "", 280),
    }));
}

function hasSecuritySignal(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;
  const securityRegex =
    /\b(hack|hacker|jailbreak|bypass|exploit|inject|injection|sqlmap|xss|csrf|credential|api key|token|password|vulnerab|ignore (all|previous|system)|prompt injection)\b/i;
  return securityRegex.test(normalized);
}

function detectCommandFlags(responseText) {
  const text = String(responseText || "");
  return {
    whatsapp_redirect: /\[WHATSAPP_REDIRECT:/i.test(text),
    icallcloser_ready: /\[(ICALLCLOSER|IACALLCLOSER|ICLOSER)_READY:/i.test(text),
    has_image: /\[(IMAGE|IMG|PHOTO):/i.test(text) || /!\[[^\]]*]\((https?:\/\/[^)]+)\)/i.test(text),
    has_audio: /\[(AUDIO|VOICE|SOUND):/i.test(text),
  };
}

function deriveStatus(upstreamStatus, payload) {
  const blocked = payload?.blocked === true || upstreamStatus === 403;
  const rateLimited = payload?.rateLimited === true || upstreamStatus === 429;
  const hasError = upstreamStatus >= 500 || Boolean(payload?.error && !payload?.response);
  if (blocked) return { status: "blocked", blocked: true, rateLimited };
  if (rateLimited) return { status: "rate_limited", blocked, rateLimited: true };
  if (hasError) return { status: "error", blocked, rateLimited };
  return { status: "ok", blocked, rateLimited };
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

async function persistChatLog({ req, body, upstreamStatus, payload, rawPayload, latencyMs }) {
  const widgetIdentity = trimText(body?.widgetId || "", 140);
  const userMessage = trimText(body?.message || "", 1200);
  if (!widgetIdentity || !userMessage) return;

  const owner = await resolveWidgetOwner(widgetIdentity);
  if (!owner?.clientId) return;

  const parsedResponse = typeof payload?.response === "string" ? payload.response : "";
  const fallbackResponse = typeof rawPayload === "string" ? rawPayload : "";
  const aiResponse = trimText(parsedResponse || fallbackResponse, 2500);
  const statusData = deriveStatus(upstreamStatus, payload);
  const conversationIdCandidate = trimText(body?.conversationId || "", 120);
  const conversationId =
    conversationIdCandidate || `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const record = {
    client_id: owner.clientId,
    widget_id: owner.widgetId || widgetIdentity,
    conversation_id: conversationId,
    source: sanitizeSource(body?.source),
    status: statusData.status,
    blocked: statusData.blocked,
    rate_limited: statusData.rateLimited,
    user_message: userMessage,
    ai_response: aiResponse,
    error_message: trimText(payload?.error || "", 320) || null,
    history_count: Array.isArray(body?.history) ? body.history.length : 0,
    history_excerpt: buildHistoryExcerpt(body?.history),
    command_flags: detectCommandFlags(aiResponse),
    security_signal: statusData.blocked || hasSecuritySignal(userMessage),
    upstream_status: Number.isFinite(Number(upstreamStatus)) ? Number(upstreamStatus) : null,
    latency_ms: Number.isFinite(Number(latencyMs)) ? Math.max(0, Math.round(Number(latencyMs))) : null,
    user_timezone: trimText(body?.userTimezone || "", 80) || null,
    ip: getClientIp(req),
    user_agent: trimText(req.headers["user-agent"] || "", 260),
    referer: trimText(req.headers.referer || "", 260),
    created_at: new Date().toISOString(),
  };

  await db.collection("ai_chat_logs").add(record);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const startedAt = Date.now();
    const upstream = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body || {}),
    });

    const rawPayload = await upstream.text();
    let parsedPayload = null;
    try {
      parsedPayload = JSON.parse(rawPayload);
    } catch {
      parsedPayload = null;
    }

    try {
      await persistChatLog({
        req,
        body: req.body || {},
        upstreamStatus: upstream.status,
        payload: parsedPayload,
        rawPayload,
        latencyMs: Date.now() - startedAt,
      });
    } catch (logError) {
      console.error("chat-log: failed to persist", logError?.message || logError);
    }

    res.status(upstream.status);

    if (parsedPayload) {
      return res.json(parsedPayload);
    }
    return res.send(rawPayload);
  } catch (error) {
    return res.status(502).json({
      error: "Upstream chat service unavailable",
      details: error?.message || "Unknown error",
    });
  }
}
