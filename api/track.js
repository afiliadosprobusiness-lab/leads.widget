import { getBackendUrl, setProxyCors } from "./_backend.js";

export default async function handler(req, res) {
  setProxyCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const upstream = await fetch(`${getBackendUrl()}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body || {}),
    });

    const payload = await upstream.text();
    res.status(upstream.status);
    try {
      return res.json(JSON.parse(payload));
    } catch {
      return res.send(payload);
    }
  } catch (error) {
    return res.status(502).json({
      error: "Upstream track service unavailable",
      details: error?.message || "Unknown error",
    });
  }
}
