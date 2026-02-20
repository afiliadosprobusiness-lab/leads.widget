import { describe, expect, it } from "vitest";

import { getNichePromptTemplate } from "@/lib/nichePromptTemplates";

describe("niche prompt templates", () => {
  it("returns a real estate template when niche is inmobiliaria", () => {
    const template = getNichePromptTemplate("inmobiliaria");
    expect(template).toContain("real estate");
    expect(template).toContain("[ICALLCLOSER_READY:");
  });

  it("falls back to general template for unknown niches", () => {
    const template = getNichePromptTemplate("unknown-niche");
    expect(template).toContain("service business");
    expect(template).toContain("[WHATSAPP_REDIRECT:");
  });
});
