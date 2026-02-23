import crypto from "node:crypto";
import {
  db,
  handleOptions,
  parseJsonBody,
  requireAuthUid,
  setCors,
  trimText,
} from "../server/crm/_common.js";

const META_NUMERIC_ID_RE = /^\d{5,25}$/;
const META_ACCESS_TOKEN_MIN_LENGTH = 20;
const CONFIG_COLLECTION = "meta_capi_configs";

function normalizeNumericId(value) {
  return trimText(value || "", 40).replace(/\s+/g, "");
}

function normalizeAdAccountId(value) {
  const normalized = trimText(value || "", 40).replace(/\s+/g, "");
  return normalized.replace(/^act_/i, "");
}

function maskTokenByLast4(value) {
  const normalized = trimText(value || "", 200);
  if (!normalized) return null;
  const suffix = normalized.slice(-4);
  return `****${suffix}`;
}

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

function encryptToken(value, encryptionKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    token_ciphertext_b64: encrypted.toString("base64"),
    token_iv_b64: iv.toString("base64"),
    token_tag_b64: authTag.toString("base64"),
  };
}

function buildPublicConfig(docData = {}) {
  const businessManagerId = trimText(docData.business_manager_id || "", 40);
  const adAccountId = trimText(docData.ad_account_id || "", 40);
  const datasetId = trimText(docData.dataset_id || "", 40);
  const tokenMask = trimText(docData.access_token_mask || "", 20);
  return {
    businessManagerId,
    adAccountId,
    datasetId,
    hasAccessToken: Boolean(tokenMask),
    accessTokenMask: tokenMask || null,
    updatedAt: trimText(docData.updated_at || "", 80) || null,
  };
}

function validateInput({ businessManagerId, adAccountId, datasetId, accessToken, hasStoredToken }) {
  const errors = [];

  if (!businessManagerId) {
    errors.push("El Business Manager ID es obligatorio.");
  } else if (!META_NUMERIC_ID_RE.test(businessManagerId)) {
    errors.push("El Business Manager ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (!adAccountId) {
    errors.push("El Ad Account ID es obligatorio.");
  } else if (!META_NUMERIC_ID_RE.test(adAccountId)) {
    errors.push("El Ad Account ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (!datasetId) {
    errors.push("El Pixel/Dataset ID es obligatorio.");
  } else if (!META_NUMERIC_ID_RE.test(datasetId)) {
    errors.push("El Pixel/Dataset ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (!accessToken && !hasStoredToken) {
    errors.push("El Access Token de Conversions API es obligatorio.");
  } else if (accessToken && accessToken.length < META_ACCESS_TOKEN_MIN_LENGTH) {
    errors.push("El Access Token de Conversions API parece incompleto.");
  }

  return errors;
}

export default async function handler(req, res) {
  setCors(res, "GET,PUT,OPTIONS");
  if (handleOptions(req, res)) return;

  if (req.method !== "GET" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    const configRef = db.collection(CONFIG_COLLECTION).doc(uid);

    if (req.method === "GET") {
      const snap = await configRef.get();
      const data = snap.exists ? snap.data() || {} : {};
      return res.status(200).json({
        success: true,
        config: buildPublicConfig(data),
      });
    }

    const body = parseJsonBody(req);
    const businessManagerId = normalizeNumericId(body.businessManagerId);
    const adAccountId = normalizeAdAccountId(body.adAccountId);
    const datasetId = normalizeNumericId(body.datasetId);
    const accessToken = trimText(body.accessToken || "", 600);

    const snap = await configRef.get();
    const current = snap.exists ? snap.data() || {} : {};
    const hasStoredToken = Boolean(trimText(current.access_token_mask || "", 20));

    const validationErrors = validateInput({
      businessManagerId,
      adAccountId,
      datasetId,
      accessToken,
      hasStoredToken,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0], errors: validationErrors });
    }

    const payload = {
      user_id: uid,
      business_manager_id: businessManagerId,
      ad_account_id: adAccountId,
      dataset_id: datasetId,
      updated_at: new Date().toISOString(),
      created_at: snap.exists ? trimText(current.created_at || "", 80) || new Date().toISOString() : new Date().toISOString(),
    };

    if (accessToken) {
      const encryptionKey = resolveEncryptionKey();
      if (!encryptionKey) {
        return res.status(500).json({
          error: "META_CAPI_ENCRYPTION_KEY no esta configurada en el servidor.",
        });
      }

      const encrypted = encryptToken(accessToken, encryptionKey);
      Object.assign(payload, encrypted, {
        access_token_mask: maskTokenByLast4(accessToken),
        access_token_updated_at: new Date().toISOString(),
      });
    }

    await configRef.set(payload, { merge: true });
    const savedSnap = await configRef.get();
    const savedData = savedSnap.exists ? savedSnap.data() || payload : payload;
    return res.status(200).json({
      success: true,
      config: buildPublicConfig(savedData),
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar la configuracion de Meta CAPI",
      details: error?.message || "Unknown error",
    });
  }
}
