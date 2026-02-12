import { describe, expect, it } from "vitest";

import {
  normalizeTrackingPixels,
  validateTrackingPixels,
} from "@/lib/trackingPixels";

describe("trackingPixels utils", () => {
  it("normalizes ids and strips spaces", () => {
    const result = normalizeTrackingPixels({
      facebookPixelId: " 1234567890 ",
      tiktokPixelId: " abC_123-xy ",
      googleTagId: " g-abc123 ",
    });

    expect(result.facebookPixelId).toBe("1234567890");
    expect(result.tiktokPixelId).toBe("abC_123-xy");
    expect(result.googleTagId).toBe("G-ABC123");
  });

  it("converts empty values to null", () => {
    const result = normalizeTrackingPixels({
      facebookPixelId: "  ",
      tiktokPixelId: "",
      googleTagId: undefined,
    });

    expect(result.facebookPixelId).toBeNull();
    expect(result.tiktokPixelId).toBeNull();
    expect(result.googleTagId).toBeNull();
  });

  it("detects invalid formats", () => {
    const errors = validateTrackingPixels({
      facebookPixelId: "abc",
      tiktokPixelId: "12",
      googleTagId: "invalid",
    });

    expect(errors).toHaveLength(3);
  });

  it("detects ids that exceed max length", () => {
    const errors = validateTrackingPixels({
      facebookPixelId: "1".repeat(21),
      tiktokPixelId: "a".repeat(65),
      googleTagId: `G-${"A".repeat(40)}`,
    });

    expect(errors).toHaveLength(3);
  });
});
