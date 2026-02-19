import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Mic, MicOff, Moon, PhoneCall, Send, ShieldCheck, Smile, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  audioUrl?: string;
};

type Testimonial = {
  id?: string;
  name?: string;
  text?: string;
  stars?: number;
  avatar_url?: string;
};

type PublicWidgetConfig = {
  widgetId: string;
  language?: "es" | "en";
  businessName?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  chatPlaceholder?: string;
  quickReplies?: string[];
  teaserMessages?: string[];
  testimonials?: Testimonial[];
  triggerDelay?: number;
  exitIntentEnabled?: boolean;
  exitIntentTitle?: string;
  exitIntentDescription?: string;
  exitIntentCta?: string;
  consentText?: string;
  consentTextVersion?: string;
  iacloserRedirectUrl?: string;
  leadChatHeadline?: string;
  leadChatSubheadline?: string;
  leadChatEyebrow?: string;
  leadChatBadgeText?: string;
  leadChatOfferTitle?: string;
  leadChatOfferDescription?: string;
  leadChatCtaLabel?: string;
  leadChatLiveToasts?: string[];
};

type CloserSeed = {
  name?: string;
  phone?: string;
  collected_info?: string;
};

const FIXED_IACLOSER_REDIRECT_URL = "https://ai-call-closer.vercel.app/";
const HAS_EMOJI_RE = /[\p{Extended_Pictographic}]/u;
const QUICK_EMOJIS = ["😀", "😄", "🙏", "✨", "🔥", "👍", "🎯", "📞", "✅", "💬", "😊", "🚀"];
const PUBLIC_FIRESTORE_PROJECT_ID = "leads-widget";
const PUBLIC_FIRESTORE_API_KEY = "AIzaSyCXNFoeg1nrYcFHzU9TEKNnDPg1mHU3_tA";

type ChatLocale = "es" | "en";

const SALES_COPY: Record<
  ChatLocale,
  {
    loading: string;
    chatLoadError: string;
    missingIdentity: string;
    defaultBusinessName: string;
    initialMessage: string;
    chatPlaceholder: string;
    quickReplies: string[];
    presenceNow: string;
    presenceNowMessages: string[];
    prequalifyingBadge: string;
    readyBadge: string;
    callingBadge: string;
    typing: string;
    step1Title: string;
    step1Description: string;
    step2Title: string;
    step2Description: string;
    step3Title: string;
    step3Description: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    consentCheckboxLabel: string;
    privacyNote: string;
    trustBullets: string[];
    submitHandoff: string;
    connectingHandoff: string;
    offerTag: string;
    offerTitle: string;
    offerDescription: string;
    offerCta: string;
    continueChat: string;
    voiceUnsupported: string;
    prequalifyFirstError: string;
    connectionIssue: string;
    invalidLeadData: string;
    consentRequired: string;
    handoffSuccess: string;
    activationMessage: string;
    openLeadChat: string;
    liveActivityLabel: string;
    testimonialLabel: string;
    exitIntentDetected: string;
    closeExitIntent: string;
    continueBrowsing: string;
    emojiAria: string;
    micAriaStart: string;
    micAriaStop: string;
    listeningNow: string;
    themeAriaDark: string;
    themeAriaLight: string;
  }
> = {
  es: {
    loading: "Cargando Lead Chat...",
    chatLoadError: "No pudimos abrir este Lead Chat.",
    missingIdentity: "Falta identidad de Lead Chat.",
    defaultBusinessName: "Asistente de pre-calificacion",
    initialMessage:
      "Hola, soy el asistente de pre-calificacion.\nEn menos de 2 minutos podemos llamarte y ayudarte a cerrar o agendar clientes.\n\nQue te gustaria hacer ahora?",
    chatPlaceholder: "Escribe tu mensaje...",
    quickReplies: ["Agendar clientes", "Cerrar ventas por llamada", "Ver como funciona"],
    presenceNow: "3 personas probando la demo ahora",
    presenceNowMessages: [
      "3 personas probando la demo ahora",
      "4 personas evaluando resultados en vivo",
      "6 personas revisando esta demo ahora",
      "5 negocios comparando planes en este momento",
      "7 interesados activos en este chat",
      "8 personas viendo como activar llamadas en menos de 2 min",
      "6 empresas pidiendo una demostracion guiada",
    ],
    prequalifyingBadge: "Precalificando...",
    readyBadge: "Llamada en menos de 2 min",
    callingBadge: "IA llamando...",
    typing: "Escribiendo...",
    step1Title: "Paso 1 - Objetivo",
    step1Description: "Buscamos si prefieres agendar mas clientes o cerrar ventas por llamada.",
    step2Title: "Paso 2 - Telefono + consentimiento",
    step2Description: "Dejanos tu numero y te llamamos en menos de 2 minutos para probarlo en vivo.",
    step3Title: "Paso 3 - Activacion emocional",
    step3Description: "Perfecto. Estamos iniciando tu llamada de prueba ahora mismo.",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre completo",
    phoneLabel: "Telefono",
    phonePlaceholder: "Ej: 14155552671",
    consentCheckboxLabel: "Acepto recibir una llamada automatica de demostracion.",
    privacyNote: "Solo te contactaremos para esta solicitud. No compartimos tu informacion fuera de este proceso.",
    trustBullets: ["Demo real sin costo", "Llamada en menos de 2 minutos", "Sin tarjeta de credito"],
    submitHandoff: "Activar llamada ahora",
    connectingHandoff: "Conectando con IACloser...",
    offerTag: "Oferta activa",
    offerTitle: "Bloquea tu llamada de cierre ahora",
    offerDescription: "Estas en el momento mas caliente. Si activas ahora, IACloser prioriza tu llamada de cierre.",
    offerCta: "Activar llamada",
    continueChat: "Continuar chat",
    voiceUnsupported: "Tu navegador no soporta captura de voz. Usa Chrome o Edge actualizado.",
    prequalifyFirstError: "Primero terminemos la pre-calificacion. Luego activamos la llamada en menos de 2 minutos.",
    connectionIssue: "Tuvimos un problema de conexion. Puedes intentarlo nuevamente.",
    invalidLeadData: "Completa nombre y telefono valido para continuar.",
    consentRequired: "Debes aceptar el consentimiento para activar la llamada.",
    handoffSuccess: "Todo listo. Te llamaremos en menos de 2 minutos.",
    activationMessage: "Perfecto. Estamos iniciando tu llamada de prueba ahora mismo...",
    openLeadChat: "No pudimos iniciar el chat.",
    liveActivityLabel: "Actividad en vivo",
    testimonialLabel: "Testimonios",
    exitIntentDetected: "Intencion de salida detectada",
    closeExitIntent: "Cerrar pop de salida",
    continueBrowsing: "Continuar navegando",
    emojiAria: "Abrir selector de emojis",
    micAriaStart: "Grabar voz",
    micAriaStop: "Detener grabacion de voz",
    listeningNow: "Escuchando... habla ahora y convertimos el audio en texto.",
    themeAriaDark: "Cambiar a modo oscuro",
    themeAriaLight: "Cambiar a modo claro",
  },
  en: {
    loading: "Loading Lead Chat...",
    chatLoadError: "We could not open this Lead Chat.",
    missingIdentity: "Missing Lead Chat identity.",
    defaultBusinessName: "Qualification assistant",
    initialMessage:
      "Hi! I'm the qualification assistant.\nIn under 2 minutes, our AI can call you and help you book or close customers live.\n\nWhat would you like to do?",
    chatPlaceholder: "Type your message...",
    quickReplies: ["Book more appointments", "Close deals by phone", "See how it works"],
    presenceNow: "3 people are testing this demo right now",
    presenceNowMessages: [
      "3 people are testing this demo right now",
      "4 people are checking live outcomes now",
      "6 visitors are reviewing this demo right now",
      "5 businesses are comparing plans at this moment",
      "7 prospects are active in this chat",
      "8 people are learning how to trigger calls in under 2 min",
      "6 companies requested a guided walkthrough",
    ],
    prequalifyingBadge: "Pre-qualifying...",
    readyBadge: "Call in under 2 min",
    callingBadge: "AI calling...",
    typing: "Typing...",
    step1Title: "Step 1 - Goal",
    step1Description: "We identify if you want to book more appointments or close deals by phone.",
    step2Title: "Step 2 - Phone + consent",
    step2Description: "Leave your number and we call you in under 2 minutes for a live demo.",
    step3Title: "Step 3 - Emotional activation",
    step3Description: "Perfect. We are starting your demo call right now.",
    nameLabel: "Name",
    namePlaceholder: "Your full name",
    phoneLabel: "Phone",
    phonePlaceholder: "Ex: 14155552671",
    consentCheckboxLabel: "I agree to receive an automated demo call.",
    privacyNote: "We only contact you for this request. We do not share your data outside this process.",
    trustBullets: ["Real demo at no cost", "Call in under 2 minutes", "No credit card required"],
    submitHandoff: "Start call now",
    connectingHandoff: "Connecting with IACloser...",
    offerTag: "Live offer",
    offerTitle: "Lock your closing call now",
    offerDescription: "You are in the hottest moment. If you activate now, IACloser prioritizes your closing call.",
    offerCta: "Start call",
    continueChat: "Continue chat",
    voiceUnsupported: "Your browser does not support voice capture. Use Chrome or Edge.",
    prequalifyFirstError: "Let's finish pre-qualification first. Then we can trigger a call in under 2 minutes.",
    connectionIssue: "We had a connection issue. Please try again.",
    invalidLeadData: "Please complete name and valid phone number.",
    consentRequired: "You must accept consent to trigger the call.",
    handoffSuccess: "All set. We will call you in under 2 minutes.",
    activationMessage: "Perfect. We are starting your demo call right now...",
    openLeadChat: "We could not start the chat.",
    liveActivityLabel: "Live activity",
    testimonialLabel: "Testimonials",
    exitIntentDetected: "Exit intent detected",
    closeExitIntent: "Close exit popup",
    continueBrowsing: "Continue browsing",
    emojiAria: "Open emoji picker",
    micAriaStart: "Start voice input",
    micAriaStop: "Stop voice input",
    listeningNow: "Listening... speak now and we convert audio to text.",
    themeAriaDark: "Switch to dark mode",
    themeAriaLight: "Switch to light mode",
  },
};

const LEGACY_WELCOME_MESSAGES = [
  "Hola. Soy tu asistente virtual, te ayudo a encontrar la mejor opcion para ti.",
  "Hola! En que podemos ayudarte?",
  "Hi! I am your virtual assistant. How can I help you today?",
];

const LEGACY_QUICK_REPLIES = [
  ["Como funciona?", "Quiero mas informacion", "Ver precios"],
  ["How does it work?", "I want more information", "See pricing"],
  ["Agendar clientes", "Cerrar ventas por llamada", "Ver como funciona"],
  ["Book more appointments", "Close deals by phone", "See how it works"],
];

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function withBotEmoji(value: string) {
  const text = value.trim();
  if (!text) return "✨";
  if (HAS_EMOJI_RE.test(text)) return text;
  return `✨ ${text}`;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeStringArray(value: unknown): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, any>;
    if (Array.isArray(record.arrayValue?.values)) {
      const mapped = record.arrayValue.values.map((item: any) => {
        if (typeof item?.stringValue === "string") return item.stringValue;
        const fields = item?.mapValue?.fields;
        return (
          fields?.message?.stringValue ||
          fields?.text?.stringValue ||
          fields?.label?.stringValue ||
          ""
        );
      });
      return normalizeStringArray(mapped);
    }
    if (typeof record.stringValue === "string") {
      return normalizeStringArray(record.stringValue);
    }
    const singleton = record.message ?? record.text ?? record.label;
    if (typeof singleton === "string") {
      return normalizeStringArray(singleton);
    }
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const candidate = record.message ?? record.text ?? record.label ?? "";
          return typeof candidate === "string" ? candidate.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return normalizeStringArray(JSON.parse(trimmed));
      } catch {
        // noop
      }
    }

    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveLeadChatLiveToasts(raw: Record<string, unknown>) {
  const candidates = [
    raw.leadChatLiveToasts,
    raw.lead_chat_live_toasts,
    raw.liveActivities,
    raw.liveActivityMessages,
    raw.live_activities,
  ];

  for (const candidate of candidates) {
    const parsed = normalizeStringArray(candidate).slice(0, 12);
    if (parsed.length > 0) return parsed;
  }

  return [];
}

function parseNumberCandidate(value: unknown, fallback = 5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

type FirestoreQueryResult = Array<{
  document?: {
    fields?: Record<string, any>;
  };
}>;

function parseFirestoreStringListField(field: any) {
  if (!field) return [];
  if (Array.isArray(field)) return normalizeStringArray(field);
  if (typeof field === "string") return normalizeStringArray(field);

  if (field.arrayValue?.values && Array.isArray(field.arrayValue.values)) {
    const mapped = field.arrayValue.values.map((item: any) => {
      if (typeof item?.stringValue === "string") return item.stringValue;
      const fields = item?.mapValue?.fields;
      return (
        fields?.message?.stringValue ||
        fields?.text?.stringValue ||
        fields?.label?.stringValue ||
        ""
      );
    });
    return normalizeStringArray(mapped);
  }

  if (typeof field.stringValue === "string") return normalizeStringArray(field.stringValue);
  return [];
}

async function fetchLeadChatLiveToastsFromFirestore(identity: string) {
  if (!identity) return [];

  const url = `https://firestore.googleapis.com/v1/projects/${PUBLIC_FIRESTORE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${PUBLIC_FIRESTORE_API_KEY}`;
  const candidates = [
    { fieldPath: "lead_chat_slug", value: identity },
    { fieldPath: "widget_id", value: identity },
    { fieldPath: "user_id", value: identity },
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "widget_configs" }],
            where: {
              fieldFilter: {
                field: { fieldPath: candidate.fieldPath },
                op: "EQUAL",
                value: { stringValue: candidate.value },
              },
            },
            limit: 1,
          },
        }),
      });

      if (!response.ok) continue;
      const data = (await response.json()) as FirestoreQueryResult;
      const fields = data?.[0]?.document?.fields;
      const toasts = parseFirestoreStringListField(fields?.lead_chat_live_toasts).slice(0, 12);
      if (toasts.length > 0) return toasts;
    } catch {
      // noop
    }
  }

  return [];
}

function resolveLocale(input: unknown): ChatLocale {
  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase();
    if (normalized === "en") return "en";
    if (normalized === "es") return "es";
  }

  if (typeof navigator !== "undefined" && String(navigator.language || "").toLowerCase().startsWith("en")) {
    return "en";
  }
  return "es";
}

function arraysLooselyMatch(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => normalizeText(item) === normalizeText(b[index] || ""));
}

function shouldUseSalesQuickReplies(candidate: string[]) {
  if (candidate.length === 0) return true;
  return LEGACY_QUICK_REPLIES.some((legacy) => arraysLooselyMatch(candidate, legacy));
}

function resolveWelcomeMessage(rawWelcome: unknown, locale: ChatLocale) {
  const fallback = SALES_COPY[locale].initialMessage;
  const candidate = typeof rawWelcome === "string" ? rawWelcome.trim() : "";
  if (!candidate) return fallback;
  if (LEGACY_WELCOME_MESSAGES.some((legacy) => normalizeText(legacy) === normalizeText(candidate))) {
    return fallback;
  }
  return candidate;
}

function resolveQuickReplies(rawQuickReplies: unknown, locale: ChatLocale) {
  const parsed = normalizeStringArray(rawQuickReplies).slice(0, 8);
  if (shouldUseSalesQuickReplies(parsed)) {
    return [...SALES_COPY[locale].quickReplies];
  }
  return parsed;
}

function normalizeTestimonials(value: unknown): Testimonial[] {
  let source: unknown = value;

  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as Record<string, any>;
    if (Array.isArray(record.arrayValue?.values)) {
      source = record.arrayValue.values;
    } else if (typeof record.stringValue === "string") {
      source = record.stringValue;
    }
  }

  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        source = JSON.parse(trimmed);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        if (!text) return null;
        return {
          id: "",
          name: "Cliente",
          text,
          stars: 5,
          avatar_url: "",
        } as Testimonial;
      }
      if (!item || typeof item !== "object") return null;

      const firestoreMap = (item as Record<string, any>).mapValue?.fields;
      const record = (firestoreMap && typeof firestoreMap === "object"
        ? {
            id: firestoreMap.id?.stringValue,
            name: firestoreMap.name?.stringValue ?? firestoreMap.author?.stringValue,
            text:
              firestoreMap.text?.stringValue ??
              firestoreMap.quote?.stringValue ??
              firestoreMap.message?.stringValue,
            stars:
              firestoreMap.stars?.doubleValue ??
              firestoreMap.stars?.integerValue ??
              firestoreMap.stars?.stringValue,
            avatar_url:
              firestoreMap.avatar_url?.stringValue ??
              firestoreMap.avatarUrl?.stringValue ??
              firestoreMap.avatar?.stringValue,
          }
        : item) as Record<string, unknown>;

      const text =
        typeof record.text === "string"
          ? record.text.trim()
          : typeof record.quote === "string"
            ? String(record.quote).trim()
            : typeof record.message === "string"
              ? String(record.message).trim()
              : "";

      if (!text) return null;

      const name =
        typeof record.name === "string"
          ? record.name.trim()
          : typeof record.author === "string"
            ? String(record.author).trim()
            : "Cliente";

      return {
        id: typeof record.id === "string" ? record.id : "",
        name: name || "Cliente",
        text,
        stars: parseNumberCandidate(record.stars, 5),
        avatar_url:
          typeof record.avatar_url === "string"
            ? record.avatar_url
            : typeof record.avatar === "string"
              ? String(record.avatar)
              : typeof record.avatarUrl === "string"
                ? String(record.avatarUrl)
                : "",
      } as Testimonial;
    })
    .filter((item): item is Testimonial => Boolean(item) && Boolean(item.text));
}

function resolveTestimonials(raw: Record<string, unknown>) {
  const candidates = [
    raw.testimonials,
    raw.testimonials_json,
    raw.testimonialsJson,
    raw.leadChatTestimonials,
    raw.lead_chat_testimonials,
  ];

  for (const candidate of candidates) {
    const parsed = normalizeTestimonials(candidate).slice(0, 10);
    if (parsed.length > 0) return parsed;
  }

  return [];
}

async function fetchLeadChatTestimonialsFromFirestore(identity: string) {
  if (!identity) return [];

  const url = `https://firestore.googleapis.com/v1/projects/${PUBLIC_FIRESTORE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${PUBLIC_FIRESTORE_API_KEY}`;
  const candidates = [
    { fieldPath: "lead_chat_slug", value: identity },
    { fieldPath: "widget_id", value: identity },
    { fieldPath: "user_id", value: identity },
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "widget_configs" }],
            where: {
              fieldFilter: {
                field: { fieldPath: candidate.fieldPath },
                op: "EQUAL",
                value: { stringValue: candidate.value },
              },
            },
            limit: 1,
          },
        }),
      });

      if (!response.ok) continue;
      const data = (await response.json()) as FirestoreQueryResult;
      const fields = data?.[0]?.document?.fields || {};
      const parsed = resolveTestimonials({
        testimonials: fields.testimonials,
        testimonials_json: fields.testimonials_json,
      });
      if (parsed.length > 0) return parsed;
    } catch {
      // noop
    }
  }

  return [];
}

function parseIACCloserSeed(responseText: string) {
  const fullMatch = responseText.match(/\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)\s*:\s*([\s\S]*?)\]/i);
  const bareMatch = responseText.match(/\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)\s*\]/i);

  if (!fullMatch && !bareMatch) {
    return { isReady: false, cleanText: responseText, seed: {} as CloserSeed };
  }

  let seed: CloserSeed = {};
  if (fullMatch?.[1]) {
    try {
      const parsed = JSON.parse(fullMatch[1]);
      if (parsed && typeof parsed === "object") {
        seed = {
          name: typeof parsed.name === "string" ? parsed.name.trim() : "",
          phone: typeof parsed.phone === "string" ? parsed.phone.trim() : "",
          collected_info: typeof parsed.collected_info === "string" ? parsed.collected_info.trim() : "",
        };
      }
    } catch {
      seed = {};
    }
  }

  const cleanText = responseText
    .replace(fullMatch?.[0] || "", "")
    .replace(bareMatch?.[0] || "", "")
    .trim();

  return { isReady: true, cleanText, seed };
}

export default function LeadChat() {
  const { identity = "" } = useParams();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [sending, setSending] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [assistantDraft, setAssistantDraft] = useState("");
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [config, setConfig] = useState<PublicWidgetConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [consentVisible, setConsentVisible] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadConsentAccepted, setLeadConsentAccepted] = useState(false);
  const [handoffEligible, setHandoffEligible] = useState(false);
  const [collectedInfoSeed, setCollectedInfoSeed] = useState("");
  const [handoffMessage, setHandoffMessage] = useState("");
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeLiveActivityIndex, setActiveLiveActivityIndex] = useState(0);
  const [presenceNowIndex, setPresenceNowIndex] = useState(0);
  const [testimonialTransition, setTestimonialTransition] = useState(false);
  const [liveActivityTransition, setLiveActivityTransition] = useState(false);
  const [activeTeaser, setActiveTeaser] = useState("");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [locale, setLocale] = useState<ChatLocale>("es");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const consentPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const copy = useMemo(() => SALES_COPY[locale], [locale]);

  const appendAssistantWithTypewriter = (text: string) =>
    new Promise<void>((resolve) => {
      const cleanText = withBotEmoji(text);
      if (!cleanText) {
        resolve();
        return;
      }

      const chars = Array.from(cleanText);
      let index = 0;
      const speed = chars.length > 220 ? 8 : chars.length > 140 ? 12 : 16;

      setAssistantTyping(true);
      setAssistantDraft("");

      const intervalId = window.setInterval(() => {
        index += 1;
        setAssistantDraft(chars.slice(0, index).join(""));

        if (index >= chars.length) {
          window.clearInterval(intervalId);
          window.setTimeout(() => {
            setMessages((prev) => [...prev, { role: "assistant", content: cleanText }]);
            setAssistantTyping(false);
            setAssistantDraft("");
            resolve();
          }, 120);
        }
      }, speed);
    });

  useEffect(() => {
    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const response = await fetch(`/api/widget-config/${encodeURIComponent(identity)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.config) {
          throw new Error(payload?.error || "Could not load config");
        }

        const raw = payload.config as Record<string, unknown>;
        const resolvedLocale = resolveLocale(raw.language);
        const localeCopy = SALES_COPY[resolvedLocale];
        let resolvedTestimonials = resolveTestimonials(raw);
        if (resolvedTestimonials.length === 0) {
          resolvedTestimonials = await fetchLeadChatTestimonialsFromFirestore(identity);
        }
        let resolvedLiveToasts = resolveLeadChatLiveToasts(raw);
        if (resolvedLiveToasts.length === 0) {
          resolvedLiveToasts = await fetchLeadChatLiveToastsFromFirestore(identity);
        }
        const normalized: PublicWidgetConfig = {
          widgetId: String(raw.widgetId || raw.widget_id || identity || ""),
          language: resolvedLocale,
          businessName: String(raw.businessName || raw.business_name || localeCopy.defaultBusinessName),
          primaryColor: String(raw.primaryColor || raw.primary_color || "#00C185"),
          welcomeMessage: resolveWelcomeMessage(raw.welcomeMessage ?? raw.welcome_message, resolvedLocale),
          chatPlaceholder: String(raw.chatPlaceholder || raw.chat_placeholder || localeCopy.chatPlaceholder),
          quickReplies: resolveQuickReplies(raw.quickReplies ?? raw.quick_replies, resolvedLocale),
          teaserMessages: normalizeStringArray(raw.teaserMessages ?? raw.teaser_messages).slice(0, 12),
          testimonials: resolvedTestimonials,
          triggerDelay: Number(raw.triggerDelay || raw.trigger_delay || 5),
          exitIntentEnabled:
            typeof raw.exitIntentEnabled === "boolean"
              ? raw.exitIntentEnabled
              : typeof raw.trigger_exit_intent === "boolean"
                ? raw.trigger_exit_intent
                : true,
          exitIntentTitle: String(raw.exitIntentTitle || raw.exit_intent_title || "Wait"),
          exitIntentDescription: String(
            raw.exitIntentDescription || raw.exit_intent_description || localeCopy.offerDescription,
          ),
          exitIntentCta: String(raw.exitIntentCta || raw.exit_intent_cta || localeCopy.continueChat),
          consentText: String(
            raw.consentText || raw.consent_text || localeCopy.consentCheckboxLabel,
          ),
          consentTextVersion: String(raw.consentTextVersion || raw.consent_text_version || "v1"),
          iacloserRedirectUrl: String(raw.iacloserRedirectUrl || raw.icloser_redirect_url || FIXED_IACLOSER_REDIRECT_URL),
          leadChatHeadline: String(raw.leadChatHeadline || raw.lead_chat_headline || localeCopy.offerTitle),
          leadChatSubheadline: String(
            raw.leadChatSubheadline ||
              raw.lead_chat_subheadline ||
              localeCopy.step2Description,
          ),
          leadChatEyebrow: String(raw.leadChatEyebrow || raw.lead_chat_eyebrow || "Lead Chat"),
          leadChatBadgeText: String(raw.leadChatBadgeText || raw.lead_chat_badge_text || localeCopy.readyBadge),
          leadChatOfferTitle: String(raw.leadChatOfferTitle || raw.lead_chat_offer_title || localeCopy.offerTitle),
          leadChatOfferDescription: String(
            raw.leadChatOfferDescription ||
              raw.lead_chat_offer_description ||
              localeCopy.offerDescription,
          ),
          leadChatCtaLabel: String(raw.leadChatCtaLabel || raw.lead_chat_cta_label || localeCopy.offerCta),
          leadChatLiveToasts: resolvedLiveToasts,
        };

        setLocale(resolvedLocale);
        setConfig(normalized);
        setMessages([
          {
            role: "assistant",
            content: withBotEmoji(normalized.welcomeMessage || localeCopy.initialMessage),
          },
        ]);
      } catch (error: any) {
        setChatError(error?.message || SALES_COPY.en.openLeadChat);
      } finally {
        setLoadingConfig(false);
      }
    };

    if (identity) {
      loadConfig();
    } else {
      setLoadingConfig(false);
      setChatError(SALES_COPY.en.missingIdentity);
    }
  }, [identity]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, assistantTyping, assistantDraft, consentVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setThemeMode(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = locale === "es" ? "es-ES" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || "";
      }
      setInput(transcript.trim());
    };

    recognition.onend = () => setSpeechListening(false);
    recognition.onerror = () => setSpeechListening(false);

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
      recognitionRef.current = null;
    };
  }, [locale]);

  const quickReplies = useMemo(() => {
    const parsed = Array.isArray(config?.quickReplies) ? config.quickReplies.filter(Boolean).slice(0, 8) : [];
    if (shouldUseSalesQuickReplies(parsed)) {
      return [...copy.quickReplies];
    }
    return parsed;
  }, [config?.quickReplies, copy.quickReplies]);

  const testimonials = useMemo(
    () => (Array.isArray(config?.testimonials) ? config.testimonials.slice(0, 10) : []),
    [config?.testimonials],
  );
  const liveActivityMessages = useMemo(
    () => (Array.isArray(config?.leadChatLiveToasts) ? config.leadChatLiveToasts.filter(Boolean).slice(0, 12) : []),
    [config?.leadChatLiveToasts],
  );
  const showLiveActivityStrip = liveActivityMessages.length > 0;

  const userMessageCount = useMemo(
    () => messages.filter((msg) => msg.role === "user").length,
    [messages],
  );

  const shouldShowInlineOffer = useMemo(
    () => handoffEligible && !consentVisible && !handoffMessage && !offerDismissed && userMessageCount >= 2,
    [handoffEligible, consentVisible, handoffMessage, offerDismissed, userMessageCount],
  );

  const activeTestimonial = useMemo(() => {
    if (testimonials.length === 0) return null;
    return testimonials[activeTestimonialIndex % testimonials.length];
  }, [activeTestimonialIndex, testimonials]);
  const activeLiveActivityMessage = useMemo(() => {
    if (liveActivityMessages.length === 0) return "";
    return liveActivityMessages[activeLiveActivityIndex % liveActivityMessages.length] || "";
  }, [activeLiveActivityIndex, liveActivityMessages]);
  const testimonialStripText = activeTestimonial?.text || copy.offerDescription;
  const testimonialStripMeta = `${activeTestimonial?.name || copy.defaultBusinessName} • ${"★".repeat(Math.max(1, Math.min(5, Number(activeTestimonial?.stars || 5))))}`;
  const hasTestimonialStrip = Boolean(activeTestimonial);
  const presenceMessages = useMemo(() => {
    const source = Array.isArray(copy.presenceNowMessages) ? copy.presenceNowMessages.filter(Boolean) : [];
    return source.length > 0 ? source : [copy.presenceNow];
  }, [copy.presenceNowMessages, copy.presenceNow]);
  const activePresenceMessage = useMemo(
    () => presenceMessages[presenceNowIndex % presenceMessages.length] || copy.presenceNow,
    [copy.presenceNow, presenceMessages, presenceNowIndex],
  );

  useEffect(() => {
    setActiveTestimonialIndex(0);
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (!hasTestimonialStrip) return;
    setTestimonialTransition(true);
    const timeoutId = window.setTimeout(() => setTestimonialTransition(false), 650);
    return () => window.clearTimeout(timeoutId);
  }, [activeTestimonialIndex, hasTestimonialStrip, testimonialStripText]);

  useEffect(() => {
    setActiveLiveActivityIndex(0);
  }, [liveActivityMessages.length]);

  useEffect(() => {
    if (!showLiveActivityStrip || liveActivityMessages.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveLiveActivityIndex((prev) => (prev + 1) % liveActivityMessages.length);
    }, 4300);
    return () => window.clearInterval(interval);
  }, [showLiveActivityStrip, liveActivityMessages.length]);

  useEffect(() => {
    if (!showLiveActivityStrip || !activeLiveActivityMessage) return;
    setLiveActivityTransition(true);
    const timeoutId = window.setTimeout(() => setLiveActivityTransition(false), 650);
    return () => window.clearTimeout(timeoutId);
  }, [showLiveActivityStrip, activeLiveActivityIndex, activeLiveActivityMessage]);

  useEffect(() => {
    setPresenceNowIndex(0);
  }, [presenceMessages]);

  useEffect(() => {
    if (presenceMessages.length <= 1) return;
    const interval = window.setInterval(() => {
      setPresenceNowIndex((prev) => (prev + 1) % presenceMessages.length);
    }, 6200);
    return () => window.clearInterval(interval);
  }, [presenceMessages]);

  useEffect(() => {
    const source = Array.isArray(config?.teaserMessages) ? config.teaserMessages.filter(Boolean) : [];
    if (source.length === 0 || consentVisible || !!handoffMessage || !!input.trim() || sending || assistantTyping) {
      setTeaserVisible(false);
      return;
    }

    let index = Math.floor(Math.random() * source.length);
    let hideTimeout: number | undefined;
    const startupDelay = Math.max(4, Number(config?.triggerDelay || 5)) * 1000;

    const showTeaser = () => {
      setActiveTeaser(source[index] || "");
      setTeaserVisible(true);
      index = (index + 1) % source.length;
      hideTimeout = window.setTimeout(() => setTeaserVisible(false), 4200);
    };

    const startTimeout = window.setTimeout(showTeaser, startupDelay);
    const intervalId = window.setInterval(showTeaser, 8500);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(intervalId);
      if (hideTimeout) window.clearTimeout(hideTimeout);
    };
  }, [config?.teaserMessages, config?.triggerDelay, consentVisible, handoffMessage, input, sending, assistantTyping]);

  useEffect(() => {
    if (config?.exitIntentEnabled === false || exitIntentShown || showExitIntent || consentVisible || !!handoffMessage) return;
    const desktopPointer = window.matchMedia("(min-width: 1024px) and (pointer:fine)").matches;
    if (!desktopPointer) return;

    const handleExitIntent = (event: MouseEvent) => {
      const isExit = event.clientY <= 6 || (event.relatedTarget === null && event.clientY < 10);
      if (!isExit) return;
      setExitIntentShown(true);
      setShowExitIntent(true);
    };

    document.addEventListener("mouseout", handleExitIntent);
    document.addEventListener("mouseleave", handleExitIntent);
    return () => {
      document.removeEventListener("mouseout", handleExitIntent);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [config?.exitIntentEnabled, consentVisible, handoffMessage, exitIntentShown, showExitIntent]);

  const conversationHistory = useMemo(
    () => messages.filter((msg) => msg.role !== "system").map((msg) => ({ role: msg.role, content: msg.content })),
    [messages],
  );

  const buildCollectedInfo = () => {
    if (collectedInfoSeed) return collectedInfoSeed;
    return conversationHistory
      .slice(-12)
      .map((entry) => `${entry.role}: ${entry.content}`)
      .join(" | ")
      .slice(0, 1800);
  };

  const toggleSpeechInput = () => {
    if (!recognitionRef.current) {
      setChatError(copy.voiceUnsupported);
      return;
    }
    setChatError("");
    if (speechListening) {
      recognitionRef.current.stop();
      setSpeechListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setSpeechListening(true);
    } catch {
      setSpeechListening(false);
    }
  };

  const appendEmojiToInput = (emoji: string) => {
    setInput((prev) => `${prev}${emoji}`);
    setEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  const openConsentStep = () => {
    if (!handoffEligible) {
      setChatError(copy.prequalifyFirstError);
      return;
    }

    setChatError("");
    setLeadConsentAccepted(false);
    setOfferDismissed(true);
    setShowExitIntent(false);
    setConsentVisible(true);
    window.setTimeout(() => {
      const container = scrollRef.current;
      const panel = consentPanelRef.current;
      if (container && panel) {
        container.scrollTo({ top: Math.max(panel.offsetTop - 12, 0), behavior: "smooth" });
        return;
      }
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleSend = async (overrideText?: string) => {
    if (!config?.widgetId || sending || assistantTyping) return;
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setChatError("");
    setHandoffMessage("");
    setTeaserVisible(false);
    setEmojiPickerOpen(false);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          widgetId: config.widgetId,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const payload = await response.json();
      if (!response.ok && !payload?.response) {
        throw new Error(payload?.error || "Could not process message.");
      }

      const aiText = String(payload?.response || "").trim();
      const parsed = parseIACCloserSeed(aiText);
      const cleanResponse = parsed.cleanText || copy.step3Description;

      await appendAssistantWithTypewriter(cleanResponse);

      if (parsed.isReady) {
        if (parsed.seed?.name && !leadName) setLeadName(parsed.seed.name);
        if (parsed.seed?.phone && !leadPhone) setLeadPhone(sanitizePhone(parsed.seed.phone));
        if (parsed.seed?.collected_info) setCollectedInfoSeed(parsed.seed.collected_info);
        setHandoffEligible(true);
        setLeadConsentAccepted(false);
        setOfferDismissed(true);
        setShowExitIntent(false);
        setConsentVisible(true);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: withBotEmoji(copy.connectionIssue),
        },
      ]);
      setChatError(error?.message || copy.connectionIssue);
    } finally {
      setSending(false);
    }
  };

  const submitHandoff = async (event: FormEvent) => {
    event.preventDefault();
    if (!config?.widgetId) return;

    const cleanName = leadName.trim();
    const cleanPhone = sanitizePhone(leadPhone);
    if (!cleanName || cleanPhone.length < 8) {
      setChatError(copy.invalidLeadData);
      return;
    }
    if (!leadConsentAccepted) {
      setChatError(copy.consentRequired);
      return;
    }

    setChatError("");
    setHandoffLoading(true);
    setHandoffMessage("");

    try {
      const response = await fetch("/api/icloser/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: config.widgetId,
          name: cleanName,
          phone: cleanPhone,
          collectedInfo: buildCollectedInfo(),
          history: conversationHistory,
          consent: {
            accepted: true,
            explicitResponse: locale === "en" ? "YES" : "SI",
            textVersion: config.consentTextVersion || "v1",
            text: config.consentText || "",
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success !== true) {
        throw new Error(payload?.error || "Could not send handoff to IACloser.");
      }

      const redirectUrl = String(payload?.redirectUrl || config.iacloserRedirectUrl || "").trim();
      setHandoffMessage(copy.handoffSuccess);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: withBotEmoji(copy.activationMessage),
        },
      ]);
      setConsentVisible(false);
      setLeadConsentAccepted(false);

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1800);
      }
    } catch (error: any) {
      setChatError(error?.message || "Could not complete handoff.");
    } finally {
      setHandoffLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {copy.loading}
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 px-4 text-center">
        <div className="space-y-2">
          <p className="font-semibold">{copy.chatLoadError}</p>
          <p className="text-sm text-slate-300">{chatError || copy.openLeadChat}</p>
        </div>
      </main>
    );
  }

  const isLightMode = themeMode === "light";
  const statusActionRow = (
    <>
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition-all duration-500 animate-[pulse_3.2s_ease-in-out_infinite] ${
          isLightMode ? "border-rose-200 bg-rose-50 text-rose-700" : "border-rose-400/40 bg-rose-500/10 text-rose-100"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        <span className="max-w-[220px] truncate sm:max-w-[300px]">{activePresenceMessage}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
            isLightMode
              ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
          aria-label={isLightMode ? copy.themeAriaDark : copy.themeAriaLight}
        >
          {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={openConsentStep}
          disabled={!handoffEligible}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
            handoffEligible || handoffLoading || Boolean(handoffMessage)
              ? "border-emerald-300/45 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/20 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
              : (isLightMode ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500" : "cursor-not-allowed border-white/15 bg-white/5 text-slate-400")
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span className="max-w-[145px] truncate sm:max-w-none">
            {handoffLoading || handoffMessage
              ? copy.callingBadge
              : handoffEligible
                ? (config.leadChatBadgeText || copy.readyBadge)
                : copy.prequalifyingBadge}
          </span>
        </button>
      </div>
    </>
  );

  return (
    <main className={`relative min-h-screen overflow-hidden ${isLightMode ? "bg-[#eef3fb] text-slate-900" : "bg-[#050b15] text-slate-100"}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${isLightMode ? "bg-sky-300/25" : "bg-cyan-400/20"}`} />
        <div className={`absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${isLightMode ? "bg-indigo-300/20" : "bg-emerald-400/10"}`} />
        <div className={`absolute top-[28%] -left-20 h-64 w-64 rounded-full blur-3xl ${isLightMode ? "bg-fuchsia-200/25" : "bg-fuchsia-500/10"}`} />
      </div>

      <div className="relative mx-auto w-full max-w-[1080px] px-3 pb-10 pt-4 sm:px-5 lg:px-6 lg:pb-12 lg:pt-6">
        <section className="min-w-0">
          <div className={`flex h-[calc(100dvh-6rem)] max-h-[860px] min-h-[560px] flex-col rounded-[34px] p-[1px] shadow-[0_30px_120px_-60px_rgba(56,189,248,0.55)] ${isLightMode ? "bg-gradient-to-b from-white via-sky-100/70 to-sky-100/30" : "bg-gradient-to-b from-white/30 via-slate-500/25 to-transparent"}`}>
            <div className={`flex h-full min-h-0 flex-col rounded-[33px] border backdrop-blur-2xl ${isLightMode ? "border-white/70 bg-white/85" : "border-white/10 bg-[#071322]/85"}`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-7 sm:py-5 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-[0.35em] ${isLightMode ? "text-sky-700/85" : "text-sky-200/90"}`}>
                    {config.leadChatEyebrow || "Lead Chat"}
                  </p>
                  <h1 className={`text-2xl font-semibold tracking-tight leading-tight sm:text-[2.15rem] ${isLightMode ? "text-slate-900" : "text-slate-100"}`}>{config.businessName || copy.defaultBusinessName}</h1>
                  <p className={`mt-1 text-sm sm:text-base ${isLightMode ? "text-slate-700" : "text-slate-200/95"}`}>
                    {config.leadChatHeadline || copy.offerTitle}
                  </p>
                  <p className={`mt-1 text-xs sm:text-sm ${isLightMode ? "text-slate-500" : "text-slate-300/80"}`}>
                    {config.leadChatSubheadline || copy.step2Description}
                  </p>
                </div>
              </div>

              <div className={`px-4 pb-3 pt-3 sm:px-7 ${isLightMode ? "border-b border-slate-200 bg-white/80" : "border-b border-white/10 bg-white/[0.03]"}`}>
                <div className="flex flex-col items-center gap-2">
                  {statusActionRow}
                  {showLiveActivityStrip ? (
                    <div className={`w-full max-w-[320px] rounded-xl border px-3 py-2 text-xs ${
                      isLightMode
                        ? "border-sky-200 bg-white/95 text-slate-700"
                        : "border-cyan-400/30 bg-slate-950/85 text-slate-100"
                    } ${liveActivityTransition ? (isLightMode ? "shadow-[0_0_28px_-16px_rgba(14,165,233,0.9)]" : "shadow-[0_0_28px_-14px_rgba(34,211,238,0.85)]") : ""}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLightMode ? "text-sky-700" : "text-cyan-200"}`}>
                        {copy.liveActivityLabel}
                      </p>
                      <p className="mt-0.5 line-clamp-2">
                        {activeLiveActivityMessage}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {hasTestimonialStrip ? (
                <div className={`px-4 pb-3 pt-3 sm:px-7 ${isLightMode ? "border-b border-slate-200 bg-white/80" : "border-b border-white/10 bg-white/[0.03]"}`}>
                  <div
                    className={`relative overflow-hidden rounded-xl border px-3 py-2 text-xs transition-all duration-500 ${
                      isLightMode
                        ? "border-sky-200 bg-white/90 text-slate-700"
                        : "border-cyan-400/30 bg-slate-950/85 text-slate-100"
                    } ${testimonialTransition ? (isLightMode ? "shadow-[0_0_35px_-18px_rgba(14,165,233,0.95)]" : "shadow-[0_0_35px_-16px_rgba(34,211,238,0.9)]") : ""}`}
                  >
                    <div
                      className={`pointer-events-none absolute -inset-16 transition-opacity duration-500 ${testimonialTransition ? "opacity-100" : "opacity-0"}`}
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, rgba(125,211,252,0.42) 0%, rgba(52,211,153,0.25) 35%, rgba(2,6,23,0) 72%)",
                      }}
                    />
                    <div className="relative min-w-0">
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLightMode ? "text-sky-700" : "text-cyan-200"}`}>
                        {copy.testimonialLabel}
                      </p>
                      <p className="mt-0.5 truncate text-xs">
                        "{testimonialStripText}"
                      </p>
                      <p className={`mt-0.5 truncate text-[11px] ${isLightMode ? "text-slate-500" : "text-slate-300"}`}>
                        {testimonialStripMeta}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-7">
                {messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.role === "user"
                          ? "rounded-br-md text-slate-950 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.7)]"
                          : msg.role === "system"
                            ? (isLightMode
                              ? "rounded-xl border border-emerald-300 bg-emerald-100/90 text-emerald-800"
                              : "rounded-xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-100")
                            : (isLightMode
                              ? "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                              : "rounded-bl-md border border-white/10 bg-white/[0.045] text-slate-100 backdrop-blur")
                      }`}
                      style={msg.role === "user" ? { backgroundColor: config.primaryColor || "#00C185" } : {}}
                    >
                      <p>{msg.content}</p>
                      {msg.audioUrl ? (
                        <audio controls src={msg.audioUrl} className="mt-2 h-8 w-full max-w-[240px]" preload="metadata" />
                      ) : null}
                    </div>
                  </div>
                ))}

                {assistantTyping && (
                  <div className="flex justify-start">
                    <div className={`max-w-[88%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm leading-relaxed ${isLightMode ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/[0.045] text-slate-100 backdrop-blur"}`}>
                      {assistantDraft}
                      <span className={`ml-0.5 inline-block h-4 w-[1px] animate-pulse align-middle ${isLightMode ? "bg-sky-500" : "bg-cyan-300"}`} aria-hidden="true" />
                    </div>
                  </div>
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className={`inline-flex items-center gap-2 rounded-2xl rounded-bl-md border px-3 py-2 text-xs ${isLightMode ? "border-slate-200 bg-white text-slate-500" : "border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur"}`}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {copy.typing}
                    </div>
                  </div>
                )}

                {shouldShowInlineOffer && (
                  <div className="pt-2">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-slate-950/90 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-300">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-amber-200">{copy.offerTag}</p>
                      <h3 className="mt-2 text-lg font-semibold sm:text-xl">
                        {config.leadChatOfferTitle || copy.offerTitle}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {config.leadChatOfferDescription || copy.offerDescription}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={openConsentStep}>
                          {config.leadChatCtaLabel || copy.offerCta}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOfferDismissed(true)}>
                          {copy.continueChat}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {consentVisible && (
                  <div ref={consentPanelRef} className="pt-2">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-300">
                      <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        {copy.step2Title}
                      </h3>
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs sm:text-sm">
                        <p className="font-medium text-emerald-200">{copy.step1Title}</p>
                        <p className="mt-1 text-slate-200/90">{copy.step1Description}</p>
                        <p className="mt-3 font-medium text-emerald-200">{copy.step2Title}</p>
                        <p className="mt-1 text-slate-200/90">{copy.step2Description}</p>
                        <p className="mt-3 font-medium text-emerald-200">{copy.step3Title}</p>
                        <p className="mt-1 text-slate-200/90">{copy.step3Description}</p>
                      </div>
                      <form onSubmit={submitHandoff} className="mt-3 space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="lead-name">{copy.nameLabel}</Label>
                          <Input
                            id="lead-name"
                            value={leadName}
                            onChange={(event) => setLeadName(event.target.value)}
                            placeholder={copy.namePlaceholder}
                            className="border-slate-700 bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lead-phone">{copy.phoneLabel}</Label>
                          <Input
                            id="lead-phone"
                            value={leadPhone}
                            onChange={(event) => setLeadPhone(sanitizePhone(event.target.value))}
                            inputMode="tel"
                            placeholder={copy.phonePlaceholder}
                            className="border-slate-700 bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1 rounded-lg border border-sky-400/30 bg-sky-500/10 p-2.5 text-xs text-sky-100">
                          {copy.trustBullets.map((item) => (
                            <p key={item} className="flex items-center gap-2">
                              <span aria-hidden="true">•</span>
                              <span>{item}</span>
                            </p>
                          ))}
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-100">
                          {config.consentText || copy.consentCheckboxLabel}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lead-consent-checkbox" className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-200">
                            <input
                              id="lead-consent-checkbox"
                              type="checkbox"
                              checked={leadConsentAccepted}
                              onChange={(event) => setLeadConsentAccepted(event.target.checked)}
                              className="mt-0.5 h-4 w-4 accent-emerald-500"
                            />
                            <span>{copy.consentCheckboxLabel}</span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            {copy.privacyNote}
                          </p>
                        </div>
                        <Button type="submit" disabled={handoffLoading || !leadConsentAccepted} className="w-full gap-2">
                          {handoffLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                          {handoffLoading ? copy.connectingHandoff : copy.submitHandoff}
                        </Button>
                      </form>
                      {(chatError || handoffMessage) && (
                        <p className={`mt-3 text-xs ${chatError ? "text-rose-300" : "text-emerald-300"}`}>
                          {chatError || handoffMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`space-y-3 border-t px-4 py-4 sm:px-6 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                {teaserVisible && !!activeTeaser ? (
                  <button
                    type="button"
                    onClick={() => void handleSend(activeTeaser)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isLightMode
                        ? "border-sky-200 bg-sky-100/70 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-400"
                        : "border-cyan-400/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 focus-visible:ring-cyan-300"
                    }`}
                  >
                    {activeTeaser}
                  </button>
                ) : null}

                {quickReplies.length > 0 && messages.length < 7 && (
                  <div className="flex flex-nowrap gap-2 overflow-x-auto scroll-smooth pb-1 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_proximity] [-webkit-overflow-scrolling:touch] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
                    {quickReplies.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onClick={() => void handleSend(item)}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 [scroll-snap-align:start] ${
                          isLightMode
                            ? "border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700 focus-visible:ring-sky-400"
                            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:ring-cyan-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                {!consentVisible && (chatError || handoffMessage) && (
                  <p className={`text-xs ${chatError ? "text-rose-300" : "text-emerald-300"}`}>
                    {chatError || handoffMessage}
                  </p>
                )}

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`relative flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-2.5 transition-all duration-200 ${
                      isLightMode
                        ? "border-slate-300/90 bg-white"
                        : "border-cyan-500/35 bg-[#0a1627]/92 backdrop-blur"
                    }`}
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen((prev) => !prev)}
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isLightMode
                            ? "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            : "border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] hover:text-cyan-200"
                        }`}
                        aria-label={copy.emojiAria}
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      {emojiPickerOpen ? (
                        <div className={`absolute bottom-10 left-0 z-30 w-56 rounded-xl border p-2 shadow-2xl ${isLightMode ? "border-slate-200 bg-white" : "border-white/15 bg-[#0a1627]/95 backdrop-blur"}`}>
                          <div className="grid grid-cols-6 gap-1">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => appendEmojiToInput(emoji)}
                                className={`rounded-md p-1.5 text-base transition-colors ${isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={toggleSpeechInput}
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isLightMode
                          ? "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          : "border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] hover:text-cyan-200"
                      }`}
                      aria-label={speechListening ? copy.micAriaStop : copy.micAriaStart}
                    >
                      {speechListening ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={config.chatPlaceholder || copy.chatPlaceholder}
                      className={`h-9 min-w-0 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                        isLightMode
                          ? "text-slate-900"
                          : "text-slate-100 placeholder:text-slate-400"
                      }`}
                      disabled={sending || assistantTyping}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || assistantTyping || !input.trim()}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-white transition hover:-translate-y-[1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    style={{
                      background: `linear-gradient(140deg, ${config.primaryColor || "#00C185"} 0%, #00a36d 100%)`,
                      boxShadow: "0 8px 16px rgba(0, 193, 133, 0.2)",
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <div className={`grid gap-1 text-[11px] ${isLightMode ? "text-slate-500" : "text-slate-300/80"}`}>
                  {copy.trustBullets.map((item) => (
                    <p key={`trust-footer-${item}`} className="flex items-center gap-2">
                      <span aria-hidden="true">-</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
                {speechListening ? (
                  <p className={`text-[11px] ${isLightMode ? "text-rose-600" : "text-rose-300"}`}>
                    {copy.listeningNow}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showExitIntent && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${isLightMode ? "bg-slate-900/35" : "bg-slate-950/70"}`}>
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ${isLightMode ? "border-sky-200 bg-white" : "border-cyan-300/35 bg-slate-950"}`}>
            <button
              type="button"
              onClick={() => setShowExitIntent(false)}
              className={`ml-auto grid h-8 w-8 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                isLightMode
                  ? "border-slate-300 bg-white text-slate-500 hover:text-slate-800"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100"
              }`}
              aria-label={copy.closeExitIntent}
            >
              <X className="h-4 w-4" />
            </button>
            <p className={`text-[11px] uppercase tracking-[0.25em] ${isLightMode ? "text-sky-600" : "text-cyan-200"}`}>{copy.exitIntentDetected}</p>
            <h3 className={`mt-2 text-xl font-semibold ${isLightMode ? "text-slate-800" : "text-slate-100"}`}>{config.exitIntentTitle || copy.exitIntentDetected}</h3>
            <p className={`mt-2 text-sm ${isLightMode ? "text-slate-600" : "text-slate-300"}`}>
              {config.exitIntentDescription || copy.offerDescription}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => {
                  setShowExitIntent(false);
                  inputRef.current?.focus();
                }}
              >
                {config.exitIntentCta || copy.continueChat}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowExitIntent(false)}>
                {copy.continueBrowsing}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

