const FACEBOOK_PIXEL_ID_RE = /^\d{5,20}$/;
const TIKTOK_PIXEL_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const GOOGLE_TAG_ID_RE = /^(G-[A-Z0-9]+|AW-\d+|GTM-[A-Z0-9]+|DC-\d+|UA-\d+-\d+)$/;
export const FACEBOOK_PIXEL_ID_MAX_LENGTH = 20;
export const TIKTOK_PIXEL_ID_MAX_LENGTH = 64;
export const GOOGLE_TAG_ID_MAX_LENGTH = 32;

export interface TrackingPixelsInput {
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  googleTagId?: string | null;
}

export interface TrackingPixelsNormalized {
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
  googleTagId: string | null;
}

function normalizeLine(value?: string | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeNullableValue(value?: string | null, transform?: (value: string) => string): string | null {
  const normalized = normalizeLine(value);
  if (!normalized) return null;

  const transformed = transform ? transform(normalized) : normalized;
  return transformed || null;
}

export function normalizeTrackingPixels(input: TrackingPixelsInput): TrackingPixelsNormalized {
  return {
    facebookPixelId: normalizeNullableValue(input.facebookPixelId, (value) => value.replace(/\s+/g, "")),
    tiktokPixelId: normalizeNullableValue(input.tiktokPixelId, (value) => value.replace(/\s+/g, "")),
    googleTagId: normalizeNullableValue(input.googleTagId, (value) => value.replace(/\s+/g, "").toUpperCase()),
  };
}

export function validateTrackingPixels(input: TrackingPixelsInput): string[] {
  const normalized = normalizeTrackingPixels(input);
  const errors: string[] = [];

  if (normalized.facebookPixelId && normalized.facebookPixelId.length > FACEBOOK_PIXEL_ID_MAX_LENGTH) {
    errors.push("El Pixel de Facebook excede la longitud maxima permitida.");
  } else if (normalized.facebookPixelId && !FACEBOOK_PIXEL_ID_RE.test(normalized.facebookPixelId)) {
    errors.push("El Pixel de Facebook debe contener solo numeros (5 a 20 digitos).");
  }

  if (normalized.tiktokPixelId && normalized.tiktokPixelId.length > TIKTOK_PIXEL_ID_MAX_LENGTH) {
    errors.push("El Pixel de TikTok excede la longitud maxima permitida.");
  } else if (normalized.tiktokPixelId && !TIKTOK_PIXEL_ID_RE.test(normalized.tiktokPixelId)) {
    errors.push("El Pixel de TikTok tiene un formato invalido.");
  }

  if (normalized.googleTagId && normalized.googleTagId.length > GOOGLE_TAG_ID_MAX_LENGTH) {
    errors.push("El Tag de Google excede la longitud maxima permitida.");
  } else if (normalized.googleTagId && !GOOGLE_TAG_ID_RE.test(normalized.googleTagId)) {
    errors.push("El Tag de Google debe ser tipo G-, AW-, GTM-, DC- o UA-.");
  }

  return errors;
}
