import { getBackendUrl } from "../_backend.js";

export default async function handler(req, res) {
  const { widgetId } = req.query || {};
  if (!widgetId) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    return res.status(400).send("// widgetId is required");
  }

  try {
    const upstream = await fetch(`${getBackendUrl()}/api/w/${encodeURIComponent(String(widgetId))}.js`);
    const script = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.send(script);
  } catch (error) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    return res.status(502).send(`// Upstream widget service unavailable: ${error?.message || "unknown error"}`);
  }
}
