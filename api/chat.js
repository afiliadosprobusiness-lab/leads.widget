import { getBackendUrl, setProxyCors } from "./_backend.js";
import { db } from "./_firebase.js";
const OWNER_CACHE_TTL_MS = 10 * 60 * 1000;
const widgetOwnerCache = new Map();
const RENIEC_API_DEFAULT_URL = "https://api.apis.net.pe/v2/reniec/dni";
const ELDNI_FORM_URL_DEFAULT = "https://eldni.com/pe/buscar-por-dni";
const ELDNI_FORM_POST_FALLBACK_URL = "https://eldni.com/pe/buscar-datos-por-dni";
const ELDNI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
const DNI_COMMAND_RE = /\[\s*VALIDAR_DNI(?:\s*:\s*([\s\S]*?))?\s*\]|\{\s*validar_dni(?:\s*:\s*([\s\S]*?))?\s*\}/gi;
const DNI_NUMBER_RE = /\b\d{8}\b/;

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

function detectCommandFlags(responseText, overrideFlags = null) {
  const text = String(responseText || "");
  const baseFlags = {
    whatsapp_redirect: /\[WHATSAPP_REDIRECT:/i.test(text),
    icallcloser_ready: /\[(ICALLCLOSER|IACALLCLOSER|ICLOSER)_READY:/i.test(text),
    has_image: /\[(IMAGE|IMG|PHOTO):/i.test(text) || /!\[[^\]]*]\((https?:\/\/[^)]+)\)/i.test(text),
    has_audio: /\[(AUDIO|VOICE|SOUND):/i.test(text),
    has_video: /\[(VIDEO|VID|CLIP):/i.test(text),
    dni_validation: /\[\s*VALIDAR_DNI(?:\s*:|])/i.test(text) || /\{\s*validar_dni(?:\s*:|})/i.test(text),
  };
  if (!overrideFlags || typeof overrideFlags !== "object") return baseFlags;
  return {
    ...baseFlags,
    ...overrideFlags,
  };
}

function extractDni(value) {
  const raw = String(value || "");
  const match = raw.match(DNI_NUMBER_RE);
  return match ? match[0] : "";
}

function extractDniCommand(responseText) {
  const text = String(responseText || "");
  if (!text) return null;
  DNI_COMMAND_RE.lastIndex = 0;
  const match = DNI_COMMAND_RE.exec(text);
  if (!match) return null;
  const payload = trimText(match[1] || match[2] || "", 220);
  return {
    payload,
    dni: extractDni(payload),
    index: match.index,
  };
}

function stripDniCommands(responseText) {
  DNI_COMMAND_RE.lastIndex = 0;
  return String(responseText || "")
    .replace(DNI_COMMAND_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferLocaleFromMessage(body) {
  const normalized = String(body?.message || "").toLowerCase();
  if (!normalized) return "es";
  const englishSignals = /\b(hello|price|pricing|book|schedule|appointment|yes|please|thanks|english|phone|email)\b/;
  if (englishSignals.test(normalized)) return "en";
  return "es";
}

function resolveDniValidationProvider() {
  const normalized = trimText(process.env.DNI_VALIDATION_PROVIDER || "", 40).toLowerCase();
  if (normalized === "capture" || normalized === "manual" || normalized === "none" || normalized === "off") {
    return "capture";
  }
  if (normalized === "api") return "api";
  if (normalized === "eldni") return "eldni";
  if (normalized === "reniec") return "reniec";
  return "auto";
}

function buildCapturedDniResult(dni) {
  const normalizedDni = extractDni(dni);
  if (!/^\d{8}$/.test(normalizedDni)) {
    return { status: "invalid_format", valid: false, dni: "", fullName: "", provider: "capture" };
  }
  return { status: "captured", valid: true, dni: normalizedDni, fullName: "", provider: "capture" };
}

function decodeHtmlText(value) {
  const text = String(value || "");
  if (!text) return "";
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code) || 0))
    .replace(/\s+/g, " ")
    .trim();
}

function readHtmlInputValueById(html, id) {
  const safeId = String(id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`id=["']${safeId}["'][^>]*value=["']([^"']*)["']`, "i");
  const match = String(html || "").match(regex);
  return decodeHtmlText(match?.[1] || "");
}

function parseSetCookieHeader(response) {
  if (!response?.headers) return "";
  if (typeof response.headers.getSetCookie === "function") {
    const values = response.headers.getSetCookie();
    if (Array.isArray(values) && values.length > 0) {
      return values
        .map((item) => String(item || "").split(";")[0].trim())
        .filter(Boolean)
        .join("; ");
    }
  }
  const raw = String(response.headers.get?.("set-cookie") || "").trim();
  if (!raw) return "";
  return raw
    .split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
    .map((item) => item.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function parseEldniIdentity(html, expectedDni) {
  const content = String(html || "");
  if (!content) return { valid: false, dni: expectedDni, fullName: "" };
  if (/No se encontraron datos para el DNI/i.test(content) || /No se encontraron datos/i.test(content)) {
    return { valid: false, dni: expectedDni, fullName: "" };
  }

  const names = readHtmlInputValueById(content, "nombres");
  const paternal = readHtmlInputValueById(content, "apellidop");
  const maternal = readHtmlInputValueById(content, "apellidom");
  const fullName = trimText([names, paternal, maternal].filter(Boolean).join(" ").replace(/\s+/g, " "), 220);

  if (fullName) {
    return { valid: true, dni: expectedDni, fullName };
  }

  const rowMatch = content.match(
    /<tbody>\s*<tr>\s*<td>\s*(\d{8})\s*<\/td>\s*<td>\s*([^<]*)<\/td>\s*<td>\s*([^<]*)<\/td>\s*<td>\s*([^<]*)<\/td>/i,
  );
  if (!rowMatch) return { valid: false, dni: expectedDni, fullName: "" };

  const rowDni = extractDni(rowMatch[1] || "");
  if (rowDni && rowDni !== expectedDni) return { valid: false, dni: expectedDni, fullName: "" };

  const parsedFullName = trimText(
    [decodeHtmlText(rowMatch[2]), decodeHtmlText(rowMatch[3]), decodeHtmlText(rowMatch[4])]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " "),
    220,
  );
  if (!parsedFullName) return { valid: false, dni: expectedDni, fullName: "" };
  return { valid: true, dni: rowDni || expectedDni, fullName: parsedFullName };
}

function buildReniecRequestUrl(dni) {
  const base = trimText(process.env.RENIEC_API_URL || RENIEC_API_DEFAULT_URL, 500);
  if (!base || !dni) return "";
  if (base.includes("{dni}")) {
    return base.replace(/\{dni\}/gi, encodeURIComponent(dni));
  }
  try {
    const parsed = new URL(base);
    const queryParam = trimText(process.env.RENIEC_DNI_QUERY_PARAM || "numero", 40) || "numero";
    if (!parsed.searchParams.has(queryParam)) {
      parsed.searchParams.set(queryParam, dni);
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function buildReniecHeaders() {
  const headers = { Accept: "application/json" };
  const token = trimText(process.env.RENIEC_API_TOKEN || process.env.RENIEC_TOKEN || "", 500);
  if (!token) return headers;

  const authHeader = trimText(process.env.RENIEC_API_TOKEN_HEADER || "Authorization", 60) || "Authorization";
  const rawPrefix = String(process.env.RENIEC_API_TOKEN_PREFIX || "Bearer ").trim();
  const prefix = rawPrefix ? `${rawPrefix} ` : "";
  headers[authHeader] = `${prefix}${token}`.trim();
  return headers;
}

function parseReniecIdentity(payload, inputDni) {
  if (!payload || typeof payload !== "object") return { valid: false, dni: inputDni, fullName: "" };
  const root = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const hasExplicitError = payload?.success === false || root?.success === false || Boolean(payload?.error || root?.error);
  if (hasExplicitError) return { valid: false, dni: inputDni, fullName: "" };

  const candidateDni = extractDni(
    root.numeroDocumento || root.dni || root.numero || root.document || root.documentNumber || payload.numeroDocumento || payload.dni,
  );
  const fullName = trimText(
    root.nombreCompleto ||
      root.nombre_completo ||
      root.fullName ||
      root.full_name ||
      [
        root.nombres || root.names || "",
        root.apellidoPaterno || root.apellido_paterno || root.firstLastName || root.first_last_name || "",
        root.apellidoMaterno || root.apellido_materno || root.secondLastName || root.second_last_name || "",
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    220,
  );

  if (candidateDni === inputDni && fullName) {
    return { valid: true, dni: candidateDni, fullName };
  }
  if (candidateDni === inputDni && !fullName) {
    return { valid: true, dni: candidateDni, fullName: "" };
  }
  if (!candidateDni && fullName) {
    return { valid: true, dni: inputDni, fullName };
  }
  return { valid: false, dni: inputDni, fullName: "" };
}

function buildDniApiRequestUrl(dni) {
  const base = trimText(process.env.DNI_API_URL || "", 500);
  if (!base || !dni) return "";
  if (base.includes("{dni}")) {
    return base.replace(/\{dni\}/gi, encodeURIComponent(dni));
  }
  try {
    const parsed = new URL(base);
    const queryParam = trimText(process.env.DNI_API_DNI_QUERY_PARAM || "dni", 60) || "dni";
    if (!parsed.searchParams.has(queryParam)) {
      parsed.searchParams.set(queryParam, dni);
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function buildDniApiHeaders() {
  const headers = { Accept: "application/json" };
  const token = trimText(process.env.DNI_API_TOKEN || process.env.DNI_API_KEY || "", 500);
  if (!token) return headers;

  const authHeader = trimText(process.env.DNI_API_TOKEN_HEADER || "Authorization", 60) || "Authorization";
  const rawPrefix = String(process.env.DNI_API_TOKEN_PREFIX || "Bearer").trim();
  const prefix = rawPrefix ? `${rawPrefix} ` : "";
  headers[authHeader] = `${prefix}${token}`.trim();
  return headers;
}

function getObjectByPath(root, pathSpec) {
  const source = root && typeof root === "object" ? root : null;
  const rawPath = trimText(pathSpec || "", 120);
  if (!source || !rawPath) return source;
  const parts = rawPath.split(".").map((item) => item.trim()).filter(Boolean);
  if (parts.length === 0) return source;

  let current = source;
  for (const key of parts) {
    if (!current || typeof current !== "object") return null;
    if (!(key in current)) return null;
    current = current[key];
  }
  return current;
}

function hasDniApiNotFoundSignal(payload) {
  if (!payload || typeof payload !== "object") return false;
  const raw = trimText(JSON.stringify(payload), 1000).toLowerCase();
  if (!raw) return false;
  return [
    "not_found",
    "no encontrado",
    "no se encontro",
    "no existe",
    "documento no encontrado",
    "dni no encontrado",
  ].some((signal) => raw.includes(signal));
}

async function validateDniWithApi(dni) {
  if (!/^\d{8}$/.test(String(dni || ""))) {
    return { status: "invalid_format", valid: false, dni: "", fullName: "" };
  }
  const requestUrl = buildDniApiRequestUrl(dni);
  if (!requestUrl) {
    return { status: "not_configured", valid: false, dni, fullName: "", provider: "dni_api" };
  }

  const timeoutMsRaw = Number(process.env.DNI_API_TIMEOUT_MS || process.env.ELDNI_TIMEOUT_MS || 9000);
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? Math.min(Math.round(timeoutMsRaw), 20000) : 9000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const method = String(process.env.DNI_API_METHOD || "GET").trim().toUpperCase() === "POST" ? "POST" : "GET";
    const headers = buildDniApiHeaders();
    const requestInit =
      method === "POST"
        ? {
            method,
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ [trimText(process.env.DNI_API_DNI_BODY_FIELD || "dni", 60) || "dni"]: dni }),
            signal: controller.signal,
          }
        : {
            method,
            headers,
            signal: controller.signal,
          };

    const upstream = await fetch(requestUrl, requestInit);
    const raw = await upstream.text();
    if (!upstream.ok) {
      if (upstream.status === 404 || upstream.status === 422) {
        return { status: "not_found", valid: false, dni, fullName: "", provider: "dni_api" };
      }
      return {
        status: "unavailable",
        valid: false,
        dni,
        fullName: "",
        provider: "dni_api",
        details: trimText(`status_${upstream.status}:${raw}`, 180),
      };
    }

    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
    if (!payload || typeof payload !== "object") {
      return { status: "unavailable", valid: false, dni, fullName: "", provider: "dni_api", details: "invalid_json" };
    }

    const payloadPath = trimText(process.env.DNI_API_RESPONSE_PATH || "", 120);
    const scopedPayload = getObjectByPath(payload, payloadPath) || payload;
    const identity = parseReniecIdentity(scopedPayload, dni);
    if (identity.valid) {
      return { status: "valid", valid: true, dni: identity.dni || dni, fullName: identity.fullName || "", provider: "dni_api" };
    }
    if (hasDniApiNotFoundSignal(scopedPayload) || hasDniApiNotFoundSignal(payload)) {
      return { status: "not_found", valid: false, dni, fullName: "", provider: "dni_api" };
    }
    return { status: "not_found", valid: false, dni, fullName: "", provider: "dni_api" };
  } catch (error) {
    return {
      status: "unavailable",
      valid: false,
      dni,
      fullName: "",
      provider: "dni_api",
      details: trimText(error?.name === "AbortError" ? "timeout" : error?.message || "", 180),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function validateDniWithReniec(dni) {
  if (!/^\d{8}$/.test(String(dni || ""))) {
    return { status: "invalid_format", valid: false, dni: "", fullName: "" };
  }
  const requestUrl = buildReniecRequestUrl(dni);
  if (!requestUrl) {
    return { status: "not_configured", valid: false, dni, fullName: "" };
  }

  const timeoutMsRaw = Number(process.env.RENIEC_API_TIMEOUT_MS || 9000);
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? Math.min(Math.round(timeoutMsRaw), 15000) : 9000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(requestUrl, {
      method: "GET",
      headers: buildReniecHeaders(),
      signal: controller.signal,
    });
    const raw = await upstream.text();
    if (!upstream.ok) {
      if (upstream.status === 404 || upstream.status === 422) {
        return { status: "not_found", valid: false, dni, fullName: "" };
      }
      return {
        status: "unavailable",
        valid: false,
        dni,
        fullName: "",
        details: trimText(raw, 180),
      };
    }

    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
    const identity = parseReniecIdentity(payload, dni);
    if (!identity.valid) {
      return { status: "not_found", valid: false, dni, fullName: "" };
    }
    return { status: "valid", valid: true, dni: identity.dni || dni, fullName: identity.fullName || "", provider: "reniec" };
  } catch (error) {
    return {
      status: "unavailable",
      valid: false,
      dni,
      fullName: "",
      details: trimText(error?.message || "", 180),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isEldniBotProtectionHtml(html) {
  return /captcha|cloudflare|attention required|just a moment/i.test(String(html || ""));
}

function extractEldniToken(html) {
  return (
    trimText(
      String(html || "").match(/<input[^>]*name=["']_token["'][^>]*value=["']([^"']+)["'][^>]*>/i)?.[1] ||
        String(html || "").match(/<input[^>]*value=["']([^"']+)["'][^>]*name=["']_token["'][^>]*>/i)?.[1] ||
        String(html || "").match(/name=["']_token["']\s+value=["']([^"']+)["']/i)?.[1] ||
        "",
      180,
    ) || ""
  );
}

function resolveEldniPostUrl(pageHtml, pageUrl) {
  const actionRaw = trimText(String(pageHtml || "").match(/<form[^>]*action=["']([^"']+)["']/i)?.[1] || "", 500);
  const baseUrl = actionRaw || ELDNI_FORM_POST_FALLBACK_URL;
  try {
    return new URL(baseUrl, pageUrl).toString();
  } catch {
    return ELDNI_FORM_POST_FALLBACK_URL;
  }
}

function shouldRetryEldni(result) {
  if (!result || result.status !== "unavailable") return false;
  const details = String(result.details || "").toLowerCase();
  if (!details) return true;
  return [
    "timeout",
    "abort",
    "rate_limited",
    "csrf",
    "cookie",
    "bot_protection",
    "status_429",
    "status_503",
    "fetch failed",
    "econn",
    "etimedout",
  ].some((key) => details.includes(key));
}

async function validateDniWithEldniAttempt({ dni, pageUrl, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const page = await fetch(pageUrl, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
        "User-Agent": ELDNI_USER_AGENT,
        Referer: pageUrl,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const pageHtml = await page.text();
    if (isEldniBotProtectionHtml(pageHtml)) {
      return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "bot_protection_get" };
    }
    if (!page.ok) {
      return {
        status: "unavailable",
        valid: false,
        dni,
        fullName: "",
        provider: "eldni_public",
        details: `page_status_${page.status}`,
      };
    }

    const token = extractEldniToken(pageHtml);
    if (!token) {
      return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "csrf_missing" };
    }

    const cookieHeader = parseSetCookieHeader(page);
    if (!cookieHeader) {
      return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "cookie_missing" };
    }

    const postUrl = resolveEldniPostUrl(pageHtml, page.url || pageUrl);
    const postOrigin = new URL(postUrl).origin;
    const postBody = new URLSearchParams({ _token: token, dni }).toString();
    const post = await fetch(postUrl, {
      method: "POST",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
        "User-Agent": ELDNI_USER_AGENT,
        Referer: page.url || pageUrl,
        Origin: postOrigin,
        Cookie: cookieHeader,
      },
      body: postBody,
      signal: controller.signal,
      redirect: "follow",
    });

    const html = await post.text();
    if (isEldniBotProtectionHtml(html)) {
      return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "bot_protection_post" };
    }
    if (!post.ok) {
      if (post.status === 404 || post.status === 422) {
        return { status: "not_found", valid: false, dni, fullName: "", provider: "eldni_public" };
      }
      if (post.status === 429) {
        return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "rate_limited" };
      }
      if (post.status === 419) {
        return { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public", details: "csrf_failed" };
      }
      return {
        status: "unavailable",
        valid: false,
        dni,
        fullName: "",
        provider: "eldni_public",
        details: `post_status_${post.status}`,
      };
    }

    const parsed = parseEldniIdentity(html, dni);
    if (!parsed.valid) {
      return { status: "not_found", valid: false, dni, fullName: "", provider: "eldni_public" };
    }

    return {
      status: "valid",
      valid: true,
      dni: parsed.dni || dni,
      fullName: parsed.fullName || "",
      provider: "eldni_public",
    };
  } catch (error) {
    return {
      status: "unavailable",
      valid: false,
      dni,
      fullName: "",
      provider: "eldni_public",
      details: trimText(error?.name === "AbortError" ? "timeout" : error?.message || "", 180),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function validateDniWithEldni(dni) {
  if (!/^\d{8}$/.test(String(dni || ""))) {
    return { status: "invalid_format", valid: false, dni: "", fullName: "", provider: "eldni_public" };
  }

  const configuredFormUrl = trimText(process.env.ELDNI_FORM_URL || "", 500);
  const timeoutMsRaw = Number(process.env.ELDNI_TIMEOUT_MS || process.env.RENIEC_API_TIMEOUT_MS || 12000);
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? Math.min(Math.round(timeoutMsRaw), 20000) : 12000;

  const candidates = [];
  const pushCandidate = (value) => {
    const raw = trimText(value || "", 500);
    if (!raw) return;
    try {
      const parsed = new URL(raw);
      const normalized = parsed.toString();
      if (!candidates.includes(normalized)) candidates.push(normalized);
    } catch {
      // Ignore malformed URL candidates.
    }
  };

  pushCandidate(configuredFormUrl);
  pushCandidate(ELDNI_FORM_URL_DEFAULT);
  pushCandidate(ELDNI_FORM_POST_FALLBACK_URL);
  if (candidates.length === 0) {
    return { status: "not_configured", valid: false, dni, fullName: "", provider: "eldni_public", details: "invalid_form_url" };
  }

  let lastUnavailable = null;
  for (const candidateUrl of candidates) {
    const attempt = await validateDniWithEldniAttempt({ dni, pageUrl: candidateUrl, timeoutMs });
    if (attempt.valid || attempt.status === "not_found" || attempt.status === "invalid_format") return attempt;
    if (attempt.status === "unavailable") lastUnavailable = attempt;

    if (shouldRetryEldni(attempt)) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const retry = await validateDniWithEldniAttempt({ dni, pageUrl: candidateUrl, timeoutMs });
      if (retry.valid || retry.status === "not_found" || retry.status === "invalid_format") return retry;
      if (retry.status === "unavailable") lastUnavailable = retry;
    }
  }

  return lastUnavailable || { status: "unavailable", valid: false, dni, fullName: "", provider: "eldni_public" };
}

async function validateDniIdentity(dni) {
  if (!/^\d{8}$/.test(String(dni || ""))) {
    return { status: "invalid_format", valid: false, dni: "", fullName: "" };
  }

  const provider = resolveDniValidationProvider();
  if (provider === "capture") return buildCapturedDniResult(dni);
  if (provider === "api") return validateDniWithApi(dni);
  if (provider === "eldni") {
    return validateDniWithEldni(dni);
  }
  if (provider === "reniec") return validateDniWithReniec(dni);

  const apiResult = await validateDniWithApi(dni);
  if (apiResult?.valid === true) return apiResult;
  if (apiResult?.status === "not_found" || apiResult?.status === "invalid_format") return apiResult;

  const eldniResult = await validateDniWithEldni(dni);
  if (eldniResult?.valid === true) return eldniResult;
  if (eldniResult?.status === "not_found" || eldniResult?.status === "invalid_format") return eldniResult;

  if (apiResult?.status === "not_found" || apiResult?.status === "invalid_format") return apiResult;
  return buildCapturedDniResult(dni);
}

function buildDniValidationMessage(result, locale = "es") {
  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  const fullName = trimText(result?.fullName || "", 160);
  const provider = String(result?.provider || "eldni_public");
  const normalizedDni = extractDni(result?.dni || "");

  const buildCaptureMessage = () => {
    if (isEnglish) {
      return normalizedDni
        ? `DNI received (${normalizedDni}). Continue qualification.`
        : "DNI received. Continue qualification.";
    }
    return normalizedDni
      ? `DNI recibido (${normalizedDni}). Continuemos con la precalificacion.`
      : "DNI recibido. Continuemos con la precalificacion.";
  };

  if (result?.status === "valid" && result?.valid) {
    const sourceLabel =
      provider === "eldni_public" ? (isEnglish ? "public source" : "fuente publica") : provider === "dni_api" ? "API" : "RENIEC";
    if (isEnglish) {
      return fullName
        ? `Identity verified with ${sourceLabel} for DNI ${result.dni}: ${fullName}. Continue qualification.`
        : `Identity verified with ${sourceLabel} for DNI ${result.dni}. Continue qualification.`;
    }
    return fullName
      ? `Identidad validada con ${sourceLabel} para DNI ${result.dni}: ${fullName}. Continuemos con la precalificacion.`
      : `Identidad validada con ${sourceLabel} para DNI ${result.dni}. Continuemos con la precalificacion.`;
  }

  if (result?.status === "captured") {
    return buildCaptureMessage();
  }

  if (result?.status === "invalid_format") {
    return isEnglish
      ? "To continue, share a valid 8-digit DNI so I can verify it."
      : "Para continuar, comparte un DNI valido de 8 digitos para validarlo.";
  }

  if (
    result?.status === "not_found" ||
    result?.status === "not_configured" ||
    result?.status === "unavailable" ||
    result?.status === "request_failed"
  ) {
    return buildCaptureMessage();
  }

  return buildCaptureMessage();
}

function buildDniContinuationPrompt(locale = "es") {
  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  return isEnglish
    ? "Great. Now share your full name and your estimated budget for the down payment to continue pre-qualification."
    : "Perfecto. Ahora comparte tu nombre completo y tu presupuesto estimado para la cuota inicial para continuar con la precalificacion.";
}

async function requestPromptDrivenDniContinuation({ body, locale, authHeader, validationMessage }) {
  if (!body || typeof body !== "object") return "";
  if (body.__dniContinuation === true) return "";

  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  const continuationInstruction = isEnglish
    ? "DNI already captured with valid 8 digits. Continue with the next pre-qualification step defined in your configured flow. Do not ask for DNI again."
    : "DNI ya capturado con 8 digitos validos. Continua con el siguiente paso de precalificacion definido en tu flujo configurado. No vuelvas a pedir DNI.";

  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  if (validationMessage) {
    history.push({ role: "assistant", content: trimText(validationMessage, 350) });
  }

  const upstreamBody = {
    ...body,
    history,
    message: continuationInstruction,
    __dniContinuation: true,
  };

  try {
    const upstream = await fetch(`${getBackendUrl()}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(upstreamBody),
    });
    const raw = await upstream.text();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (parsed && typeof parsed.response === "string") {
      const cleaned = stripDniCommands(parsed.response);
      return trimText(cleaned || parsed.response, 1200);
    }
    return trimText(raw, 1200);
  } catch (error) {
    console.warn("chat-command: prompt-driven dni continuation failed", error?.message || error);
    return "";
  }
}

function replaceLegacyDniUnavailableMessage(responseText, locale = "es") {
  const text = String(responseText || "");
  if (!text) return text;
  const legacyEs = "La validacion de DNI no esta disponible temporalmente. Intenta nuevamente en unos minutos.";
  const legacyEn = "DNI validation is temporarily unavailable. Please try again in a moment.";
  if (!text.includes(legacyEs) && !text.includes(legacyEn)) return text;

  const fallback = buildDniValidationMessage({ status: "unavailable", valid: false }, locale);
  return text.replace(legacyEs, fallback).replace(legacyEn, fallback);
}

async function applyDniValidationCommand(body, parsedPayload, authHeader = "") {
  if (!parsedPayload || typeof parsedPayload !== "object" || typeof parsedPayload.response !== "string") {
    return { payload: parsedPayload, overrideFlags: null };
  }

  const locale = inferLocaleFromMessage(body);
  const normalizedLegacy = replaceLegacyDniUnavailableMessage(parsedPayload.response, locale);
  if (normalizedLegacy !== parsedPayload.response) {
    return {
      payload: {
        ...parsedPayload,
        response: normalizedLegacy,
      },
      overrideFlags: {
        dni_validation: true,
      },
    };
  }

  const command = extractDniCommand(parsedPayload.response);
  if (!command) {
    return { payload: parsedPayload, overrideFlags: null };
  }

  const fallbackDni = extractDni(body?.message || "");
  const dni = command.dni || fallbackDni;
  const validation = await validateDniIdentity(dni);
  const cleanText = stripDniCommands(parsedPayload.response);
  const validationMessage = buildDniValidationMessage(validation, locale);
  const shouldKeepOriginalText = Boolean(cleanText);
  let continuationPrompt = "";
  if (!shouldKeepOriginalText && validation?.valid === true) {
    continuationPrompt = await requestPromptDrivenDniContinuation({
      body,
      locale,
      authHeader,
      validationMessage,
    });
    if (!continuationPrompt) {
      continuationPrompt = buildDniContinuationPrompt(locale);
    }
  }
  const response = shouldKeepOriginalText
    ? `${cleanText}\n\n${validationMessage}`
    : continuationPrompt
      ? `${validationMessage}\n\n${continuationPrompt}`
      : validationMessage;

  if (!validation?.valid && validation?.status && validation.status !== "not_found" && validation.status !== "invalid_format") {
    console.warn("chat-command: validar_dni non-valid status", {
      status: validation.status,
      provider: validation.provider || "eldni_public",
      details: validation.details || "",
      widgetId: trimText(body?.widgetId || "", 140),
    });
  }

  return {
    payload: {
      ...parsedPayload,
      response,
    },
    overrideFlags: {
      dni_validation: true,
    },
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

async function persistChatLog({ req, body, upstreamStatus, payload, rawPayload, latencyMs, commandFlagsOverride }) {
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
    command_flags: detectCommandFlags(aiResponse, commandFlagsOverride),
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
  setProxyCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const startedAt = Date.now();
    const upstream = await fetch(`${getBackendUrl()}/api/chat`, {
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

    let payloadForClient = parsedPayload;
    let commandFlagsOverride = null;
    try {
      const transformed = await applyDniValidationCommand(req.body || {}, parsedPayload, req.headers.authorization || "");
      payloadForClient = transformed.payload;
      commandFlagsOverride = transformed.overrideFlags;
    } catch (commandError) {
      console.error("chat-command: validar_dni failed", commandError?.message || commandError);
    }

    try {
      await persistChatLog({
        req,
        body: req.body || {},
        upstreamStatus: upstream.status,
        payload: payloadForClient,
        rawPayload,
        latencyMs: Date.now() - startedAt,
        commandFlagsOverride,
      });
    } catch (logError) {
      console.error("chat-log: failed to persist", logError?.message || logError);
    }

    res.status(upstream.status);

    if (payloadForClient) {
      return res.json(payloadForClient);
    }
    return res.send(rawPayload);
  } catch (error) {
    return res.status(502).json({
      error: "Upstream chat service unavailable",
      details: error?.message || "Unknown error",
    });
  }
}
