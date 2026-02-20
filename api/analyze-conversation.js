const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini";

function trimText(value, max = 800) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  if (max <= 3) return raw.slice(0, max);
  return `${raw.slice(0, max - 3)}...`;
}

function normalizeLogs(rawLogs) {
  if (!Array.isArray(rawLogs)) return [];
  return rawLogs
    .filter((item) => item && typeof item === "object")
    .slice(-16)
    .map((item) => ({
      status: trimText(item.status || "unknown", 20).toLowerCase(),
      user_message: trimText(item.user_message || "", 600),
      ai_response: trimText(item.ai_response || "", 700),
      error_message: trimText(item.error_message || "", 320),
      created_at: trimText(item.created_at || "", 60),
    }))
    .filter((item) => item.user_message || item.ai_response);
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const candidate = raw.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function normalizeAnalysis(input, locale) {
  const fallback = buildHeuristicAnalysis([], locale);
  if (!input || typeof input !== "object") return fallback;
  const record = input;

  const rootCauses = Array.isArray(record.root_causes)
    ? record.root_causes.map((item) => trimText(item, 160)).filter(Boolean).slice(0, 5)
    : [];

  const improvements = Array.isArray(record.improvements)
    ? record.improvements.map((item) => trimText(item, 180)).filter(Boolean).slice(0, 5)
    : [];

  const qualityScoreRaw = Number(record.quality_score);
  const qualityScore = Number.isFinite(qualityScoreRaw)
    ? Math.max(0, Math.min(100, Math.round(qualityScoreRaw)))
    : fallback.qualityScore;

  return {
    summary: trimText(record.summary || fallback.summary, 360),
    rootCauses: rootCauses.length > 0 ? rootCauses : fallback.rootCauses,
    improvements: improvements.length > 0 ? improvements : fallback.improvements,
    promptPatch: trimText(record.prompt_patch || fallback.promptPatch, 600),
    qualityScore,
  };
}

function buildHeuristicAnalysis(logs, locale) {
  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  const userTurns = logs.filter((item) => item.user_message).length;
  const aiTurns = logs.filter((item) => item.ai_response).length;
  const shortAiReplies = logs.filter((item) => item.ai_response && item.ai_response.length < 55).length;
  const ctaMentions = logs.filter((item) => /(whatsapp|wa\.me|contact|write us|escribenos|escribenos|hablemos|agenda|book)/i.test(item.ai_response)).length;

  const qualityScore = Math.max(
    35,
    Math.min(95, 55 + Math.min(userTurns, 5) * 6 - shortAiReplies * 4 + Math.min(ctaMentions, 2) * 8),
  );

  const rootCauses = [];
  if (userTurns <= 1) {
    rootCauses.push(isEnglish ? "The lead had very low engagement (only one turn)." : "El lead tuvo baja interaccion (solo un turno).");
  }
  if (shortAiReplies >= 2) {
    rootCauses.push(isEnglish ? "Several assistant replies were too short and low-context." : "Varias respuestas del asistente fueron demasiado cortas y con poco contexto.");
  }
  if (ctaMentions === 0) {
    rootCauses.push(isEnglish ? "No clear CTA to WhatsApp was detected." : "No se detecto un CTA claro hacia WhatsApp.");
  }
  if (rootCauses.length === 0) {
    rootCauses.push(isEnglish ? "Conversation ended before the strongest close moment." : "La conversacion se corto antes del momento de cierre mas fuerte.");
  }

  const improvements = [
    isEnglish
      ? "Ask one qualification question, then propose WhatsApp in the next response."
      : "Haz una pregunta de precalificacion y en la siguiente respuesta propone WhatsApp.",
    isEnglish
      ? "Use concise benefit-driven proof (time saved, ROI, response speed)."
      : "Usa prueba social concisa orientada a beneficio (tiempo, ROI, rapidez de respuesta).",
    isEnglish
      ? "Close with a single high-clarity CTA button."
      : "Cierra con un solo CTA de alta claridad.",
  ];

  const promptPatch = isEnglish
    ? "After 2 user turns, summarize the main pain point in one line and include exactly one CTA: [WHATSAPP_REDIRECT: ...]."
    : "Despues de 2 turnos del usuario, resume el dolor principal en una linea e incluye exactamente un CTA: [WHATSAPP_REDIRECT: ...].";

  return {
    summary: isEnglish
      ? "The lead did not reach a stable closing sequence before leaving the chat."
      : "El lead no llego a una secuencia de cierre estable antes de salir del chat.",
    rootCauses: rootCauses.slice(0, 5),
    improvements: improvements.slice(0, 5),
    promptPatch,
    qualityScore,
  };
}

function buildTranscript(logs) {
  return logs
    .map((item, index) => {
      const lines = [];
      lines.push(`#${index + 1} status=${item.status || "unknown"} at=${item.created_at || "-"}`);
      if (item.user_message) lines.push(`USER: ${item.user_message}`);
      if (item.ai_response) lines.push(`ASSISTANT: ${item.ai_response}`);
      if (item.error_message) lines.push(`ERROR: ${item.error_message}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

async function callOpenAIAnalysis(logs, locale) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  const transcript = buildTranscript(logs);

  const systemPrompt = [
    "You are a senior conversion analyst for AI sales chats.",
    "Return ONLY valid JSON with keys:",
    "summary (string), root_causes (array of short strings), improvements (array of short strings), prompt_patch (string), quality_score (0-100 number).",
    "Keep it concise and actionable.",
  ].join(" ");

  const userPrompt = isEnglish
    ? `Analyze this unfinished chat and diagnose why conversion failed.\n\n${transcript}`
    : `Analiza este chat no completado y diagnostica por que fallo la conversion.\n\n${transcript}`;

  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const payloadText = await upstream.text();
  if (!upstream.ok) {
    throw new Error(`OpenAI error ${upstream.status}: ${trimText(payloadText, 300)}`);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(payloadText);
  } catch {
    parsed = null;
  }
  const content = parsed?.choices?.[0]?.message?.content || "";
  return extractJsonObject(content);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const locale = String(body.locale || "es").toLowerCase();
    const logs = normalizeLogs(body.logs);

    if (logs.length === 0) {
      return res.status(400).json({ error: "logs are required" });
    }

    let provider = "heuristic";
    let analysis = buildHeuristicAnalysis(logs, locale);

    try {
      const aiOutput = await callOpenAIAnalysis(logs, locale);
      if (aiOutput) {
        analysis = normalizeAnalysis(aiOutput, locale);
        provider = "openai";
      }
    } catch (error) {
      console.error("analyze-conversation: openai fallback", error?.message || error);
    }

    return res.status(200).json({
      success: true,
      provider,
      analysis,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not analyze conversation",
      details: error?.message || "Unknown error",
    });
  }
}
