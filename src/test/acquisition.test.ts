import { describe, expect, it } from "vitest";

import {
  type AcquisitionProspect,
  buildAcquisitionCrmDraft,
  filterAcquisitionProspects,
  getAcquisitionMetrics,
} from "@/lib/acquisition";

const sampleProspects: AcquisitionProspect[] = [
  {
    id: "prospect-1",
    businessName: "Inmobiliaria Costa Norte",
    category: "Inmobiliaria",
    city: "Trujillo",
    country: "Peru",
    address: "Av. America Norte 1201, Trujillo",
    phone: "+51 982 410 755",
    website: "https://costanorteinmobiliaria.pe",
    rating: 4.6,
    reviewsCount: 132,
    commercialScore: 88,
    mapsUrl: "https://maps.example/1",
    status: "pending",
    source: "google_places",
  },
  {
    id: "prospect-2",
    businessName: "Centro Dental Miraflores",
    category: "Clinica dental",
    city: "Lima",
    country: "Peru",
    address: "Av. Jose Pardo 410, Miraflores",
    phone: "+51 999 102 410",
    website: "https://centrodentalmiraflores.pe",
    rating: 4.8,
    reviewsCount: 214,
    commercialScore: 93,
    mapsUrl: "https://maps.example/2",
    status: "pending",
    source: "google_places",
  },
  {
    id: "prospect-3",
    businessName: "Clinica Renovar Providencia",
    category: "Clinica estetica",
    city: "Santiago",
    country: "Chile",
    address: "Av. Providencia 2550, Santiago",
    phone: "+56 9 6123 8841",
    website: "https://clinicarenovar.cl",
    rating: 4.7,
    reviewsCount: 198,
    commercialScore: 90,
    mapsUrl: "https://maps.example/3",
    status: "pending",
    source: "google_places",
  },
];

describe("acquisition utils", () => {
  it("applies client-side score and status filters", () => {
    const filtered = filterAcquisitionProspects(
      [
        ...sampleProspects,
        {
          ...sampleProspects[0],
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
    const sample = [
      { ...sampleProspects[0], status: "approved" as const },
      { ...sampleProspects[1], status: "discarded" as const },
      { ...sampleProspects[2], status: "pending" as const },
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
