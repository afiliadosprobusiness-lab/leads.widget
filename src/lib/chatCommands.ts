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

export type ChatVideoPayload = {
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
  videos: ChatVideoPayload[];
};

const WHATSAPP_COMMAND_RE = /\[\s*WHATSAPP_REDIRECT\s*:\s*([\s\S]*?)\]/gi;
const IACALLCLOSER_REDIRECT_RE = /\[\s*(?:ICLOSER_REDIRECT|ICALLCLOSER_REDIRECT|IACALLCLOSER_REDIRECT)\s*:\s*([\s\S]*?)\]/gi;
const IACALLCLOSER_READY_RE = /\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)(?:\s*:\s*([\s\S]*?))?\s*\]/gi;
const DNI_VALIDATE_COMMAND_RE = /\[\s*VALIDAR_DNI(?:\s*:\s*([\s\S]*?))?\s*\]|\{\s*validar_dni(?:\s*:\s*([\s\S]*?))?\s*\}/gi;
const IMAGE_COMMAND_RE = /\[\s*(?:IMAGE|IMG|PHOTO)\s*:\s*([\s\S]*?)\]/gi;
const AUDIO_COMMAND_RE = /\[\s*(?:AUDIO|VOICE|SOUND)\s*:\s*([\s\S]*?)\]/gi;
const VIDEO_COMMAND_RE = /\[\s*(?:VIDEO|VID|CLIP)\s*:\s*([\s\S]*?)\]/gi;
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "").trim();
}

function splitMediaPayloadSegments(payload: string) {
  return String(payload || "")
    .split(/\r?\n+|,(?=\s*https?:\/\/)|;(?=\s*https?:\/\/)/gi)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractHttpUrlsFromText(
  input: string,
  sanitizer: (value: string) => string,
) {
  const text = String(input || "");
  if (!text) return [] as string[];
  const urlRegex = /https?:\/\/[^\s<>"'`)\]}]+/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const rawCandidate = String(match[0] || "").replace(/[.,;!?]+$/g, "");
    const safeUrl = sanitizer(rawCandidate);
    if (safeUrl) urls.push(safeUrl);
  }
  return urls;
}

function dedupeByUrl<T extends { url: string }>(entries: T[]) {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of entries) {
    const url = String(item?.url || "");
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push(item);
  }
  return output;
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

function parseImagePayloads(rawPayload: string) {
  const payload = stripQuotes(rawPayload || "");
  if (!payload) return [] as Array<{ url: string; alt: string }>;
  const parsedItems: Array<{ url: string; alt: string }> = [];

  try {
    const asJson = JSON.parse(payload);
    const pushEntry = (candidateUrl: string, candidateAlt = "") => {
      const safeUrl = optimizeImageDeliveryUrl(candidateUrl);
      if (!safeUrl) return;
      parsedItems.push({
        url: safeUrl,
        alt: cleanText(candidateAlt),
      });
    };

    const appendFromObject = (value: Record<string, unknown>) => {
      pushEntry(
        typeof value.url === "string"
          ? value.url
          : typeof value.image === "string"
            ? value.image
            : typeof value.src === "string"
              ? value.src
              : "",
        typeof value.alt === "string"
          ? value.alt
          : typeof value.caption === "string"
            ? value.caption
            : typeof value.title === "string"
              ? value.title
              : "",
      );

      const listCandidates = [value.images, value.image_urls, value.urls, value.photos];
      for (const candidate of listCandidates) {
        if (!Array.isArray(candidate)) continue;
        for (const item of candidate) {
          if (typeof item === "string") {
            pushEntry(item, "");
            continue;
          }
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            pushEntry(
              typeof obj.url === "string"
                ? obj.url
                : typeof obj.image === "string"
                  ? obj.image
                  : typeof obj.src === "string"
                    ? obj.src
                    : "",
              typeof obj.alt === "string"
                ? obj.alt
                : typeof obj.caption === "string"
                  ? obj.caption
                  : typeof obj.title === "string"
                    ? obj.title
                    : "",
            );
          }
        }
      }
    };

    if (Array.isArray(asJson)) {
      for (const item of asJson) {
        if (typeof item === "string") {
          pushEntry(item, "");
          continue;
        }
        if (item && typeof item === "object") {
          appendFromObject(item as Record<string, unknown>);
        }
      }
      return dedupeByUrl(parsedItems);
    }

    if (asJson && typeof asJson === "object") {
      appendFromObject(asJson as Record<string, unknown>);
      return dedupeByUrl(parsedItems);
    }
  } catch {
    // noop
  }

  const segments = splitMediaPayloadSegments(payload);
  for (const segment of segments) {
    const [rawUrl, ...altParts] = segment.split("|");
    const safeUrl = optimizeImageDeliveryUrl(rawUrl || "");
    if (safeUrl) {
      parsedItems.push({
        url: safeUrl,
        alt: cleanText(altParts.join("|")),
      });
      continue;
    }
    const extracted = extractHttpUrlsFromText(segment, optimizeImageDeliveryUrl);
    for (const item of extracted) {
      parsedItems.push({ url: item, alt: "" });
    }
  }

  if (parsedItems.length > 0) {
    return dedupeByUrl(parsedItems);
  }

  return dedupeByUrl(
    extractHttpUrlsFromText(payload, optimizeImageDeliveryUrl).map((url) => ({
      url,
      alt: "",
    })),
  );
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

function parseVideoPayloads(rawPayload: string) {
  const payload = stripQuotes(rawPayload || "");
  if (!payload) return [] as Array<{ url: string }>;
  const parsedItems: Array<{ url: string }> = [];

  try {
    const asJson = JSON.parse(payload);
    const pushEntry = (candidateUrl: string) => {
      const safeUrl = sanitizeHttpUrl(candidateUrl);
      if (!safeUrl) return;
      parsedItems.push({ url: safeUrl });
    };

    const appendFromObject = (value: Record<string, unknown>) => {
      pushEntry(
        typeof value.url === "string"
          ? value.url
          : typeof value.video === "string"
            ? value.video
            : typeof value.src === "string"
              ? value.src
              : "",
      );

      const listCandidates = [value.videos, value.video_urls, value.urls, value.clips];
      for (const candidate of listCandidates) {
        if (!Array.isArray(candidate)) continue;
        for (const item of candidate) {
          if (typeof item === "string") {
            pushEntry(item);
            continue;
          }
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            pushEntry(
              typeof obj.url === "string"
                ? obj.url
                : typeof obj.video === "string"
                  ? obj.video
                  : typeof obj.src === "string"
                    ? obj.src
                    : "",
            );
          }
        }
      }
    };

    if (Array.isArray(asJson)) {
      for (const item of asJson) {
        if (typeof item === "string") {
          pushEntry(item);
          continue;
        }
        if (item && typeof item === "object") {
          appendFromObject(item as Record<string, unknown>);
        }
      }
      return dedupeByUrl(parsedItems);
    }

    if (asJson && typeof asJson === "object") {
      appendFromObject(asJson as Record<string, unknown>);
      return dedupeByUrl(parsedItems);
    }
  } catch {
    // noop
  }

  const segments = splitMediaPayloadSegments(payload);
  for (const segment of segments) {
    const safeUrl = sanitizeHttpUrl(segment);
    if (safeUrl) {
      parsedItems.push({ url: safeUrl });
      continue;
    }
    const extracted = extractHttpUrlsFromText(segment, sanitizeHttpUrl);
    for (const item of extracted) {
      parsedItems.push({ url: item });
    }
  }

  if (parsedItems.length > 0) {
    return dedupeByUrl(parsedItems);
  }

  return dedupeByUrl(extractHttpUrlsFromText(payload, sanitizeHttpUrl).map((url) => ({ url })));
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
    videos: [],
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
    const parsedImages = parseImagePayloads(match[1] || "");
    parsedImages.forEach((parsedImage, localIndex) => {
      output.images.push({
        url: parsedImage.url,
        alt: parsedImage.alt,
        index: match.index + localIndex / 1000,
      });
    });
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

  VIDEO_COMMAND_RE.lastIndex = 0;
  while ((match = VIDEO_COMMAND_RE.exec(raw)) !== null) {
    const parsedVideos = parseVideoPayloads(match[1] || "");
    parsedVideos.forEach((parsedVideo, localIndex) => {
      output.videos.push({
        url: parsedVideo.url,
        index: match.index + localIndex / 1000,
      });
    });
  }

  output.images.sort((a, b) => a.index - b.index);
  output.images = output.images.slice(0, 5);
  output.audios.sort((a, b) => a.index - b.index);
  output.audios = output.audios.slice(0, 4);
  output.videos.sort((a, b) => a.index - b.index);
  output.videos = output.videos.slice(0, 3);

  output.cleanText = raw
    .replace(WHATSAPP_COMMAND_RE, "")
    .replace(IACALLCLOSER_REDIRECT_RE, "")
    .replace(IACALLCLOSER_READY_RE, "")
    .replace(DNI_VALIDATE_COMMAND_RE, "")
    .replace(IMAGE_COMMAND_RE, "")
    .replace(MARKDOWN_IMAGE_RE, "")
    .replace(AUDIO_COMMAND_RE, "")
    .replace(VIDEO_COMMAND_RE, "")
    .trim();

  return output;
}
