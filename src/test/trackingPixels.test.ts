import { describe, expect, it } from "vitest";

import {
  CUSTOM_TRACKING_CODE_MAX_LENGTH,
  normalizeTrackingPixels,
  validateTrackingPixels,
} from "@/lib/trackingPixels";

describe("trackingPixels utils", () => {
  it("normalizes ids and trims custom code", () => {
    const result = normalizeTrackingPixels({
      facebookPixelId: " 1234567890 ",
      tiktokPixelId: " abC_123-xy ",
      googleTagId: " g-abc123 ",
      customCode: "   console.log('x');   ",
    });

    expect(result.facebookPixelId).toBe("1234567890");
    expect(result.tiktokPixelId).toBe("abC_123-xy");
    expect(result.googleTagId).toBe("G-ABC123");
    expect(result.customCode).toBe("console.log('x');");
  });

  it("supports custom code wrapped in script tag", () => {
    const result = normalizeTrackingPixels({
      customCode: "<script>window.dataLayer = window.dataLayer || [];</script>",
    });

    expect(result.customCode).toBe("window.dataLayer = window.dataLayer || [];");
  });

  it("detects invalid formats", () => {
    const errors = validateTrackingPixels({
      facebookPixelId: "abc",
      tiktokPixelId: "12",
      googleTagId: "invalid",
    });

    expect(errors).toHaveLength(3);
  });

  it("enforces custom code max length", () => {
    const code = "a".repeat(CUSTOM_TRACKING_CODE_MAX_LENGTH + 20);
    const result = normalizeTrackingPixels({ customCode: code });
    expect(result.customCode.length).toBe(CUSTOM_TRACKING_CODE_MAX_LENGTH);
  });
});
