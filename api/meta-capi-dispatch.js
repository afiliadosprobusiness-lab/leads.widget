import {
  handleOptions,
  parseJsonBody,
  requireAuthUid,
  setCors,
  trimText,
} from "../server/crm/_common.js";
import { dispatchMetaCapiEvent, mapCrmStageToMetaEvent } from "../server/meta-capi/client.js";

function normalizeContact(input = {}) {
  return {
    id: trimText(input.id || input.contact_id || "", 140),
    name: trimText(input.name || "", 180),
    phone: trimText(input.phone || "", 60),
    email: trimText(input.email || "", 200),
    source: trimText(input.source || "crm", 80) || "crm",
    stage: trimText(input.stage || "", 40).toLowerCase(),
  };
}

export default async function handler(req, res) {
  setCors(res, "POST,OPTIONS");
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    const body = parseJsonBody(req);
    const source = trimText(body.source || "crm_contact_stage", 80) || "crm_contact_stage";
    const previousStage = trimText(body.previousStage || "", 40).toLowerCase();
    const contact = normalizeContact(body.contact || {});
    if (!contact.id) return res.status(400).json({ error: "contact.id is required" });
    if (!contact.stage) return res.status(400).json({ error: "contact.stage is required" });

    const eventName = mapCrmStageToMetaEvent(contact.stage);
    if (!eventName) {
      return res.status(200).json({
        success: true,
        sent: false,
        reason: "stage_not_mapped",
      });
    }

    const eventId = `crm_contact_stage_${contact.id}_${contact.stage}_${Date.now()}`;
    const result = await dispatchMetaCapiEvent({
      uid,
      eventName,
      eventId,
      contact,
      req,
      customData: {
        crm_entity: "contact",
        from_stage: previousStage || undefined,
        to_stage: contact.stage,
        source,
      },
    });

    return res.status(200).json({
      success: true,
      sent: result.sent === true,
      reason: result.reason || "unknown",
      upstreamStatus: result.upstreamStatus ?? null,
      eventName,
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo despachar el evento Meta CAPI",
      details: trimText(error?.message || "Unknown error", 220),
    });
  }
}
