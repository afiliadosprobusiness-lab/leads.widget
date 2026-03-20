import {
  appendQueryParams,
  buildForwardHeaders,
  getBackendUrl,
  relayUpstreamResponse,
  serializeRequestBody,
  setProxyCors,
} from "../_backend.js";

function normalizePathSegments(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  const single = String(value || "").trim();
  return single ? [single] : [];
}

function buildUpstreamUrl(req) {
  const segments = normalizePathSegments(req.query?.path);
  const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`${getBackendUrl()}/api/${encodedPath}`);
  appendQueryParams(url, req.query || {}, ["path"]);
  return { url, segments };
}

export default async function handler(req, res) {
  setProxyCors(res, "GET,POST,PATCH,PUT,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url, segments } = buildUpstreamUrl(req);
  if (segments.length === 0) {
    return res.status(400).json({ error: "Backend path is required" });
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: buildForwardHeaders(req),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : serializeRequestBody(req.body),
    });

    return relayUpstreamResponse(res, upstream, "application/json; charset=utf-8");
  } catch (error) {
    return res.status(502).json({
      error: "Upstream backend service unavailable",
      details: error?.message || "Unknown error",
    });
  }
}
