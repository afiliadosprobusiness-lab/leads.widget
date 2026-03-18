import { describe, expect, it } from "vitest";

import {
  buildAcquisitionCrmDraft,
  filterAcquisitionProspects,
  getAcquisitionMetrics,
  searchAcquisitionMockData,
} from "@/lib/acquisition";

describe("acquisition utils", () => {
  it("filters mock search results by category, city and country", () => {
    const results = searchAcquisitionMockData({
      category: "inmobiliaria",
      city: "trujillo",
      country: "peru",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.businessName).toBe("Inmobiliaria Costa Norte");
  });

  it("applies client-side score and status filters", () => {
    const results = searchAcquisitionMockData({
      category: "",
      city: "lima",
      country: "peru",
    });

    const filtered = filterAcquisitionProspects(
      [
        ...results,
        {
          ...results[0],
          id: "approved-copy",
          status: "approved",
          commercialScore: 96,
        },
      ],
      {
        minScore: 90,
        status: "approved",
      },
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe("approved");
    expect(filtered[0]?.commercialScore).toBeGreaterThanOrEqual(90);
  });

  it("summarizes prospect metrics and maps an approved prospect to CRM draft", () => {
    const results = searchAcquisitionMockData({
      category: "",
      city: "",
      country: "peru",
    });

    const sample = [
      { ...results[0], status: "approved" as const },
      { ...results[1], status: "discarded" as const },
      { ...results[2], status: "pending" as const },
    ];

    expect(getAcquisitionMetrics(sample)).toEqual({
      found: 3,
      pending: 1,
      approved: 1,
      discarded: 1,
    });

    const draft = buildAcquisitionCrmDraft(sample[0], "client-123", "2026-03-18T12:00:00.000Z");

    expect(draft.name).toBe(sample[0].businessName);
    expect(draft.source).toBe("acquisition_google_places");
    expect(draft.source_lead_id).toBe(sample[0].id);
    expect(draft.notes).toContain("Google Maps:");
    expect(draft.stage).toBe("new");
  });
});
