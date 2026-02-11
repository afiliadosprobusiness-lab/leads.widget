const BACKEND_URL = (process.env.BACKEND_URL || "https://leads-widget-backend-g4edrnuqha-uc.a.run.app").replace(/\/$/, "");

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
    const upstream = await fetch(`${BACKEND_URL}/api/chat`, {
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
      error: "Upstream chat service unavailable",
      details: error?.message || "Unknown error",
    });
  }
}
