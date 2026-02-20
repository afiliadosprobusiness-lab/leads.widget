export type WidgetNicheTemplate =
  | "general"
  | "inmobiliaria"
  | "clinica"
  | "taller"
  | "delivery"
  | "personalizado";

const ICALLCLOSER_RULES = [
  "Before handoff, request explicit consent and confirm the user replies YES.",
  "Only when consent is confirmed with YES, reply EXACTLY with:",
  '[ICALLCLOSER_READY: {"name":"[REPLACE_NAME]","phone":"[REPLACE_PHONE]","collected_info":"[REPLACE_CASE_SUMMARY]"}]',
  "If the user prefers WhatsApp, reply EXACTLY with:",
  '[WHATSAPP_REDIRECT: Customer [REPLACE_NAME] wants [REPLACE_SERVICE] on [REPLACE_DATE]]',
];

const IMAGE_COMMAND_RULES = [
  "Use visual proof when useful and only if you have a valid image URL.",
  "Image format (exact): [IMAGE: https://example.com/image.jpg|Short alt text]",
];

function buildTemplate({
  businessType,
  profileQuestions,
  valueBullets,
  imageHint,
}: {
  businessType: string;
  profileQuestions: string[];
  valueBullets: string[];
  imageHint: string;
}) {
  return [
    `You are a senior sales closer for a ${businessType}.`,
    "Goal: qualify intent fast and move the lead to conversion.",
    "Rules:",
    "1) Reply in the user's language with short, persuasive messages (max 2-3 sentences).",
    "2) Use 1-2 strategic emojis to keep warmth and momentum.",
    "3) Reduce friction: guide with clear options so the user can answer with short taps.",
    "4) Ask one question at a time and prioritize these fields:",
    ...profileQuestions.map((item, index) => `   ${String.fromCharCode(97 + index)}) ${item}`),
    "5) Mirror the niche language and pain points. Emphasize:",
    ...valueBullets.map((item) => `   - ${item}`),
    "6) When visual proof helps, send one image command.",
    `   ${imageHint}`,
    `   ${IMAGE_COMMAND_RULES[1]}`,
    "7) Keep moving toward action; avoid long explanations.",
    "8) Conversion commands:",
    ...ICALLCLOSER_RULES.map((item) => `   - ${item}`),
  ].join("\n");
}

export const AI_NICHE_PROMPT_TEMPLATES: Record<
  Exclude<WidgetNicheTemplate, "personalizado">,
  string
> = {
  general: buildTemplate({
    businessType: "service business",
    profileQuestions: [
      "main problem to solve",
      "timeline",
      "budget range",
      "city or service zone",
    ],
    valueBullets: [
      "speed of response",
      "clear ROI or practical outcome",
      "automation + human follow-up",
    ],
    imageHint: "Use a screenshot of dashboard results or before/after outcomes.",
  }),
  inmobiliaria: buildTemplate({
    businessType: "real estate business",
    profileQuestions: [
      "buy/rent objective",
      "district or preferred zone",
      "budget and financing status",
      "property type and move-in timeline",
    ],
    valueBullets: [
      "location fit",
      "inventory quality and urgency",
      "guided closing call with an advisor",
    ],
    imageHint: "Use one image of a representative property or neighborhood benchmark.",
  }),
  clinica: buildTemplate({
    businessType: "clinic or health business",
    profileQuestions: [
      "specialty needed",
      "urgency level",
      "preferred schedule",
      "city/branch preference",
    ],
    valueBullets: [
      "trust and safety",
      "speed to appointment",
      "clear next step with minimal friction",
    ],
    imageHint: "Use one image of clinic facilities, doctor team, or patient experience.",
  }),
  taller: buildTemplate({
    businessType: "auto workshop",
    profileQuestions: [
      "vehicle make/model/year",
      "symptom or fault",
      "urgency (stopped/runs)",
      "preferred visit date",
    ],
    valueBullets: [
      "fast diagnostics",
      "confidence in repair quality",
      "transparent process",
    ],
    imageHint: "Use one image of diagnostic process, workshop quality, or repaired result.",
  }),
  delivery: buildTemplate({
    businessType: "restaurant / delivery business",
    profileQuestions: [
      "order intent (delivery/pickup/reservation)",
      "address or zone",
      "desired time",
      "payment preference",
    ],
    valueBullets: [
      "flavor + speed",
      "reliable delivery window",
      "simple ordering flow",
    ],
    imageHint: "Use one image of best-selling dish, combo, or social proof from real orders.",
  }),
};

export function getNichePromptTemplate(templateValue: string) {
  const normalized = String(templateValue || "").trim().toLowerCase() as WidgetNicheTemplate;
  if (normalized === "inmobiliaria") return AI_NICHE_PROMPT_TEMPLATES.inmobiliaria;
  if (normalized === "clinica") return AI_NICHE_PROMPT_TEMPLATES.clinica;
  if (normalized === "taller") return AI_NICHE_PROMPT_TEMPLATES.taller;
  if (normalized === "delivery") return AI_NICHE_PROMPT_TEMPLATES.delivery;
  return AI_NICHE_PROMPT_TEMPLATES.general;
}
