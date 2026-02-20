import { describe, expect, it } from "vitest";

import { parseChatResponseCommands } from "@/lib/chatCommands";

describe("chatCommands parser", () => {
  it("parses redirects and media commands and removes tokens from clean text", () => {
    const parsed = parseChatResponseCommands(
      `Te muestro como se ve.
      [IMAGE: https://cdn.example.com/panel.png|Dashboard preview]
      [AUDIO: https://cdn.example.com/welcome.mp3]
      [WHATSAPP_REDIRECT: "Hola, quiero activar"]
      [ICALLCLOSER_REDIRECT: https://ai-call-closer.vercel.app/demo]`,
    );

    expect(parsed.cleanText).toContain("Te muestro como se ve.");
    expect(parsed.cleanText).not.toContain("WHATSAPP_REDIRECT");
    expect(parsed.cleanText).not.toContain("IMAGE:");
    expect(parsed.whatsappPayload).toBe("Hola, quiero activar");
    expect(parsed.iaCallCloserRedirectUrl).toBe("https://ai-call-closer.vercel.app/demo");
    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]?.url).toBe("https://cdn.example.com/panel.png");
    expect(parsed.images[0]?.alt).toBe("Dashboard preview");
    expect(parsed.audios).toHaveLength(1);
    expect(parsed.audios[0]?.url).toBe("https://cdn.example.com/welcome.mp3");
  });

  it("supports markdown images and IACALLCLOSER_READY payload", () => {
    const parsed = parseChatResponseCommands(
      `Listo para continuar.
      ![Main panel](https://cdn.example.com/screenshot.webp)
      [ICALLCLOSER_READY: {"name":"John","phone":"14155552671","collected_info":"Asked for onboarding"}]`,
    );

    expect(parsed.iaCallCloserReady).toBe(true);
    expect(parsed.iaCallCloserSeed.name).toBe("John");
    expect(parsed.iaCallCloserSeed.phone).toBe("14155552671");
    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]?.alt).toBe("Main panel");
    expect(parsed.cleanText).toContain("Listo para continuar.");
  });

  it("optimizes cloudinary image commands to medium quality delivery", () => {
    const parsed = parseChatResponseCommands(
      "[IMAGE: https://res.cloudinary.com/dk76v5dyu/image/upload/v1771596718/demo/sample.png|Sample]",
    );

    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]?.url).toContain("/image/upload/f_auto,q_auto:good,c_limit,w_960/v1771596718/");
  });
});
