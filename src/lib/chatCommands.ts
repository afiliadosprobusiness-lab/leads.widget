export type IACloserSeed = {
  name?: string;
  phone?: string;
  collected_info?: string;
};

export type ChatImagePayload = {
  url: string;
  alt: string;
  index: number;
};

export type ChatAudioPayload = {
  url: string;
  index: number;
};

export type ParsedChatCommands = {
  cleanText: string;
  whatsappPayload: string;
  whatsappIndex: number | null;
  iaCallCloserRedirectUrl: string;
  iaCallCloserRedirectIndex: number | null;
  iaCallCloserReady: boolean;
  iaCallCloserReadyIndex: number | null;
  iaCallCloserSeed: IACloserSeed;
  images: ChatImagePayload[];
  audios: ChatAudioPayload[];
};

const WHATSAPP_COMMAND_RE = /\[\s*WHATSAPP_REDIRECT\s*:\s*([\s\S]*?)\]/gi;
const IACALLCLOSER_REDIRECT_RE = /\[\s*(?:ICLOSER_REDIRECT|ICALLCLOSER_REDIRECT|IACALLCLOSER_REDIRECT)\s*:\s*([\s\S]*?)\]/gi;
const IACALLCLOSER_READY_RE = /\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)(?:\s*:\s*([\s\S]*?))?\s*\]/gi;
const IMAGE_COMMAND_RE = /\[\s*(?:IMAGE|IMG|PHOTO)\s*:\s*([\s\S]*?)\]/gi;
const AUDIO_COMMAND_RE = /\[\s*(?:AUDIO|VOICE|SOUND)\s*:\s*([\s\S]*?)\]/gi;
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "").trim();
}

export function optimizeImageDeliveryUrl(rawUrl: string) {
  const safeUrl = sanitizeHttpUrl(rawUrl);
  if (!safeUrl) return "";

  try {
    const parsed = new URL(safeUrl);
    if (!/(\.|^)res\.cloudinary\.com$/i.test(parsed.hostname)) return safeUrl;
    if (!/\/image\/upload\//.test(parsed.pathname)) return safeUrl;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === "upload");
    if (uploadIndex < 0) return safeUrl;

    const nextSegment = segments[uploadIndex + 1] || "";
    const hasTransformSegment = Boolean(nextSegment) && !/^v\d+$/i.test(nextSegment);
    if (hasTransformSegment) {
      // Respect existing explicit transformations to avoid breaking authored URLs.
      return safeUrl;
    }

    segments.splice(uploadIndex + 1, 0, "f_auto,q_auto:good,c_limit,w_960");
    parsed.pathname = `/${segments.join("/")}`;
    return parsed.toString();
  } catch {
    return safeUrl;
  }
}

function parseImagePayload(rawPayload: string) {
  const payload = stripQuotes(rawPayload || "");
  if (!payload) return { url: "", alt: "" };

  try {
    const asJson = JSON.parse(payload);
    if (asJson && typeof asJson === "object") {
      const candidateUrl =
        typeof (asJson as { url?: string }).url === "string"
          ? (asJson as { url: string }).url
          : typeof (asJson as { image?: string }).image === "string"
            ? (asJson as { image: string }).image
            : "";
      const candidateAlt =
        typeof (asJson as { alt?: string }).alt === "string"
          ? (asJson as { alt: string }).alt
          : typeof (asJson as { caption?: string }).caption === "string"
            ? (asJson as { caption: string }).caption
            : "";
      return {
        url: optimizeImageDeliveryUrl(candidateUrl),
        alt: cleanText(candidateAlt),
      };
    }
  } catch {
    // noop
  }

  const [rawUrl, ...altParts] = payload.split("|");
  return {
    url: optimizeImageDeliveryUrl(rawUrl || ""),
    alt: cleanText(altParts.join("|")),
  };
}

function parseAudioPayload(rawPayload: string) {
  const payload = stripQuotes(rawPayload || "");
  if (!payload) return { url: "" };

  try {
    const asJson = JSON.parse(payload);
    if (asJson && typeof asJson === "object") {
      const candidateUrl =
        typeof (asJson as { url?: string }).url === "string"
          ? (asJson as { url: string }).url
          : typeof (asJson as { audio?: string }).audio === "string"
            ? (asJson as { audio: string }).audio
            : "";
      return {
        url: sanitizeHttpUrl(candidateUrl),
      };
    }
  } catch {
    // noop
  }

  return {
    url: sanitizeHttpUrl(payload),
  };
}

export function sanitizeHttpUrl(value: string, maxLength = 500) {
  const normalized = cleanText(value);
  if (!normalized || normalized.length > maxLength) return "";
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function buildWhatsAppRedirectUrl(destination: string, message: string) {
  const cleanDestination = String(destination || "").replace(/\D/g, "");
  if (!cleanDestination) return "";
  const cleanMessage = cleanText(message);
  if (!cleanMessage) {
    return `https://wa.me/${cleanDestination}`;
  }
  return `https://wa.me/${cleanDestination}?text=${encodeURIComponent(cleanMessage)}`;
}

export function parseChatResponseCommands(
  responseText: string,
  options?: { defaultIaCallCloserUrl?: string },
): ParsedChatCommands {
  const raw = String(responseText || "");
  const defaultIaCallCloserUrl = sanitizeHttpUrl(options?.defaultIaCallCloserUrl || "");
  const output: ParsedChatCommands = {
    cleanText: raw.trim(),
    whatsappPayload: "",
    whatsappIndex: null,
    iaCallCloserRedirectUrl: "",
    iaCallCloserRedirectIndex: null,
    iaCallCloserReady: false,
    iaCallCloserReadyIndex: null,
    iaCallCloserSeed: {},
    images: [],
    audios: [],
  };

  let match: RegExpExecArray | null;
  WHATSAPP_COMMAND_RE.lastIndex = 0;
  while ((match = WHATSAPP_COMMAND_RE.exec(raw)) !== null) {
    if (output.whatsappIndex === null || match.index < output.whatsappIndex) {
      output.whatsappPayload = stripQuotes(match[1] || "");
      output.whatsappIndex = match.index;
    }
  }

  IACALLCLOSER_REDIRECT_RE.lastIndex = 0;
  while ((match = IACALLCLOSER_REDIRECT_RE.exec(raw)) !== null) {
    if (output.iaCallCloserRedirectIndex === null || match.index < output.iaCallCloserRedirectIndex) {
      const payloadUrl = sanitizeHttpUrl(stripQuotes(match[1] || ""));
      output.iaCallCloserRedirectUrl = payloadUrl || defaultIaCallCloserUrl;
      output.iaCallCloserRedirectIndex = match.index;
    }
  }

  IACALLCLOSER_READY_RE.lastIndex = 0;
  while ((match = IACALLCLOSER_READY_RE.exec(raw)) !== null) {
    if (output.iaCallCloserReadyIndex === null || match.index < output.iaCallCloserReadyIndex) {
      output.iaCallCloserReady = true;
      output.iaCallCloserReadyIndex = match.index;
      const maybeJson = cleanText(match[1] || "");
      if (!maybeJson) {
        output.iaCallCloserSeed = {};
      } else {
        try {
          const parsed = JSON.parse(maybeJson);
          if (parsed && typeof parsed === "object") {
            output.iaCallCloserSeed = {
              name: typeof parsed.name === "string" ? parsed.name.trim() : "",
              phone: typeof parsed.phone === "string" ? parsed.phone.trim() : "",
              collected_info: typeof parsed.collected_info === "string" ? parsed.collected_info.trim() : "",
            };
          }
        } catch {
          output.iaCallCloserSeed = {};
        }
      }
    }
  }

  IMAGE_COMMAND_RE.lastIndex = 0;
  while ((match = IMAGE_COMMAND_RE.exec(raw)) !== null) {
    const parsedImage = parseImagePayload(match[1] || "");
    if (parsedImage.url) {
      output.images.push({
        url: parsedImage.url,
        alt: parsedImage.alt,
        index: match.index,
      });
    }
  }

  MARKDOWN_IMAGE_RE.lastIndex = 0;
  while ((match = MARKDOWN_IMAGE_RE.exec(raw)) !== null) {
    const markdownUrl = sanitizeHttpUrl(match[2] || "");
    if (markdownUrl) {
      output.images.push({
        url: optimizeImageDeliveryUrl(markdownUrl),
        alt: cleanText(match[1] || ""),
        index: match.index,
      });
    }
  }

  AUDIO_COMMAND_RE.lastIndex = 0;
  while ((match = AUDIO_COMMAND_RE.exec(raw)) !== null) {
    const parsedAudio = parseAudioPayload(match[1] || "");
    if (parsedAudio.url) {
      output.audios.push({
        url: parsedAudio.url,
        index: match.index,
      });
    }
  }

  output.images.sort((a, b) => a.index - b.index);
  output.images = output.images.slice(0, 4);
  output.audios.sort((a, b) => a.index - b.index);
  output.audios = output.audios.slice(0, 4);

  output.cleanText = raw
    .replace(WHATSAPP_COMMAND_RE, "")
    .replace(IACALLCLOSER_REDIRECT_RE, "")
    .replace(IACALLCLOSER_READY_RE, "")
    .replace(IMAGE_COMMAND_RE, "")
    .replace(MARKDOWN_IMAGE_RE, "")
    .replace(AUDIO_COMMAND_RE, "")
    .trim();

  return output;
}
