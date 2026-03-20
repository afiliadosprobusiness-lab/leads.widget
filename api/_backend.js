const DEFAULT_BACKEND_URL = "https://leads-widget-backend-319905500449.us-central1.run.app";

export function getBackendUrl() {
  return String(process.env.BACKEND_URL || DEFAULT_BACKEND_URL).trim().replace(/\/$/, "");
}

export function setProxyCors(res, methods = "GET,POST,PATCH,PUT,OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function buildForwardHeaders(req, extraHeaders = {}) {
  const hasBody = !["GET", "HEAD"].includes(String(req.method || "").toUpperCase());
  return {
    ...(req.headers["content-type"]
      ? { "Content-Type": req.headers["content-type"] }
      : (hasBody ? { "Content-Type": "application/json" } : {})),
    ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
    ...extraHeaders,
  };
}

export function serializeRequestBody(body) {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

export async function relayUpstreamResponse(res, upstream, fallbackContentType = "") {
  const payload = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || fallbackContentType;
  const cacheControl = upstream.headers.get("cache-control");

  res.status(upstream.status);
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }
  if (cacheControl) {
    res.setHeader("Cache-Control", cacheControl);
  }

  return res.send(payload);
}

export function appendQueryParams(url, query = {}, excludeKeys = []) {
  const excluded = new Set(excludeKeys);
  for (const [key, rawValue] of Object.entries(query || {})) {
    if (excluded.has(key) || rawValue == null) continue;
    if (Array.isArray(rawValue)) {
      rawValue.forEach((item) => {
        if (item != null) url.searchParams.append(key, String(item));
      });
      continue;
    }
    url.searchParams.set(key, String(rawValue));
  }
  return url;
}
