const META_NUMERIC_ID_RE = /^\d{5,25}$/;
const META_ACCESS_TOKEN_MIN_LENGTH = 20;

export interface MetaCapiConfigInput {
  businessManagerId?: string | null;
  adAccountId?: string | null;
  datasetId?: string | null;
  accessToken?: string | null;
}

export interface MetaCapiConfigNormalized {
  businessManagerId: string | null;
  adAccountId: string | null;
  datasetId: string | null;
  accessToken: string | null;
}

export interface ValidateMetaCapiOptions {
  requireIdentifiers?: boolean;
  requireAccessToken?: boolean;
  hasStoredAccessToken?: boolean;
}

function normalizeLine(value?: string | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeNumericId(value?: string | null): string | null {
  const normalized = normalizeLine(value).replace(/\s+/g, "");
  return normalized || null;
}

function normalizeAdAccountId(value?: string | null): string | null {
  const normalized = normalizeLine(value).replace(/\s+/g, "");
  if (!normalized) return null;
  return normalized.replace(/^act_/i, "");
}

export function normalizeMetaCapiConfig(input: MetaCapiConfigInput): MetaCapiConfigNormalized {
  return {
    businessManagerId: normalizeNumericId(input.businessManagerId),
    adAccountId: normalizeAdAccountId(input.adAccountId),
    datasetId: normalizeNumericId(input.datasetId),
    accessToken: normalizeLine(input.accessToken) || null,
  };
}

export function validateMetaCapiConfig(input: MetaCapiConfigInput, options: ValidateMetaCapiOptions = {}): string[] {
  const normalized = normalizeMetaCapiConfig(input);
  const errors: string[] = [];

  if (options.requireIdentifiers && !normalized.businessManagerId) {
    errors.push("El Business Manager ID es obligatorio.");
  } else if (normalized.businessManagerId && !META_NUMERIC_ID_RE.test(normalized.businessManagerId)) {
    errors.push("El Business Manager ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (options.requireIdentifiers && !normalized.adAccountId) {
    errors.push("El Ad Account ID es obligatorio.");
  } else if (normalized.adAccountId && !META_NUMERIC_ID_RE.test(normalized.adAccountId)) {
    errors.push("El Ad Account ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (options.requireIdentifiers && !normalized.datasetId) {
    errors.push("El Pixel/Dataset ID es obligatorio.");
  } else if (normalized.datasetId && !META_NUMERIC_ID_RE.test(normalized.datasetId)) {
    errors.push("El Pixel/Dataset ID debe contener solo numeros (5 a 25 digitos).");
  }

  if (options.requireAccessToken && !normalized.accessToken && !options.hasStoredAccessToken) {
    errors.push("El Access Token de Conversions API es obligatorio.");
  } else if (normalized.accessToken && normalized.accessToken.length < META_ACCESS_TOKEN_MIN_LENGTH) {
    errors.push("El Access Token de Conversions API parece incompleto.");
  }

  return errors;
}
