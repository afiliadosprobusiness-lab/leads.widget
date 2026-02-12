export const CUSTOM_TRACKING_CODE_MAX_LENGTH = 5000;

const FACEBOOK_PIXEL_ID_RE = /^\d{5,20}$/;
const TIKTOK_PIXEL_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const GOOGLE_TAG_ID_RE = /^(G-[A-Z0-9]+|AW-\d+|GTM-[A-Z0-9]+|DC-\d+|UA-\d+-\d+)$/i;

export interface TrackingPixelsInput {
  facebookPixelId?: string;
  tiktokPixelId?: string;
  googleTagId?: string;
  customCode?: string;
}

export interface TrackingPixelsNormalized {
  facebookPixelId: string;
  tiktokPixelId: string;
  googleTagId: string;
  customCode: string;
}

function normalizeLine(value?: string): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeCustomCode(value?: string): string {
  const trimmed = normalizeLine(value);
  if (!trimmed) return "";

  const wrappedScript = trimmed.match(/^<script[^>]*>([\s\S]*?)<\/script>$/i);
  const code = wrappedScript ? wrappedScript[1].trim() : trimmed;
  return code.slice(0, CUSTOM_TRACKING_CODE_MAX_LENGTH);
}

export function normalizeTrackingPixels(input: TrackingPixelsInput): TrackingPixelsNormalized {
  const facebookPixelId = normalizeLine(input.facebookPixelId).replace(/\s+/g, "");
  const tiktokPixelId = normalizeLine(input.tiktokPixelId).replace(/\s+/g, "");
  const googleTagId = normalizeLine(input.googleTagId).toUpperCase();
  const customCode = normalizeCustomCode(input.customCode);

  return {
    facebookPixelId,
    tiktokPixelId,
    googleTagId,
    customCode,
  };
}

export function validateTrackingPixels(input: TrackingPixelsInput): string[] {
  const normalized = normalizeTrackingPixels(input);
  const errors: string[] = [];

  if (normalized.facebookPixelId && !FACEBOOK_PIXEL_ID_RE.test(normalized.facebookPixelId)) {
    errors.push("El Pixel de Facebook debe contener solo números (5 a 20 dígitos).");
  }

  if (normalized.tiktokPixelId && !TIKTOK_PIXEL_ID_RE.test(normalized.tiktokPixelId)) {
    errors.push("El Pixel de TikTok tiene un formato inválido.");
  }

  if (normalized.googleTagId && !GOOGLE_TAG_ID_RE.test(normalized.googleTagId)) {
    errors.push("El Tag de Google debe ser tipo G-, AW-, GTM-, DC- o UA-.");
  }

  return errors;
}
