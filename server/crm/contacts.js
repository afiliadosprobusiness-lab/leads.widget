import {
  handleOptions,
  normalizeCrmStage,
  parseJsonBody,
  requireAuthUid,
  setCors,
  toIsoDate,
  trimText,
} from "./_common.js";
import { db } from "../../api/_firebase.js";
import { dispatchMetaCapiEvent, mapCrmStageToMetaEvent } from "../meta-capi/client.js";

function normalizeContactDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    client_id: trimText(data.client_id || "", 140),
    name: trimText(data.name || "Sin nombre", 180) || "Sin nombre",
    phone: trimText(data.phone || "", 60),
    email: trimText(data.email || "", 200),
    interest: trimText(data.interest || "", 300),
    stage: normalizeCrmStage(data.stage || "new"),
    source: trimText(data.source || "manual", 80) || "manual",
    source_lead_id: trimText(data.source_lead_id || "", 140),
    notes: trimText(data.notes || "", 1600),
    created_at: toIsoDate(data.created_at, true),
    updated_at: toIsoDate(data.updated_at || data.created_at, true),
    last_activity_at: toIsoDate(data.last_activity_at || data.updated_at || data.created_at, true),
  };
}

export default async function handler(req, res) {
  setCors(res, "PATCH,OPTIONS");
  if (handleOptions(req, res)) return;
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    const body = parseJsonBody(req);
    const contactId = trimText(body.id || body.contact_id || body.contactId || "", 140);
    if (!contactId) return res.status(400).json({ error: "id is required" });
    if (body.stage === undefined) return res.status(400).json({ error: "stage is required" });

    const nowIso = new Date().toISOString();
    let updatedContact = null;
    let stageChanged = false;
    let previousStage = "";
    let nextStage = "";

    await db.runTransaction(async (tx) => {
      const contactRef = db.collection("crm_contacts").doc(contactId);
      const contactSnap = await tx.get(contactRef);
      if (!contactSnap.exists) {
        throw new Error("Contact not found");
      }

      const current = normalizeContactDoc(contactSnap);
      if (current.client_id !== uid) {
        throw new Error("Forbidden");
      }

      previousStage = current.stage;
      nextStage = normalizeCrmStage(body.stage, current.stage);
      stageChanged = nextStage !== current.stage;

      const updates = {
        updated_at: nowIso,
        last_activity_at: nowIso,
      };
      if (stageChanged) updates.stage = nextStage;

      tx.set(contactRef, updates, { merge: true });

      if (stageChanged) {
        tx.set(
          db.collection("activity_events").doc(),
          {
            client_id: uid,
            entity_type: "contact",
            entity_id: contactId,
            type: "contact_stage_changed",
            payload_json: {
              from_stage: previousStage,
              to_stage: nextStage,
            },
            created_at: nowIso,
            created_by: uid,
          },
          { merge: true },
        );
      }

      updatedContact = {
        ...current,
        ...updates,
        stage: stageChanged ? nextStage : current.stage,
        id: contactId,
      };
    });

    if (stageChanged && updatedContact?.id) {
      const mappedEventName = mapCrmStageToMetaEvent(nextStage);
      if (mappedEventName) {
        const stageEventId = `crm_contact_stage_${trimText(contactId, 100)}_${trimText(nextStage, 40)}_${trimText(nowIso, 40)}`;
        await dispatchMetaCapiEvent({
          uid,
          eventName: mappedEventName,
          eventId: stageEventId,
          contact: {
            id: updatedContact.id,
            name: updatedContact.name,
            phone: updatedContact.phone,
            email: updatedContact.email,
          },
          req,
          customData: {
            crm_entity: "contact",
            from_stage: previousStage,
            to_stage: nextStage,
            source: updatedContact.source || "crm",
          },
        }).catch(() => {});
      }
    }

    return res.status(200).json({
      success: true,
      stage_changed: stageChanged,
      contact: updatedContact,
    });
  } catch (error) {
    const message = trimText(error?.message || "Failed to update contact", 220);
    if (/not found/i.test(message)) return res.status(404).json({ error: message });
    if (/forbidden/i.test(message)) return res.status(403).json({ error: message });
    if (/required/i.test(message)) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}
