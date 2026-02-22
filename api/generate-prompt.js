import { getAuth } from "firebase-admin/auth";
import { db } from "./_firebase.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_PROMPT_MODEL || "gpt-4o-mini";

function trimText(value, max = 2000) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  if (max <= 3) return raw.slice(0, max);
  return `${raw.slice(0, max - 3)}...`;
}

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader) return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return "";
  return String(match[1] || "").trim();
}

function normalizeOpenAiModel(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_MODEL;
  if (!/^gpt-/i.test(raw)) return DEFAULT_MODEL;
  return raw;
}

async function resolveUserAiConfig(uid, widgetId) {
  const userId = trimText(uid || "", 140);
  if (!userId) return { apiKey: "", model: DEFAULT_MODEL };

  const profileSnap = await db.collection("profiles").doc(userId).get();
  const profileData = profileSnap.exists ? profileSnap.data() || {} : {};
  const profileApiKey = trimText(profileData.ai_api_key || "", 300);
  const profileModel = normalizeOpenAiModel(profileData.ai_model);

  if (profileApiKey) {
    return { apiKey: profileApiKey, model: profileModel };
  }

  const widgetIdentity = trimText(widgetId || "", 140);
  if (widgetIdentity) {
    for (const field of ["widget_id", "lead_chat_slug"]) {
      const snap = await db
        .collection("widget_configs")
        .where("user_id", "==", userId)
        .where(field, "==", widgetIdentity)
        .limit(1)
        .get();
      if (!snap.empty) {
        const row = snap.docs[0]?.data() || {};
        const apiKey = trimText(row.ai_api_key || "", 300);
        if (apiKey) {
          return { apiKey, model: normalizeOpenAiModel(row.ai_model || profileModel) };
        }
      }
    }
  }

  const fallbackWidgetSnap = await db.collection("widget_configs").where("user_id", "==", userId).limit(1).get();
  if (!fallbackWidgetSnap.empty) {
    const row = fallbackWidgetSnap.docs[0]?.data() || {};
    const apiKey = trimText(row.ai_api_key || "", 300);
    if (apiKey) {
      return { apiKey, model: normalizeOpenAiModel(row.ai_model || profileModel) };
    }
  }

  return { apiKey: "", model: profileModel };
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

function sanitizeAiText(raw) {
  let text = trimText(raw || "", 3000);
  if (!text) return "";
  text = text.replace(/^```(?:text|md|markdown)?\s*/i, "").replace(/```$/i, "").trim();
  return text;
}

function getSystemInstruction(promptType, locale) {
  const isEnglish = String(locale || "").toLowerCase().startsWith("en");
  if (promptType === "system") {
    return isEnglish
      ? "You are a senior prompt engineer for high-converting sales assistants. Return ONLY the final 'system prompt block' text. No markdown fences, no explanations, no JSON."
      : "Eres un ingeniero senior de prompts para asistentes de ventas con alta conversion. Devuelve SOLO el texto final del 'bloque prompt del sistema'. Sin markdown, sin explicaciones, sin JSON.";
  }
  return isEnglish
    ? "You are a senior prompt engineer. Return ONLY the final 'context prompt block' text for a sales assistant. No markdown fences, no explanations, no JSON."
    : "Eres un ingeniero senior de prompts. Devuelve SOLO el texto final del 'bloque prompt de contexto' para un asistente de ventas. Sin markdown, sin explicaciones, sin JSON.";
}

function getUserInstruction(body) {
  const promptType = String(body.promptType || "").toLowerCase();
  const locale = String(body.locale || "es").toLowerCase();
  const isEnglish = locale.startsWith("en");
  const closingMode = String(body.closingMode || "icallcloser").toLowerCase() === "whatsapp" ? "whatsapp" : "icallcloser";

  if (promptType === "system") {
    const source = body.systemData && typeof body.systemData === "object" ? body.systemData : {};
    const lines = [
      isEnglish ? "Build a compact, persuasive system prompt using this data:" : "Construye un prompt del sistema compacto y persuasivo con estos datos:",
      `assistant_role: ${trimText(source.assistantRole || "", 280) || "N/A"}`,
      `main_goal: ${trimText(source.mainGoal || "", 420) || "N/A"}`,
      `response_length: ${trimText(source.responseLength || "", 140) || "N/A"}`,
      `question_strategy: ${trimText(source.questionStrategy || "", 220) || "N/A"}`,
      `required_data: ${trimText(source.requiredData || "", 240) || "N/A"}`,
      `budget_rule: ${trimText(source.budgetRule || "", 260) || "N/A"}`,
      `objection_handling: ${trimText(source.objectionHandling || "", 300) || "N/A"}`,
      `security_level: ${trimText(source.securityLevel || "", 100) || "N/A"}`,
      `blocked_topics: ${trimText(source.blockedTopics || "", 280) || "N/A"}`,
      `fallback_flow: ${trimText(source.fallbackFlow || "", 220) || "N/A"}`,
      `industry_template: ${trimText(body.industry || "", 80) || "general"}`,
      `closing_channel: ${closingMode}`,
      isEnglish
        ? "Important: do not include command tokens ([ICALLCLOSER_READY] or [WHATSAPP_REDIRECT]) because the app injects them automatically."
        : "Importante: no incluyas comandos token ([ICALLCLOSER_READY] o [WHATSAPP_REDIRECT]) porque la app los inyecta automaticamente.",
    ];
    if (closingMode === "whatsapp") {
      lines.push(
        isEnglish
          ? "For WhatsApp channel, define handoff as mandatory after qualification is complete (budget + zone + timeline + required data). Do not frame it as optional preference."
          : "Para canal WhatsApp, define el pase como obligatorio cuando la calificacion este completa (presupuesto + zona + plazo + datos requeridos). No lo redactes como preferencia opcional.",
      );
    }
    if (closingMode === "icallcloser") {
      lines.splice(8, 0, `consent_rule: ${trimText(source.consentRule || "", 260) || "N/A"}`);
    }
    return lines.join("\n");
  }

  const source = body.contextData && typeof body.contextData === "object" ? body.contextData : {};
  return [
    isEnglish ? "Build a practical context prompt for a sales assistant with this business data:" : "Construye un prompt de contexto practico para asistente de ventas con estos datos:",
    `business_name: ${trimText(source.businessName || "", 220) || "N/A"}`,
    `niche: ${trimText(source.niche || "", 120) || "N/A"}`,
    `services: ${trimText(source.services || "", 420) || "N/A"}`,
    `ideal_client: ${trimText(source.idealClient || "", 220) || "N/A"}`,
    `location: ${trimText(source.location || "", 180) || "N/A"}`,
    `price_min: ${trimText(source.priceMin || "", 80) || "N/A"}`,
    `price_max: ${trimText(source.priceMax || "", 80) || "N/A"}`,
    `currency: ${trimText(source.currency || "", 20) || "PEN"}`,
    `differentiator: ${trimText(source.differentiator || "", 300) || "N/A"}`,
    `client_pain: ${trimText(source.clientPain || "", 300) || "N/A"}`,
    `expected_outcome: ${trimText(source.expectedOutcome || "", 300) || "N/A"}`,
    `out_of_scope: ${trimText(source.outOfScope || "", 240) || "N/A"}`,
    `tone: ${trimText(source.tone || "", 40) || "consultive"}`,
    `base_language: ${trimText(source.language || "", 10) || locale || "es"}`,
  ].join("\n");
}

async function generatePromptViaOpenAI({ apiKey, model, promptType, locale, body }) {
  const system = getSystemInstruction(promptType, locale);
  const user = getUserInstruction(body);

  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: normalizeOpenAiModel(model),
      temperature: 0.35,
      max_tokens: 850,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const payloadText = await upstream.text();
  if (!upstream.ok) {
    throw new Error(`OpenAI error ${upstream.status}: ${trimText(payloadText, 260)}`);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(payloadText);
  } catch {
    parsed = null;
  }
  const prompt = sanitizeAiText(parsed?.choices?.[0]?.message?.content || "");
  if (!prompt) {
    throw new Error("OpenAI returned empty prompt");
  }
  return prompt;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = await getAuth().verifyIdToken(bearerToken);
    const uid = trimText(decoded?.uid || "", 140);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = parseJsonBody(req);
    const promptType = String(body.promptType || "").toLowerCase();
    if (promptType !== "context" && promptType !== "system") {
      return res.status(400).json({ error: "promptType must be context or system" });
    }

    const widgetId = trimText(body.widgetId || "", 140);
    const locale = String(body.locale || "es").toLowerCase();
    const { apiKey, model } = await resolveUserAiConfig(uid, widgetId);

    if (!apiKey) {
      return res.status(400).json({
        error: locale.startsWith("en")
          ? "No OpenAI API key configured in IA settings."
          : "No hay API key OpenAI configurada en la seccion IA.",
      });
    }

    const prompt = await generatePromptViaOpenAI({
      apiKey,
      model,
      promptType,
      locale,
      body,
    });

    return res.status(200).json({
      success: true,
      prompt,
      promptType,
      provider: "openai",
      model: normalizeOpenAiModel(model),
      creditsConsumed: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not generate prompt",
      details: error?.message || "Unknown error",
    });
  }
}
