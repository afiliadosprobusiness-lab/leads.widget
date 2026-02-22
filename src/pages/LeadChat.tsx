import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Mic, MicOff, Moon, PhoneCall, Send, ShieldCheck, Smile, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumAudioPlayer } from "@/components/PremiumAudioPlayer";
import { Label } from "@/components/ui/label";
import { buildWhatsAppRedirectUrl, optimizeImageDeliveryUrl, parseChatResponseCommands, sanitizeHttpUrl } from "@/lib/chatCommands";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  audioUrl?: string;
  videoUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
};
type BrowserSpeechRecognitionCtor = new () => SpeechRecognition;

type Testimonial = {
  id?: string;
  name?: string;
  text?: string;
  stars?: number;
  avatar_url?: string;
};

type RealEstateProperty = {
  id: string;
  title: string;
  district: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  imageUrl: string;
  videoUrl: string;
  imageUrls: string[];
  videoUrls: string[];
};

type PublicWidgetConfig = {
  widgetId: string;
  template?: string;
  language?: "es" | "en";
  businessName?: string;
  primaryColor?: string;
  whatsappDestination?: string;
  welcomeMessage?: string;
  welcomeImageUrl?: string;
  welcomeAudioUrl?: string;
  welcomeVideoUrl?: string;
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
  leadChatPageTitle?: string;
  leadChatOfferTitle?: string;
  leadChatOfferDescription?: string;
  leadChatCtaLabel?: string;
  leadChatLiveToasts?: string[];
  realEstateProperties?: RealEstateProperty[];
};

const FIXED_IACLOSER_REDIRECT_URL = "https://ai-call-closer.vercel.app/";
const HAS_EMOJI_RE = /[\p{Extended_Pictographic}]/u;
const QUICK_EMOJIS = ["😀", "😄", "🙏", "✨", "🔥", "👍", "🎯", "📞", "✅", "💬", "😊", "🚀"];
const PUBLIC_FIRESTORE_PROJECT_ID = "leads-widget";
const PUBLIC_FIRESTORE_API_KEY = "AIzaSyCXNFoeg1nrYcFHzU9TEKNnDPg1mHU3_tA";
const IDLE_TEASER_DELAY_MS = 6200;
const IDLE_TEASER_VISIBLE_MS = 3800;
const IDLE_TEASER_ROTATE_MS = 8500;
const REAL_ESTATE_MAX_IMAGES = 5;
const REAL_ESTATE_MAX_VIDEOS = 2;

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
    teaserMessages: string[];
    presenceNow: string;
    presenceNowMessages: string[];
    presenceNowSuffix: string;
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
    openingWhatsApp: string;
    openWhatsAppNow: string;
    openingIACallCloser: string;
    openIACallCloserNow: string;
    talkNow: string;
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
    liveDemosNow: string;
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
    teaserMessages: [
      "\u00BFC\u00F3mo podemos ayudarte? \uD83D\uDC4B",
      "\u00BFTienes alguna duda sobre el servicio? \u2728",
      "\u00A1Hola! Estamos en l\u00EDnea para atenderte \uD83D\uDE80",
    ],
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
    presenceNowSuffix: "personas revisando resultados en vivo ahora",
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
    trustBullets: ["\u26A1 Demo gratis", "\u23F1\uFE0F <2 min", "\uD83D\uDD12 Sin tarjeta"],
    submitHandoff: "Enviar",
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
    openingWhatsApp: "Abriendo WhatsApp...",
    openWhatsAppNow: "Abrir WhatsApp ahora",
    openingIACallCloser: "Abriendo IACloser...",
    openIACallCloserNow: "Abrir IACloser ahora",
    talkNow: "Habla ahora",
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
    liveDemosNow: "Demos en vivo ejecutandose ahora",
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
    teaserMessages: [
      "How can we help you? \uD83D\uDC4B",
      "Do you have any question about the service? \u2728",
      "Hi! We are online to assist you \uD83D\uDE80",
    ],
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
    presenceNowSuffix: "people are checking live outcomes now",
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
    trustBullets: ["\u26A1 Free demo", "\u23F1\uFE0F <2 min", "\uD83D\uDD12 No card required"],
    submitHandoff: "Send",
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
    openingWhatsApp: "Opening WhatsApp...",
    openWhatsAppNow: "Open WhatsApp now",
    openingIACallCloser: "Opening IACloser...",
    openIACallCloserNow: "Open IACloser now",
    talkNow: "Speak now",
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
    liveDemosNow: "Live demos running now",
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

const LEGACY_TEASER_MESSAGES = [
  ["\u00BFC\u00F3mo podemos ayudarte? \uD83D\uDC4B", "\u00BFTienes alguna duda sobre el servicio? \u2728", "\u00A1Hola! Estamos en l\u00EDnea para atenderte \uD83D\uDE80"],
  ["How can we help you? \uD83D\uDC4B", "Do you have any question about the service? \u2728", "Hi! We are online to assist you \uD83D\uDE80"],
  ["\u00BFC\u00F3mo podemos ayudarte?", "\u00BFTienes alguna duda sobre el servicio?", "\u00A1Hola! Estamos en l\u00EDnea para atenderte"],
  ["How can we help you?", "Do you have any question about the service?", "Hi! We are online to assist you"],
];

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    mozSpeechRecognition?: BrowserSpeechRecognitionCtor;
    msSpeechRecognition?: BrowserSpeechRecognitionCtor;
  }
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

type ChatEventType = "whatsapp_open" | "iacallcloser_open";

function inferChatEventTypeByUrl(url: string): ChatEventType | null {
  const normalized = String(url || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("wa.me/") || normalized.includes("whatsapp.com")) return "whatsapp_open";
  if (normalized.includes("ai-call-closer") || normalized.includes("iacallcloser") || normalized.includes("icloser")) {
    return "iacallcloser_open";
  }
  return null;
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

function getRandomPresenceCount() {
  return Math.floor(Math.random() * 298) + 3;
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

function parseFirestoreStringField(field: any) {
  if (!field) return "";
  if (typeof field === "string") return field.trim();
  if (typeof field.stringValue === "string") return field.stringValue.trim();
  return "";
}

function parseFirestoreUnknownValue(field: any): unknown {
  if (!field || typeof field !== "object") return field;
  if (typeof field.stringValue === "string") return field.stringValue;
  if (typeof field.integerValue === "string") return field.integerValue;
  if (typeof field.doubleValue === "number") return field.doubleValue;
  if (typeof field.booleanValue === "boolean") return field.booleanValue;
  if (Array.isArray(field.arrayValue?.values)) {
    return field.arrayValue.values.map((item: any) => parseFirestoreUnknownValue(item));
  }
  if (field.mapValue?.fields && typeof field.mapValue.fields === "object") {
    const mapped: Record<string, unknown> = {};
    Object.entries(field.mapValue.fields).forEach(([key, value]) => {
      mapped[key] = parseFirestoreUnknownValue(value);
    });
    return mapped;
  }
  return "";
}

function normalizeRealEstateProperties(raw: unknown): RealEstateProperty[] {
  let source: unknown = raw;

  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as Record<string, any>;
    if (Array.isArray(record.arrayValue?.values)) {
      source = record.arrayValue.values.map((item: any) => parseFirestoreUnknownValue(item));
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

  const normalizeMediaList = (
    value: unknown,
    maxItems: number,
    sanitizer: (url: string) => string,
  ) => {
    const sourceList = Array.isArray(value) ? value : [value];
    const unique = new Set<string>();
    const normalized: string[] = [];
    for (const entry of sourceList) {
      const safe = sanitizer(String(entry || ""));
      if (!safe || unique.has(safe)) continue;
      unique.add(safe);
      normalized.push(safe);
      if (normalized.length >= maxItems) break;
    }
    return normalized;
  };

  return source
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = String(row.id || `property-${index + 1}`).trim();
      const title = String(row.title || row.name || row.property_title || "").trim();
      const district = String(row.district || row.zone || "").trim();
      const price = String(row.price || row.amount || "").trim();
      const bedrooms = String(row.bedrooms || row.rooms || row.dorms || "").trim();
      const bathrooms = String(row.bathrooms || row.baths || row.banos || "").trim();
      const areaM2 = String(row.areaM2 || row.area_m2 || row.m2 || "").trim();
      const imageUrls = normalizeMediaList(
        Array.isArray(row.imageUrls) || Array.isArray(row.image_urls)
          ? (row.imageUrls || row.image_urls)
          : [row.imageUrl || row.image_url || row.photo || ""],
        REAL_ESTATE_MAX_IMAGES,
        (url) => optimizeImageDeliveryUrl(url),
      );
      const videoUrls = normalizeMediaList(
        Array.isArray(row.videoUrls) || Array.isArray(row.video_urls)
          ? (row.videoUrls || row.video_urls)
          : [row.videoUrl || row.video_url || row.video || ""],
        REAL_ESTATE_MAX_VIDEOS,
        (url) => sanitizeHttpUrl(url),
      );
      const imageUrl = imageUrls[0] || "";
      const videoUrl = videoUrls[0] || "";
      if (!title && imageUrls.length === 0 && videoUrls.length === 0) return null;
      return {
        id: id || `property-${index + 1}`,
        title: title || `Propiedad ${index + 1}`,
        district,
        price,
        bedrooms,
        bathrooms,
        areaM2,
        imageUrl,
        videoUrl,
        imageUrls,
        videoUrls,
      } as RealEstateProperty;
    })
    .filter((item): item is RealEstateProperty => Boolean(item))
    .slice(0, 20);
}

async function fetchLeadChatRealEstatePropertiesFromFirestore(identity: string): Promise<RealEstateProperty[]> {
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
      const properties = normalizeRealEstateProperties(fields?.real_estate_properties);
      if (properties.length > 0) return properties;
    } catch {
      // noop
    }
  }

  return [];
}

type LeadChatHeaderFields = {
  lead_chat_headline?: string;
  lead_chat_subheadline?: string;
  lead_chat_eyebrow?: string;
  lead_chat_badge_text?: string;
  lead_chat_page_title?: string;
  welcome_image_url?: string;
  welcome_audio_url?: string;
  welcome_video_url?: string;
};

async function fetchLeadChatHeaderFieldsFromFirestore(identity: string): Promise<LeadChatHeaderFields> {
  if (!identity) return {};

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
      if (!fields) continue;

      return {
        lead_chat_headline: parseFirestoreStringField(fields.lead_chat_headline),
        lead_chat_subheadline: parseFirestoreStringField(fields.lead_chat_subheadline),
        lead_chat_eyebrow: parseFirestoreStringField(fields.lead_chat_eyebrow),
        lead_chat_badge_text: parseFirestoreStringField(fields.lead_chat_badge_text),
        lead_chat_page_title: parseFirestoreStringField(fields.lead_chat_page_title),
        welcome_image_url: parseFirestoreStringField(fields.welcome_image_url),
        welcome_audio_url: parseFirestoreStringField(fields.welcome_audio_url),
        welcome_video_url: parseFirestoreStringField(fields.welcome_video_url),
      };
    } catch {
      // noop
    }
  }

  return {};
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
  void input;
  return "en";
}

function detectMessageLocale(value: string, fallback: ChatLocale): ChatLocale {
  const raw = String(value || "");
  const normalized = normalizeText(raw);
  if (!normalized) return fallback;

  const spanishSignals =
    /\b(hola|como|quiero|necesito|precio|precios|ayuda|gracias|por favor|agendar|llamada|ventas|cita|telefono|numero|espanol|si)\b/;
  if (spanishSignals.test(normalized)) return "es";

  const englishSignals =
    /\b(hello|hi|i need|price|pricing|help|thanks|please|book|call|appointment|sales|phone|yes)\b/;
  if (englishSignals.test(normalized)) return "en";

  return fallback;
}

function getLanguageDirective(locale: ChatLocale) {
  if (locale === "es") {
    return "Responde siempre en espanol claro y natural.";
  }
  return "Respond in clear, natural English.";
}

function getCostControlDirective(locale: ChatLocale) {
  if (locale === "es") {
    return "Se breve y orientado a conversion. Maximo 90 palabras, usa como maximo 1 emoji, evita repetir imagenes/audios/videos. Usa [AUDIO] solo en bienvenida o CTA final (maximo 1 audio dinamico por conversacion). Si usas [IMAGE], prioriza URL Cloudinary en calidad media (q_auto:good, w<=960).";
  }
  return "Be concise and conversion-focused. Max 90 words, use at most 1 emoji, avoid repeating images/audio/video. Use [AUDIO] only for opening or final CTA (max 1 dynamic audio per conversation). For [IMAGE], prefer Cloudinary medium quality URLs (q_auto:good, w<=960).";
}

function getRealEstateMediaDirective(config: PublicWidgetConfig | null, locale: ChatLocale) {
  if (!config || String(config.template || "").trim().toLowerCase() !== "inmobiliaria") return "";
  const properties = Array.isArray(config.realEstateProperties) ? config.realEstateProperties : [];
  if (properties.length === 0) return "";

  const catalog = properties
    .slice(0, 8)
    .map((property, index) => {
      const imageUrls = (Array.isArray(property.imageUrls) ? property.imageUrls : [])
        .filter(Boolean)
        .slice(0, REAL_ESTATE_MAX_IMAGES);
      const videoUrls = (Array.isArray(property.videoUrls) ? property.videoUrls : [])
        .filter(Boolean)
        .slice(0, REAL_ESTATE_MAX_VIDEOS);
      const rows = [
        `id=${property.id || `prop-${index + 1}`}`,
        `title=${property.title || "-"}`,
        property.district ? `district=${property.district}` : "",
        property.price ? `price=${property.price}` : "",
        property.bedrooms ? `bedrooms=${property.bedrooms}` : "",
        property.areaM2 ? `m2=${property.areaM2}` : "",
        ...imageUrls.map((url, mediaIndex) => `image_${mediaIndex + 1}=${url}`),
        ...videoUrls.map((url, mediaIndex) => `video_${mediaIndex + 1}=${url}`),
      ].filter(Boolean);
      return rows.join(" | ");
    })
    .join("\n");

  if (!catalog) return "";

  if (locale === "es") {
    return [
      "Modo inmobiliaria activo.",
      "Usa SOLO URLs del catalogo, no inventes enlaces.",
      "Si el usuario pide ver propiedad/departamento/casa o el contexto lo amerita, muestra maximo 1 imagen y 1 video relevantes con comandos:",
      "- [IMAGE: <url>|<alt corto>]",
      "- [VIDEO: <url>]",
      "Catalogo de propiedades:",
      catalog,
    ].join("\n");
  }

  return [
    "Real estate mode is active.",
    "Use ONLY URLs from the catalog. Never invent links.",
    "If the user asks to see listings/house/apartment, or context suggests visual proof, show up to 1 image and 1 video with:",
    "- [IMAGE: <url>|<short alt>]",
    "- [VIDEO: <url>]",
    "Property catalog:",
    catalog,
  ].join("\n");
}

function arraysLooselyMatch(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => normalizeText(item) === normalizeText(b[index] || ""));
}

function shouldUseSalesQuickReplies(candidate: string[]) {
  if (candidate.length === 0) return true;
  return LEGACY_QUICK_REPLIES.some((legacy) => arraysLooselyMatch(candidate, legacy));
}

function shouldUseSalesTeaserMessages(candidate: string[]) {
  return LEGACY_TEASER_MESSAGES.some((legacy) => arraysLooselyMatch(candidate, legacy));
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

function resolveTeaserMessages(rawTeasers: unknown, locale: ChatLocale) {
  if (rawTeasers === undefined || rawTeasers === null) {
    return [...SALES_COPY[locale].teaserMessages];
  }
  const parsed = normalizeStringArray(rawTeasers).slice(0, 12);
  if (parsed.length === 0) {
    return [];
  }
  if (shouldUseSalesTeaserMessages(parsed)) {
    return [...SALES_COPY[locale].teaserMessages];
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

function getRedirectCountdownText(locale: ChatLocale, seconds: number) {
  if (seconds <= 0) {
    return locale === "es" ? "Redireccionando..." : "Redirecting...";
  }
  return locale === "es" ? `Redireccionando en ${seconds}...` : `Redirecting in ${seconds}...`;
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
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeLiveActivityIndex, setActiveLiveActivityIndex] = useState(0);
  const [presenceNowCount, setPresenceNowCount] = useState(() => getRandomPresenceCount());
  const [testimonialTransition, setTestimonialTransition] = useState(false);
  const [liveActivityTransition, setLiveActivityTransition] = useState(false);
  const [activeTeaser, setActiveTeaser] = useState("");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [lastUserInteractionAt, setLastUserInteractionAt] = useState(0);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [locale, setLocale] = useState<ChatLocale>("en");
  const [languageLocked, setLanguageLocked] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const consentPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceDraftRef = useRef("");
  const pendingVoiceAutoSendRef = useRef(false);
  const handleSendFromVoiceRef = useRef<(value: string) => void>(() => {});
  const conversationIdRef = useRef(`leadchat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const redirectCountdownIntervalRef = useRef<number | null>(null);
  const redirectCountdownTimeoutRef = useRef<number | null>(null);
  const copy = useMemo(() => SALES_COPY[locale], [locale]);
  const markUserInteraction = () => {
    setHasUserInteracted(true);
    setLastUserInteractionAt(Date.now());
    setTeaserVisible(false);
  };

  const trackConversationEvent = useCallback(
    async (eventType: ChatEventType, meta: Record<string, string> = {}) => {
      const widgetId = String(config?.widgetId || "").trim();
      if (!widgetId) return;
      try {
        await fetch("/api/chat-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgetId,
            source: "lead_chat",
            conversationId: conversationIdRef.current,
            eventType,
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            meta,
          }),
        });
      } catch {
        // non-blocking telemetry
      }
    },
    [config?.widgetId],
  );

  const openTrackedAction = useCallback(
    (url: string, trigger: "auto" | "button" | "handoff" = "button") => {
      const cleanUrl = String(url || "").trim();
      if (!cleanUrl) return;
      const eventType = inferChatEventTypeByUrl(cleanUrl);
      if (eventType) {
        void trackConversationEvent(eventType, { trigger });
      }
      window.open(cleanUrl, "_blank", "noopener,noreferrer");
    },
    [trackConversationEvent],
  );

  const clearRedirectCountdown = () => {
    if (redirectCountdownIntervalRef.current !== null) {
      window.clearInterval(redirectCountdownIntervalRef.current);
      redirectCountdownIntervalRef.current = null;
    }
    if (redirectCountdownTimeoutRef.current !== null) {
      window.clearTimeout(redirectCountdownTimeoutRef.current);
      redirectCountdownTimeoutRef.current = null;
    }
  };

  const startRedirectCountdown = (targetUrl: string, activeLocale: ChatLocale) => {
    const redirectTarget = String(targetUrl || "").trim();
    if (!redirectTarget) return;

    clearRedirectCountdown();
    let secondsLeft = 3;
    const countdownMessageId = `redirect-countdown-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: countdownMessageId,
        role: "system",
        content: getRedirectCountdownText(activeLocale, secondsLeft),
      },
    ]);

    redirectCountdownIntervalRef.current = window.setInterval(() => {
      secondsLeft -= 1;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === countdownMessageId
            ? { ...message, content: getRedirectCountdownText(activeLocale, secondsLeft) }
            : message,
        ),
      );

      if (secondsLeft <= 0) {
        clearRedirectCountdown();
        redirectCountdownTimeoutRef.current = window.setTimeout(() => {
          window.location.href = redirectTarget;
        }, 320);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearRedirectCountdown();
    };
  }, []);

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
        let resolvedRealEstateProperties = normalizeRealEstateProperties(
          raw.realEstateProperties ?? raw.real_estate_properties,
        );
        if (resolvedRealEstateProperties.length === 0) {
          resolvedRealEstateProperties = await fetchLeadChatRealEstatePropertiesFromFirestore(identity);
        }
        const headerFields = await fetchLeadChatHeaderFieldsFromFirestore(identity);
        const normalized: PublicWidgetConfig = {
          widgetId: String(raw.widgetId || raw.widget_id || identity || ""),
          template: String(raw.template || raw.niche || (resolvedRealEstateProperties.length > 0 ? "inmobiliaria" : "general")),
          language: resolvedLocale,
          businessName: String(raw.businessName || raw.business_name || localeCopy.defaultBusinessName),
          primaryColor: String(raw.primaryColor || raw.primary_color || "#00C185"),
          whatsappDestination: String(raw.whatsappDestination || raw.whatsapp_destination || ""),
          welcomeMessage: resolveWelcomeMessage(raw.welcomeMessage ?? raw.welcome_message, resolvedLocale),
          welcomeImageUrl: optimizeImageDeliveryUrl(String(raw.welcomeImageUrl || raw.welcome_image_url || headerFields.welcome_image_url || "")),
          welcomeAudioUrl: sanitizeHttpUrl(String(raw.welcomeAudioUrl || raw.welcome_audio_url || headerFields.welcome_audio_url || "")),
          welcomeVideoUrl: sanitizeHttpUrl(String(raw.welcomeVideoUrl || raw.welcome_video_url || headerFields.welcome_video_url || "")),
          chatPlaceholder: String(raw.chatPlaceholder || raw.chat_placeholder || localeCopy.chatPlaceholder),
          quickReplies: resolveQuickReplies(raw.quickReplies ?? raw.quick_replies, resolvedLocale),
          teaserMessages: resolveTeaserMessages(raw.teaserMessages ?? raw.teaser_messages, resolvedLocale),
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
          leadChatHeadline: String(
            headerFields.lead_chat_headline ||
              raw.leadChatHeadline ||
              raw.lead_chat_headline ||
              localeCopy.offerTitle,
          ),
          leadChatSubheadline: String(
            headerFields.lead_chat_subheadline ||
              raw.leadChatSubheadline ||
              raw.lead_chat_subheadline ||
              localeCopy.step2Description,
          ),
          leadChatEyebrow: String(
            headerFields.lead_chat_eyebrow ||
              raw.leadChatEyebrow ||
              raw.lead_chat_eyebrow ||
              "Lead Chat",
          ),
          leadChatBadgeText: String(
            headerFields.lead_chat_badge_text ||
              raw.leadChatBadgeText ||
              raw.lead_chat_badge_text ||
              localeCopy.readyBadge,
          ),
          leadChatPageTitle: String(
            headerFields.lead_chat_page_title ||
              raw.leadChatPageTitle ||
              raw.lead_chat_page_title ||
              "",
          ),
          leadChatOfferTitle: String(raw.leadChatOfferTitle || raw.lead_chat_offer_title || localeCopy.offerTitle),
          leadChatOfferDescription: String(
            raw.leadChatOfferDescription ||
              raw.lead_chat_offer_description ||
              localeCopy.offerDescription,
          ),
          leadChatCtaLabel: String(raw.leadChatCtaLabel || raw.lead_chat_cta_label || localeCopy.offerCta),
          leadChatLiveToasts: resolvedLiveToasts,
          realEstateProperties: resolvedRealEstateProperties,
        };

        setLocale(resolvedLocale);
        setConfig(normalized);
        setHasUserInteracted(false);
        setLastUserInteractionAt(0);
        setActiveTeaser("");
        setTeaserVisible(false);
        setMessages([
          {
            role: "assistant",
            content: withBotEmoji(normalized.welcomeMessage || localeCopy.initialMessage),
            imageUrl: normalized.welcomeImageUrl || undefined,
            audioUrl: normalized.welcomeAudioUrl || undefined,
            videoUrl: normalized.welcomeVideoUrl || undefined,
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
    if (typeof document === "undefined") return;
    const tabTitle = String(config?.leadChatPageTitle || config?.businessName || "").trim();
    document.title = tabTitle || "Lead Chat";
  }, [config?.leadChatPageTitle, config?.businessName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = locale === "es" ? "es-ES" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }
      const transcript = `${finalTranscript} ${interimTranscript}`.trim();
      if (!transcript) return;
      voiceDraftRef.current = transcript;
      setInput(transcript);
    };

    recognition.onend = () => {
      setSpeechListening(false);
      const transcript = voiceDraftRef.current.trim();
      const shouldAutoSend = pendingVoiceAutoSendRef.current;
      pendingVoiceAutoSendRef.current = false;
      voiceDraftRef.current = "";
      if (shouldAutoSend && transcript) {
        handleSendFromVoiceRef.current(transcript);
      }
    };
    recognition.onerror = () => {
      setSpeechListening(false);
      pendingVoiceAutoSendRef.current = false;
    };

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
  const teaserMessages = useMemo(() => {
    const parsed = Array.isArray(config?.teaserMessages) ? config.teaserMessages.filter(Boolean).slice(0, 12) : [];
    if (shouldUseSalesTeaserMessages(parsed)) {
      return [...copy.teaserMessages];
    }
    return parsed;
  }, [config?.teaserMessages, copy.teaserMessages]);

  const testimonials = useMemo(
    () => (Array.isArray(config?.testimonials) ? config.testimonials.slice(0, 10) : []),
    [config?.testimonials],
  );
  const liveActivityMessages = useMemo(
    () => (Array.isArray(config?.leadChatLiveToasts) ? config.leadChatLiveToasts.filter(Boolean).slice(0, 12) : []),
    [config?.leadChatLiveToasts],
  );
  const showLiveActivityStrip = liveActivityMessages.length > 0;

  const activeTestimonial = useMemo(() => {
    if (testimonials.length === 0) return null;
    return testimonials[activeTestimonialIndex % testimonials.length];
  }, [activeTestimonialIndex, testimonials]);
  const activeLiveActivityMessage = useMemo(() => {
    if (liveActivityMessages.length === 0) return "";
    return liveActivityMessages[activeLiveActivityIndex % liveActivityMessages.length] || "";
  }, [activeLiveActivityIndex, liveActivityMessages]);
  const testimonialStripText = activeTestimonial?.text || copy.offerDescription;
  const testimonialStripAuthor = activeTestimonial?.name || copy.defaultBusinessName;
  const testimonialStarsCount = Math.max(1, Math.min(5, Number(activeTestimonial?.stars || 5)));
  const testimonialStripStars = Array.from({ length: testimonialStarsCount }, () => "\u2B50").join("");
  const hasTestimonialStrip = Boolean(activeTestimonial);
  const activePresenceMessage = useMemo(
    () => `${presenceNowCount} ${copy.presenceNowSuffix}`,
    [copy.presenceNowSuffix, presenceNowCount],
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
    setPresenceNowCount(getRandomPresenceCount());
    const interval = window.setInterval(() => {
      setPresenceNowCount(getRandomPresenceCount());
    }, 5600);
    return () => window.clearInterval(interval);
  }, [locale]);

  useEffect(() => {
    const source = teaserMessages;
    if (
      source.length === 0 ||
      !hasUserInteracted ||
      consentVisible ||
      !!handoffMessage ||
      !!input.trim() ||
      sending ||
      assistantTyping
    ) {
      setTeaserVisible(false);
      return;
    }

    let index = Math.floor(Math.random() * source.length);
    let intervalId: number | undefined;
    let hideTimeout: number | undefined;
    const startupDelay = Math.max(IDLE_TEASER_DELAY_MS, Math.max(4, Number(config?.triggerDelay || 5)) * 1000);

    const showTeaser = () => {
      setActiveTeaser(source[index] || "");
      setTeaserVisible(true);
      index = (index + 1) % source.length;
      if (hideTimeout) window.clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => setTeaserVisible(false), IDLE_TEASER_VISIBLE_MS);
    };

    const startTimeout = window.setTimeout(() => {
      showTeaser();
      intervalId = window.setInterval(showTeaser, IDLE_TEASER_ROTATE_MS);
    }, startupDelay);

    return () => {
      window.clearTimeout(startTimeout);
      if (intervalId) window.clearInterval(intervalId);
      if (hideTimeout) window.clearTimeout(hideTimeout);
    };
  }, [
    teaserMessages,
    config?.triggerDelay,
    consentVisible,
    handoffMessage,
    input,
    sending,
    assistantTyping,
    hasUserInteracted,
    lastUserInteractionAt,
  ]);

  useEffect(() => {
    if (!teaserVisible || teaserMessages.length === 0) return;
    setActiveTeaser((prev) => {
      if (teaserMessages.some((item) => normalizeText(item) === normalizeText(prev))) {
        return prev;
      }
      return teaserMessages[0] || "";
    });
  }, [locale, teaserVisible, teaserMessages]);

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
    if (sending || assistantTyping) return;
    markUserInteraction();
    setChatError("");
    if (speechListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        pendingVoiceAutoSendRef.current = false;
        setSpeechListening(false);
      }
      return;
    }
    try {
      setEmojiPickerOpen(false);
      voiceDraftRef.current = "";
      pendingVoiceAutoSendRef.current = true;
      recognitionRef.current.lang = locale === "es" ? "es-ES" : "en-US";
      recognitionRef.current.start();
      setSpeechListening(true);
    } catch {
      pendingVoiceAutoSendRef.current = false;
      setSpeechListening(false);
    }
  };

  const appendEmojiToInput = (emoji: string) => {
    markUserInteraction();
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

  const handleLanguageChange = (nextLocale: ChatLocale) => {
    setLocale(nextLocale);
    setLanguageLocked(true);

    const hasUserMessages = messages.some((msg) => msg.role === "user");
    if (!hasUserMessages) {
      setMessages([{
        role: "assistant",
        content: withBotEmoji(config?.welcomeMessage || SALES_COPY[nextLocale].initialMessage),
        imageUrl: config?.welcomeImageUrl || undefined,
        audioUrl: config?.welcomeAudioUrl || undefined,
        videoUrl: config?.welcomeVideoUrl || undefined,
      }]);
    }
  };

  const handleSend = async (overrideText?: string) => {
    if (!config?.widgetId || sending || assistantTyping) return;
    const text = (overrideText ?? input).trim();
    if (!text) return;
    markUserInteraction();

    const detectedLocale = detectMessageLocale(text, locale);
    const responseLocale = languageLocked ? locale : (detectedLocale === "es" ? "es" : locale);
    if (!languageLocked && responseLocale === "es" && locale !== "es") {
      setLocale("es");
    }

    setChatError("");
    setHandoffMessage("");
    setTeaserVisible(false);
    setEmojiPickerOpen(false);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    const apiHistory = nextMessages
      .filter((entry) => entry.role !== "system")
      .slice(-12)
      .map((entry) => ({ role: entry.role, content: entry.content }));
    const realEstateDirective = getRealEstateMediaDirective(config, responseLocale);
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: [
            { role: "system", content: getLanguageDirective(responseLocale) },
            { role: "system", content: getCostControlDirective(responseLocale) },
            ...(realEstateDirective ? [{ role: "system" as const, content: realEstateDirective }] : []),
            ...apiHistory,
          ],
          widgetId: config.widgetId,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: "lead_chat",
          conversationId: conversationIdRef.current,
        }),
      });
      const payload = await response.json();
      if (!response.ok && !payload?.response) {
        throw new Error(payload?.error || "Could not process message.");
      }

      const aiText = String(payload?.response || "").trim();
      const parsed = parseChatResponseCommands(aiText, {
        defaultIaCallCloserUrl: config.iacloserRedirectUrl || FIXED_IACLOSER_REDIRECT_URL,
      });
      const existingAudioUrls = new Set(messages.map((item) => item.audioUrl).filter(Boolean));
      const maxAudioMessages = config.welcomeAudioUrl ? 2 : 1;
      const availableAudioSlots = Math.max(0, maxAudioMessages - existingAudioUrls.size);
      const budgetedAudios = parsed.audios
        .filter((item) => !existingAudioUrls.has(item.url))
        .slice(0, availableAudioSlots);
      const budgetedVideos = parsed.videos.slice(0, 1);
      const hasIaCallCloserReady = parsed.iaCallCloserReady;
      const normalizedWhatsAppMessage = parsed.whatsappPayload || text;
      const whatsappUrl = buildWhatsAppRedirectUrl(config.whatsappDestination || "", normalizedWhatsAppMessage);
      const hasMediaImages = parsed.images.length > 0;
      const hasMediaAudios = budgetedAudios.length > 0;
      const hasMediaVideos = budgetedVideos.length > 0;
      const iaCallCloserRedirectUrl = sanitizeHttpUrl(
        parsed.iaCallCloserRedirectUrl || config.iacloserRedirectUrl || FIXED_IACLOSER_REDIRECT_URL,
      );
      const cleanResponse =
        parsed.cleanText ||
        (parsed.whatsappIndex !== null && whatsappUrl
          ? copy.openingWhatsApp
          : (parsed.iaCallCloserRedirectIndex !== null && iaCallCloserRedirectUrl
            ? copy.openingIACallCloser
            : (hasMediaImages || hasMediaAudios || hasMediaVideos ? "" : copy.step3Description)));

      await appendAssistantWithTypewriter(cleanResponse);
      if (parsed.images.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...parsed.images.map((item, idx) => ({
            id: `assistant-image-${Date.now()}-${idx}`,
            role: "assistant" as const,
            content: "",
            imageUrl: item.url,
            imageAlt: item.alt || "Assistant image",
          })),
        ]);
      }
      if (budgetedAudios.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...budgetedAudios.map((item, idx) => ({
            id: `assistant-audio-${Date.now()}-${idx}`,
            role: "assistant" as const,
            content: "",
            audioUrl: item.url,
          })),
        ]);
      }
      if (budgetedVideos.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...budgetedVideos.map((item, idx) => ({
            id: `assistant-video-${Date.now()}-${idx}`,
            role: "assistant" as const,
            content: "",
            videoUrl: item.url,
          })),
        ]);
      }

      if (hasIaCallCloserReady) {
        if (parsed.iaCallCloserSeed?.name) setLeadName(parsed.iaCallCloserSeed.name.trim());
        if (parsed.iaCallCloserSeed?.phone) setLeadPhone(sanitizePhone(parsed.iaCallCloserSeed.phone));
        if (parsed.iaCallCloserSeed?.collected_info) setCollectedInfoSeed(parsed.iaCallCloserSeed.collected_info);

        setHandoffEligible(true);
        setLeadConsentAccepted(false);
        setShowExitIntent(false);
        setConsentVisible(true);
        return;
      }

      const actionCandidates: Array<{
        index: number;
        url: string;
        notice: string;
        label: string;
      }> = [];

      if (parsed.whatsappIndex !== null && whatsappUrl) {
        actionCandidates.push({
          index: parsed.whatsappIndex,
          url: whatsappUrl,
          notice: copy.openingWhatsApp,
          label: copy.openWhatsAppNow,
        });
      }

      if (parsed.iaCallCloserRedirectIndex !== null && iaCallCloserRedirectUrl) {
        actionCandidates.push({
          index: parsed.iaCallCloserRedirectIndex,
          url: iaCallCloserRedirectUrl,
          notice: copy.openingIACallCloser,
          label: copy.openIACallCloserNow,
        });
      }

      if (actionCandidates.length > 0) {
        actionCandidates.sort((a, b) => a.index - b.index);
        const action = actionCandidates[0];
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: action.notice,
            actionUrl: action.url,
            actionLabel: action.label,
          },
        ]);
        window.setTimeout(() => {
          openTrackedAction(action.url, "auto");
        }, 1400);
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

  handleSendFromVoiceRef.current = (voiceText: string) => {
    void handleSend(voiceText);
  };

  const submitHandoff = async (event: FormEvent) => {
    event.preventDefault();
    if (!config?.widgetId) return;

    const cleanName = leadName.trim();
    const cleanPhone = sanitizePhone(leadPhone);
    const isNameValid = cleanName.length >= 2;
    const isPhoneValid = cleanPhone.length >= 8 && cleanPhone.length <= 15;
    if (!isNameValid || !isPhoneValid) {
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

      const redirectUrl = sanitizeHttpUrl(
        String(payload?.redirectUrl || config.iacloserRedirectUrl || FIXED_IACLOSER_REDIRECT_URL),
      );
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
        const redirectEventType = inferChatEventTypeByUrl(redirectUrl);
        if (redirectEventType) {
          void trackConversationEvent(redirectEventType, { trigger: "handoff" });
        }
        startRedirectCountdown(redirectUrl, locale);
      }
    } catch (error: any) {
      setChatError(error?.message || "Could not complete handoff.");
    } finally {
      setHandoffLoading(false);
    }
  };

  const isLeadNameValid = leadName.trim().length >= 2;
  const leadPhoneDigits = sanitizePhone(leadPhone);
  const isLeadPhoneValid = leadPhoneDigits.length >= 8 && leadPhoneDigits.length <= 15;
  const canSubmitLeadHandoff = isLeadNameValid && isLeadPhoneValid && leadConsentAccepted && !handoffLoading;

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
  const themeDesktopLabel = isLightMode ? (locale === "es" ? "Oscuro" : "Dark") : (locale === "es" ? "Claro" : "Light");
  const statusActionRow = (
    <>
      <div
        className={`inline-flex shrink-0 max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition-all duration-500 animate-[pulse_3.2s_ease-in-out_infinite] ${
          isLightMode ? "border-rose-200 bg-rose-50 text-rose-700" : "border-rose-400/40 bg-rose-500/10 text-rose-100"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        <span className="max-w-[170px] truncate sm:max-w-[300px]">{activePresenceMessage}</span>
      </div>
      <button
        type="button"
        onClick={openConsentStep}
        disabled={!handoffEligible}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
          handoffEligible || handoffLoading || Boolean(handoffMessage)
            ? (isLightMode
              ? "border-emerald-300/75 bg-emerald-100 text-emerald-800 hover:bg-emerald-100/85"
              : "border-emerald-300/45 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/20 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35)]")
            : (isLightMode ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500" : "cursor-not-allowed border-white/15 bg-white/5 text-slate-400")
        }`}
      >
        <PhoneCall className="hidden h-3.5 w-3.5 sm:block" />
        <span className="max-w-[128px] truncate sm:max-w-none">
          {handoffLoading || handoffMessage
            ? copy.callingBadge
            : handoffEligible
              ? (config.leadChatBadgeText || copy.readyBadge)
              : copy.prequalifyingBadge}
        </span>
      </button>
    </>
  );
  const testimonialInstagramStyle = isLightMode
    ? {
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.95), rgba(248,250,252,0.93)), linear-gradient(118deg, rgba(14,165,233,0.52), rgba(56,189,248,0.24), rgba(148,163,184,0.45), rgba(14,165,233,0.5))",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        backgroundSize: "100% 100%, 180% 180%",
      }
    : {
        backgroundImage:
          "linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.86)), linear-gradient(120deg, #f58529, #dd2a7b, #8134af, #515bd4, #feda77, #f58529)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        backgroundSize: "100% 100%, 220% 220%",
      };

  return (
    <main className={`relative min-h-[100dvh] overflow-hidden ${isLightMode ? "bg-[#eef3fb] text-slate-900" : "bg-[#050b15] text-slate-100"}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${isLightMode ? "bg-sky-300/25" : "bg-cyan-400/20"}`} />
        <div className={`absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${isLightMode ? "bg-indigo-300/20" : "bg-emerald-400/10"}`} />
        <div className={`absolute top-[28%] -left-20 h-64 w-64 rounded-full blur-3xl ${isLightMode ? "bg-fuchsia-200/25" : "bg-fuchsia-500/10"}`} />
      </div>

      <div className="relative mx-auto h-[100dvh] w-full max-w-[1080px] px-0 pb-0 pt-0 sm:h-auto sm:px-5 sm:pb-10 sm:pt-4 lg:px-6 lg:pb-12 lg:pt-6">
        <section className="min-w-0 h-full">
          <div className={`flex h-full min-h-[100dvh] flex-col rounded-none p-0 sm:h-[calc(100dvh-6rem)] sm:max-h-[860px] sm:min-h-[560px] sm:rounded-[34px] sm:p-[1px] shadow-[0_30px_120px_-60px_rgba(56,189,248,0.55)] ${isLightMode ? "bg-gradient-to-b from-white via-sky-100/70 to-sky-100/30" : "bg-gradient-to-b from-white/30 via-slate-500/25 to-transparent"}`}>
            <div className={`relative flex h-full min-h-0 flex-col rounded-none sm:rounded-[33px] border backdrop-blur-2xl ${isLightMode ? "border-white/70 bg-white/85" : "border-white/10 bg-[#071322]/85"}`}>
              <div className={`relative flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-7 sm:py-5 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                <div className="min-w-0 pr-24 sm:pr-0">
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
                  <div className="mt-2 hidden sm:block">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      isLightMode ? "border-sky-200 bg-sky-50 text-sky-700" : "border-cyan-400/35 bg-cyan-400/10 text-cyan-100"
                    }`}>
                      {config.leadChatBadgeText || copy.readyBadge}
                    </span>
                  </div>
                </div>
                <div className="absolute right-4 top-4 inline-flex items-center justify-end gap-1.5 sm:static sm:ml-auto sm:gap-2">
                  <div
                    className={`inline-flex h-9 items-center gap-1 rounded-full border p-1 sm:h-10 ${
                      isLightMode ? "border-slate-300 bg-white" : "border-white/15 bg-white/5"
                    }`}
                    role="group"
                    aria-label={locale === "es" ? "Selector de idioma" : "Language selector"}
                  >
                    <button
                      type="button"
                      onClick={() => handleLanguageChange("es")}
                      className={`inline-flex h-8 min-w-[38px] items-center justify-center rounded-full px-2 text-[11px] font-semibold tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 ${
                        locale === "es"
                          ? (isLightMode ? "bg-sky-600 text-white focus-visible:ring-sky-300" : "bg-cyan-400/80 text-slate-950 focus-visible:ring-cyan-300")
                          : (isLightMode ? "text-slate-600 hover:bg-slate-100 focus-visible:ring-sky-300" : "text-slate-300 hover:bg-white/10 focus-visible:ring-cyan-300")
                      }`}
                      aria-pressed={locale === "es"}
                    >
                      ES
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange("en")}
                      className={`inline-flex h-8 min-w-[38px] items-center justify-center rounded-full px-2 text-[11px] font-semibold tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 ${
                        locale === "en"
                          ? (isLightMode ? "bg-sky-600 text-white focus-visible:ring-sky-300" : "bg-cyan-400/80 text-slate-950 focus-visible:ring-cyan-300")
                          : (isLightMode ? "text-slate-600 hover:bg-slate-100 focus-visible:ring-sky-300" : "text-slate-300 hover:bg-white/10 focus-visible:ring-cyan-300")
                      }`}
                      aria-pressed={locale === "en"}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:h-10 sm:w-10 ${
                      isLightMode
                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 lg:shadow-[0_0_0_1px_rgba(56,189,248,0.35)] lg:hover:shadow-[0_0_0_2px_rgba(56,189,248,0.5)]"
                        : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 lg:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] lg:hover:shadow-[0_0_0_2px_rgba(34,211,238,0.5)]"
                    }`}
                    aria-label={isLightMode ? copy.themeAriaDark : copy.themeAriaLight}
                  >
                    {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span className="sr-only">{themeDesktopLabel}</span>
                  </button>
                </div>
              </div>

              <div className={`px-4 py-2 sm:px-7 sm:py-3 ${isLightMode ? "border-b border-slate-200 bg-white/80" : "border-b border-white/10 bg-white/[0.03]"}`}>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible lg:pb-0">
                    {statusActionRow}
                  </div>
                  {showLiveActivityStrip ? (
                    <div className={`hidden max-w-[320px] rounded-xl border px-3 py-2 text-xs lg:block lg:w-auto ${
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
                        ? "border-transparent text-slate-700"
                        : "border-transparent text-slate-100"
                    } ${testimonialTransition ? (isLightMode ? "shadow-[0_0_24px_-16px_rgba(56,189,248,0.6)]" : "shadow-[0_0_35px_-16px_rgba(34,211,238,0.9)]") : ""}`}
                    style={testimonialInstagramStyle}
                  >
                    <div
                      className={`pointer-events-none absolute -inset-16 transition-opacity duration-500 ${testimonialTransition ? "opacity-100" : "opacity-0"}`}
                      style={{
                        background: isLightMode
                          ? "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.28) 0%, rgba(148,163,184,0.2) 40%, rgba(255,255,255,0) 74%)"
                          : "radial-gradient(circle at 50% 50%, rgba(125,211,252,0.42) 0%, rgba(52,211,153,0.25) 35%, rgba(2,6,23,0) 72%)",
                      }}
                    />
                    <div className="relative min-w-0">
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLightMode ? "text-sky-700" : "text-cyan-200"}`}>
                        {copy.testimonialLabel}
                      </p>
                      <p className="mt-0.5 truncate text-xs">
                        "{testimonialStripText}"
                      </p>
                      <div className={`mt-1 flex min-w-0 items-center gap-1.5 text-[11px] ${isLightMode ? "text-slate-500" : "text-slate-300"}`}>
                        <span className="truncate">{testimonialStripAuthor}</span>
                        <span aria-hidden="true" className="opacity-60">|</span>
                        <span
                          className="inline-flex shrink-0 rounded-full border border-amber-300/70 bg-gradient-to-b from-amber-100/80 to-amber-300/25 px-1.5 py-0.5 text-[10px] leading-none shadow-[0_0_10px_rgba(251,191,36,0.42)]"
                          style={{ textShadow: "0 0 6px rgba(251,191,36,0.75)" }}
                          aria-label={`${testimonialStarsCount} stars`}
                        >
                          {testimonialStripStars}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-7">
                {messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "system" && msg.actionUrl ? (
                      <div className={`w-full max-w-[88%] rounded-xl border px-3.5 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        isLightMode
                          ? "border-emerald-300 bg-emerald-100/90 text-emerald-800"
                          : "border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <Button
                          type="button"
                          className="mt-2 h-9 w-full bg-[#25D366] text-white hover:bg-[#1ea955]"
                          onClick={() => openTrackedAction(String(msg.actionUrl || ""), "button")}
                        >
                          {msg.actionLabel || copy.openIACallCloserNow}
                        </Button>
                      </div>
                    ) : (
                      (() => {
                        const hasMediaOnly = !msg.content && (Boolean(msg.imageUrl) || Boolean(msg.audioUrl) || Boolean(msg.videoUrl));
                        const shouldExpandForAudio = Boolean(msg.audioUrl || msg.videoUrl);
                        return (
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
                        } ${hasMediaOnly || shouldExpandForAudio ? "min-w-[230px]" : ""}`}
                        style={msg.role === "user" ? { backgroundColor: config.primaryColor || "#00C185" } : {}}
                      >
                        {msg.content ? <p>{msg.content}</p> : null}
                        {msg.imageUrl ? (
                          <img
                            src={msg.imageUrl}
                            alt={msg.imageAlt || "Assistant image"}
                            loading="lazy"
                            className="mt-2 w-full max-w-[280px] rounded-xl border border-white/10 object-cover"
                          />
                        ) : null}
                        {msg.audioUrl ? (
                          <PremiumAudioPlayer
                            src={msg.audioUrl}
                            theme={isLightMode ? "light" : "dark"}
                            className="mt-2"
                            label={copy.talkNow}
                          />
                        ) : null}
                        {msg.videoUrl ? (
                          <video
                            controls
                            preload="metadata"
                            playsInline
                            className="mt-2 w-full max-w-[280px] rounded-xl border border-white/10 bg-black/80"
                          >
                            <source src={msg.videoUrl} />
                          </video>
                        ) : null}
                      </div>
                        );
                      })()
                    )}
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
                            aria-invalid={!isLeadNameValid && leadName.trim().length > 0}
                            className={`bg-slate-900 ${!isLeadNameValid && leadName.trim().length > 0 ? "border-rose-500/80 focus-visible:ring-rose-400" : "border-slate-700"}`}
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
                            aria-invalid={!isLeadPhoneValid && leadPhone.length > 0}
                            className={`bg-slate-900 ${!isLeadPhoneValid && leadPhone.length > 0 ? "border-rose-500/80 focus-visible:ring-rose-400" : "border-slate-700"}`}
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
                        <Button type="submit" disabled={!canSubmitLeadHandoff} className="w-full gap-2">
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
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs shadow-sm transition-all duration-300 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 motion-safe:animate-[pulse_3.8s_ease-in-out_infinite] ${
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
                          ? "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          : "border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                      }`}
                      aria-label={speechListening ? copy.micAriaStop : copy.micAriaStart}
                      disabled={sending || assistantTyping}
                    >
                      {speechListening ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setInput(nextValue);
                        if (nextValue.trim()) markUserInteraction();
                      }}
                      onFocus={markUserInteraction}
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
                <div className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] ${isLightMode ? "text-slate-600" : "text-slate-300/80"}`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {copy.trustBullets.map((item, index) => (
                      <span key={`trust-footer-${item}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span>{item}</span>
                        {index < copy.trustBullets.length - 1 ? <span aria-hidden="true" className="opacity-60">•</span> : null}
                      </span>
                    ))}
                  </div>
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <ShieldCheck className={`h-3.5 w-3.5 ${isLightMode ? "text-emerald-600" : "text-emerald-300"}`} />
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
                    <span>{copy.liveDemosNow}</span>
                  </div>
                </div>
              </div>

              {speechListening ? (
                <div className={`absolute inset-0 z-40 flex items-center justify-center px-5 ${isLightMode ? "bg-slate-900/45" : "bg-slate-950/70"} backdrop-blur-sm`}>
                  <div className={`w-full max-w-xl rounded-2xl border p-5 sm:p-6 ${isLightMode ? "border-slate-200 bg-white/95 text-slate-800" : "border-white/15 bg-slate-900/92 text-slate-100"}`} role="status" aria-live="polite">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{copy.talkNow}</p>
                        <p className={`text-xs ${isLightMode ? "text-slate-500" : "text-slate-300"}`}>{copy.listeningNow}</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleSpeechInput}
                        className="relative inline-flex h-28 w-28 items-center justify-center rounded-full border border-white/55 bg-white/5 text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                        aria-label={copy.micAriaStop}
                      >
                        <span className="absolute inset-0 rounded-full border border-rose-400/50 animate-ping" />
                        <span className="absolute inset-3 rounded-full border border-rose-300/70" />
                        <Mic className="relative z-10 h-8 w-8" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
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
            <h3 className={`mt-2 break-words text-xl font-semibold ${isLightMode ? "text-slate-800" : "text-slate-100"}`}>{config.exitIntentTitle || copy.exitIntentDetected}</h3>
            <p className={`mt-2 break-words text-sm ${isLightMode ? "text-slate-600" : "text-slate-300"}`}>
              {config.exitIntentDescription || copy.offerDescription}
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                className="h-auto whitespace-normal break-words px-3 py-2 text-center leading-snug"
                onClick={() => {
                  setShowExitIntent(false);
                  inputRef.current?.focus();
                }}
              >
                {config.exitIntentCta || copy.continueChat}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto whitespace-normal break-words px-3 py-2 text-center leading-snug"
                onClick={() => setShowExitIntent(false)}
              >
                {copy.continueBrowsing}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

