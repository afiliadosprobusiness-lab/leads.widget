import { describe, expect, it } from "vitest";

import {
  normalizeMetaCapiConfig,
  validateMetaCapiConfig,
} from "@/lib/metaCapi";

describe("metaCapi utils", () => {
  it("normalizes ids and strips act_ prefix from ad account", () => {
    const result = normalizeMetaCapiConfig({
      businessManagerId: " 123456789012345 ",
      adAccountId: " act_987654321 ",
      datasetId: " 112233445566 ",
      accessToken: " token_abc ",
    });

    expect(result.businessManagerId).toBe("123456789012345");
    expect(result.adAccountId).toBe("987654321");
    expect(result.datasetId).toBe("112233445566");
    expect(result.accessToken).toBe("token_abc");
  });

  it("validates required identifiers and token when requested", () => {
    const errors = validateMetaCapiConfig(
      {
        businessManagerId: "",
        adAccountId: "",
        datasetId: "",
        accessToken: "",
      },
      {
        requireIdentifiers: true,
        requireAccessToken: true,
        hasStoredAccessToken: false,
      },
    );

    expect(errors).toHaveLength(4);
  });

  it("accepts empty token when one is already stored", () => {
    const errors = validateMetaCapiConfig(
      {
        businessManagerId: "1234567",
        adAccountId: "7654321",
        datasetId: "99887766",
        accessToken: "",
      },
      {
        requireIdentifiers: true,
        requireAccessToken: true,
        hasStoredAccessToken: true,
      },
    );

    expect(errors).toHaveLength(0);
  });

  it("detects invalid numeric id formats", () => {
    const errors = validateMetaCapiConfig(
      {
        businessManagerId: "abc123",
        adAccountId: "act_",
        datasetId: "12",
        accessToken: "valid_token_with_reasonable_length_123456",
      },
      {
        requireIdentifiers: true,
      },
    );

    expect(errors).toHaveLength(3);
  });
});
