import { getAuth } from "firebase-admin/auth";
import { db } from "../server/firebase.js";

const SUPERADMIN_EMAILS = new Set([
  "afiliadosprobusiness@gmail.com",
  "superadmin@leadwidget.pe",
  "superadmin2@leadwidget.pe",
]);

const TRIAL_DAYS = 2;
const DEFAULT_WHATSAPP_CRM_SYNC_URL = "https://whats-crm-compliant.vercel.app/api/v1/admin/sync-subscription";
const DEFAULT_WHATSAPP_CRM_STATUS_URL = "https://whats-crm-compliant.vercel.app/api/v1/admin/subscriptions-by-email";
const DEBUG_ENDPOINT_ENABLED = String(process.env.ENABLE_DEBUG_ENDPOINT || "").trim().toLowerCase() === "true";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return "";
  return String(match[1] || "").trim();
}

function parseJsonBody(req) {
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

function sanitizeBusinessName(value) {
  const normalized = String(value || "").trim();
  if (normalized.length < 2 || normalized.length > 120) return "";
  return normalized;
}

function sanitizeEmail(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized.length > 160) return "";
  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailPattern.test(normalized)) return "";
  return normalized;
}

function sanitizePassword(value) {
  const normalized = String(value || "");
  if (normalized.length < 6 || normalized.length > 72) return "";
  return normalized;
}

function sanitizeMonths(value) {
  if (value === undefined || value === null || value === "") return 1;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) return 0;
  return parsed;
}

function sanitizeEmailList(value) {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => sanitizeEmail(item))
    .filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, 100);
}

function toTrialEndsAt(nowIso, days = TRIAL_DAYS) {
  const now = new Date(nowIso);
  const trialEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return trialEnd.toISOString();
}

async function isSuperAdmin(decoded) {
  const email = String(decoded?.email || "").toLowerCase();
  if (SUPERADMIN_EMAILS.has(email)) return true;
  if (!decoded?.uid) return false;
  const roleSnap = await db.collection("user_roles").doc(decoded.uid).get();
  return roleSnap.exists && String(roleSnap.data()?.role || "").toLowerCase() === "superadmin";
}

function mapCreateError(error) {
  const code = String(error?.code || "").toLowerCase();
  if (code.includes("email-already-exists")) return "El correo ya esta registrado.";
  if (code.includes("invalid-password")) return "La contrasena no cumple con los requisitos de Firebase Auth.";
  if (code.includes("invalid-email")) return "El correo ingresado no es valido.";
  if (code.includes("operation-not-allowed")) return "La creacion de cuentas por correo no esta habilitada.";
  return "No se pudo crear la cuenta.";
}

async function handleCreateClient(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const bearerToken = getBearerToken(req);
  if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

  let createdAuthUid = "";

  try {
    const decoded = await getAuth().verifyIdToken(bearerToken);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });

    const callerIsSuperAdmin = await isSuperAdmin(decoded);
    if (!callerIsSuperAdmin) return res.status(403).json({ error: "Forbidden" });

    const body = parseJsonBody(req);
    const businessName = sanitizeBusinessName(body.businessName);
    const email = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);

    if (!businessName) {
      return res.status(400).json({ error: "businessName must be between 2 and 120 characters" });
    }
    if (!email) {
      return res.status(400).json({ error: "email is invalid" });
    }
    if (!password) {
      return res.status(400).json({ error: "password must be between 6 and 72 characters" });
    }

    const nowIso = new Date().toISOString();
    const authUser = await getAuth().createUser({
      email,
      password,
      displayName: businessName,
      emailVerified: false,
      disabled: false,
    });
    createdAuthUid = authUser.uid;

    await db.collection("profiles").doc(authUser.uid).set({
      email,
      business_name: businessName,
      created_at: nowIso,
      updated_at: nowIso,
      subscription_status: "trial",
      plan_type: "trial",
      trial_ends_at: toTrialEndsAt(nowIso),
      ai_enabled: false,
      ai_model: "gpt-4o-mini",
      referred_by: null,
      account_type: "client",
      partner_id: null,
      partner_role: null,
      attribution_source: null,
      attributed_partner_locked_at: null,
    }, { merge: true });

    await db.collection("user_roles").doc(authUser.uid).set({
      role: "client",
      updated_at: nowIso,
    }, { merge: true });

    createdAuthUid = "";

    return res.status(200).json({
      success: true,
      userId: authUser.uid,
      email,
      businessName,
    });
  } catch (error) {
    if (createdAuthUid) {
      try {
        await getAuth().deleteUser(createdAuthUid);
      } catch (cleanupError) {
        console.error("create client cleanup error", cleanupError);
      }
    }

    const message = mapCreateError(error);
    const status = message === "No se pudo crear la cuenta." ? 500 : 400;
    return res.status(status).json({ error: message });
  }
}

async function handleDebug(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!DEBUG_ENDPOINT_ENABLED) {
    return res.status(404).json({ error: "Not found" });
  }

  const bearerToken = getBearerToken(req);
  if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = await getAuth().verifyIdToken(bearerToken);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });
    const callerIsSuperAdmin = await isSuperAdmin(decoded);
    if (!callerIsSuperAdmin) return res.status(403).json({ error: "Forbidden" });

    const profilesSnap = await db.collection("profiles").limit(1).get();
    return res.status(200).json({
      status: "ok",
      profiles_found: !profilesSnap.empty,
      profiles_count_sample: profilesSnap.size,
      env: {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "set" : "missing",
        serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ? "set" : "missing",
      },
    });
  } catch (_error) {
    return res.status(500).json({ error: "Debug health check failed" });
  }
}

async function handleWhatsappCrmSync(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const bearerToken = getBearerToken(req);
  if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = await getAuth().verifyIdToken(bearerToken);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });

    const callerIsSuperAdmin = await isSuperAdmin(decoded);
    if (!callerIsSuperAdmin) return res.status(403).json({ error: "Forbidden" });

    const body = parseJsonBody(req);
    const email = sanitizeEmail(body.email);
    const enabled = typeof body.enabled === "boolean" ? body.enabled : null;
    const months = sanitizeMonths(body.months);

    if (!email) {
      return res.status(400).json({ error: "email is invalid" });
    }
    if (enabled === null) {
      return res.status(400).json({ error: "enabled must be boolean" });
    }
    if (!months) {
      return res.status(400).json({ error: "months must be between 1 and 12" });
    }

    const syncUrl = String(process.env.WHATSAPP_CRM_SYNC_URL || DEFAULT_WHATSAPP_CRM_SYNC_URL).trim();
    const syncKey = String(process.env.WHATSAPP_CRM_SYNC_KEY || "").trim();
    if (!syncKey) {
      return res.status(503).json({ error: "WHATSAPP_CRM_SYNC_KEY is missing" });
    }

    const upstreamRes = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-sync-key": syncKey,
      },
      body: JSON.stringify({
        email,
        enabled,
        months,
      }),
    });

    const upstreamPayload = await upstreamRes.json().catch(() => ({}));
    if (!upstreamRes.ok) {
      const upstreamMessage =
        String(upstreamPayload?.error?.message || upstreamPayload?.error || "").trim() ||
        `Upstream sync failed (${upstreamRes.status})`;
      return res.status(upstreamRes.status).json({
        error: upstreamMessage,
        upstream: upstreamPayload,
      });
    }

    return res.status(200).json({
      success: true,
      sync: upstreamPayload,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to sync WhatsApp CRM subscription",
      details: String(error?.message || error),
    });
  }
}

async function handleWhatsappCrmStatusBatch(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const bearerToken = getBearerToken(req);
  if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = await getAuth().verifyIdToken(bearerToken);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });

    const callerIsSuperAdmin = await isSuperAdmin(decoded);
    if (!callerIsSuperAdmin) return res.status(403).json({ error: "Forbidden" });

    const body = parseJsonBody(req);
    const emails = sanitizeEmailList(body.emails);
    if (!emails.length) {
      return res.status(400).json({ error: "emails must include at least one valid email" });
    }

    const syncKey = String(process.env.WHATSAPP_CRM_SYNC_KEY || "").trim();
    if (!syncKey) {
      return res.status(503).json({ error: "WHATSAPP_CRM_SYNC_KEY is missing" });
    }

    const statusUrl = String(
      process.env.WHATSAPP_CRM_STATUS_URL ||
      process.env.WHATSAPP_CRM_SYNC_URL ||
      DEFAULT_WHATSAPP_CRM_STATUS_URL,
    ).trim();
    const normalizedStatusUrl = /sync-subscription\/?$/.test(statusUrl)
      ? statusUrl.replace(/sync-subscription\/?$/, "subscriptions-by-email")
      : statusUrl;

    const upstreamRes = await fetch(normalizedStatusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-sync-key": syncKey,
      },
      body: JSON.stringify({ emails }),
    });

    const upstreamPayload = await upstreamRes.json().catch(() => ({}));
    if (!upstreamRes.ok) {
      const upstreamMessage =
        String(upstreamPayload?.error?.message || upstreamPayload?.error || "").trim() ||
        `Upstream status failed (${upstreamRes.status})`;
      return res.status(upstreamRes.status).json({
        error: upstreamMessage,
        upstream: upstreamPayload,
      });
    }

    return res.status(200).json({
      success: true,
      results: Array.isArray(upstreamPayload?.results) ? upstreamPayload.results : [],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch WhatsApp CRM status",
      details: String(error?.message || error),
    });
  }
}

export default async function handler(req, res) {
  setCors(res);

  const adminAction = String(req.query?.adminAction || "").trim().toLowerCase();
  if (adminAction === "create-client") {
    return handleCreateClient(req, res);
  }
  if (adminAction === "whatsapp-crm-sync") {
    return handleWhatsappCrmSync(req, res);
  }
  if (adminAction === "whatsapp-crm-status-batch") {
    return handleWhatsappCrmStatusBatch(req, res);
  }

  return handleDebug(req, res);
}
