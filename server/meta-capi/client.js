import crypto from "node:crypto";
import { db, trimText } from "../crm/_common.js";

const GRAPH_API_BASE = (process.env.META_GRAPH_API_BASE || "https://graph.facebook.com").replace(/\/$/, "");
const GRAPH_API_VERSION = trimText(process.env.META_GRAPH_API_VERSION || "v22.0", 20) || "v22.0";
const EVENT_LOGS_COLLECTION = "meta_capi_event_logs";
const CONFIG_COLLECTION = "meta_capi_configs";

const STAGE_EVENT_MAP = {
  contacted: "Appointment",
  qualified: "QualifiedLead",
  won: "Sale",
};

function resolveEncryptionKey() {
  const raw = String(process.env.META_CAPI_ENCRYPTION_KEY || "").trim();
  if (!raw) return null;

  if (/^[a-fA-F0-9]{64}$/.test(raw)) return Buffer.from(raw, "hex");

  try {
    const asBase64 = Buffer.from(raw, "base64");
    if (asBase64.length === 32) return asBase64;
  } catch {
    // no-op
  }

  return crypto.createHash("sha256").update(raw).digest();
}

function sha256(value) {
  const normalized = trimText(value || "", 300).toLowerCase();
  if (!normalized) return "";
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function normalizePhoneForHash(value) {
  const raw = trimText(value || "", 60);
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

function getClientIp(req) {
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "").trim();
  if (forwarded) return trimText(forwarded.split(",")[0], 80);
  return trimText(req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "", 80);
}

function buildEventLogDocId(uid, eventId) {
  const raw = `${trimText(uid, 140)}|${trimText(eventId, 200)}`;
  const hash = crypto.createHash("sha1").update(raw).digest("hex");
  return `meta_${hash}`;
}

function decryptAccessToken(configRow, encryptionKey) {
  const ciphertextB64 = trimText(configRow?.token_ciphertext_b64 || "", 4000);
  const ivB64 = trimText(configRow?.token_iv_b64 || "", 200);
  const tagB64 = trimText(configRow?.token_tag_b64 || "", 200);
  if (!ciphertextB64 || !ivB64 || !tagB64) return "";
  if (!encryptionKey) return "";

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return trimText(decrypted.toString("utf8"), 1000);
}

function normalizeEventName(value) {
  const raw = trimText(value || "", 64);
  if (!raw) return "";
  return raw.replace(/\s+/g, "");
}

function buildUserData({ contact, req }) {
  const email = trimText(contact?.email || "", 200).toLowerCase();
  const phone = normalizePhoneForHash(contact?.phone || "");
  const externalId = trimText(contact?.id || contact?.external_id || "", 140);
  const userData = {};

  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  if (externalId) userData.external_id = [sha256(externalId)];

  const fbp = trimText(contact?.fbp || "", 200);
  const fbc = trimText(contact?.fbc || "", 200);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const clientIp = getClientIp(req);
  const userAgent = trimText(req?.headers?.["user-agent"] || "", 260);
  if (clientIp) userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;

  return userData;
}

function buildRequestEvent({
  eventName,
  eventId,
  contact,
  req,
  sourceUrl = "",
  customData = {},
  actionSource = "website",
}) {
  const safeEventName = normalizeEventName(eventName);
  const safeEventId = trimText(eventId || "", 200);
  const safeSourceUrl = trimText(sourceUrl || req?.headers?.referer || "", 500);
  const userData = buildUserData({ contact, req });

  return {
    event_name: safeEventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: safeEventId,
    action_source: actionSource,
    event_source_url: safeSourceUrl || undefined,
    user_data: userData,
    custom_data: customData && typeof customData === "object" ? customData : {},
  };
}

export function mapCrmStageToMetaEvent(stage) {
  const normalized = trimText(stage || "", 40).toLowerCase();
  return STAGE_EVENT_MAP[normalized] || "";
}

export function shouldDispatchMetaEventByStage(stage) {
  return Boolean(mapCrmStageToMetaEvent(stage));
}

export async function dispatchMetaCapiEvent({
  uid,
  eventName,
  eventId,
  contact = {},
  req = null,
  customData = {},
  sourceUrl = "",
}) {
  const safeUid = trimText(uid || "", 140);
  const safeEventName = normalizeEventName(eventName);
  const safeEventId = trimText(eventId || "", 200);
  if (!safeUid || !safeEventName || !safeEventId) {
    return { sent: false, reason: "invalid_input" };
  }

  const configSnap = await db.collection(CONFIG_COLLECTION).doc(safeUid).get();
  if (!configSnap.exists) return { sent: false, reason: "not_configured" };

  const configData = configSnap.data() || {};
  const datasetId = trimText(configData.dataset_id || "", 40);
  if (!datasetId) return { sent: false, reason: "missing_dataset_id" };

  const encryptionKey = resolveEncryptionKey();
  if (!encryptionKey) return { sent: false, reason: "missing_encryption_key" };

  let accessToken = "";
  try {
    accessToken = decryptAccessToken(configData, encryptionKey);
  } catch {
    return { sent: false, reason: "cannot_decrypt_access_token" };
  }
  if (!accessToken) return { sent: false, reason: "missing_access_token" };

  const logDocId = buildEventLogDocId(safeUid, safeEventId);
  const logRef = db.collection(EVENT_LOGS_COLLECTION).doc(logDocId);
  const existingLog = await logRef.get();
  if (existingLog.exists && trimText(existingLog.data()?.status || "", 20) === "sent") {
    return { sent: false, reason: "duplicate_event" };
  }

  const requestEvent = buildRequestEvent({
    eventName: safeEventName,
    eventId: safeEventId,
    contact,
    req,
    sourceUrl,
    customData,
  });
  const payload = { data: [requestEvent] };
  const endpoint = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(datasetId)}/events`;

  let upstreamStatus = 0;
  let upstreamBody = "";
  let sent = false;

  try {
    const response = await fetch(`${endpoint}?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    upstreamStatus = response.status;
    upstreamBody = await response.text();
    sent = response.ok;
  } catch (error) {
    upstreamBody = trimText(error?.message || "request_failed", 280);
  }

  await logRef.set(
    {
      user_id: safeUid,
      dataset_id: datasetId,
      event_name: safeEventName,
      event_id: safeEventId,
      status: sent ? "sent" : "error",
      upstream_status: upstreamStatus || null,
      upstream_body: trimText(upstreamBody, 2000) || null,
      contact_id: trimText(contact?.id || "", 140) || null,
      created_at: existingLog.exists ? trimText(existingLog.data()?.created_at || "", 80) || new Date().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  return {
    sent,
    reason: sent ? "ok" : "upstream_error",
    upstreamStatus: upstreamStatus || null,
  };
}
