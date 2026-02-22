import {
  CRM_STAGES,
  handleOptions,
  parseJsonBody,
  recordActivityEvent,
  requireAuthUid,
  setCors,
  toIsoDate,
  toNullableNumber,
  trimText,
} from "./_common.js";
import { db } from "../../api/_firebase.js";

function normalizeDealStage(value, fallback = "new") {
  const stage = trimText(value || "", 40).toLowerCase();
  if (CRM_STAGES.includes(stage)) return stage;
  return fallback;
}

function normalizeDealDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    client_id: trimText(data.client_id || "", 140),
    contact_id: trimText(data.contact_id || "", 140),
    title: trimText(data.title || "Venta", 220),
    stage: normalizeDealStage(data.stage || "new"),
    value: toNullableNumber(data.value),
    currency: trimText(data.currency || "PEN", 12).toUpperCase() || "PEN",
    probability: toNullableNumber(data.probability),
    expected_close_date: trimText(data.expected_close_date || "", 60) || null,
    source: trimText(data.source || "manual", 80) || "manual",
    owner_user_id: trimText(data.owner_user_id || "", 140) || null,
    created_at: toIsoDate(data.created_at, true),
    updated_at: toIsoDate(data.updated_at || data.created_at, true),
  };
}

function summarizeDealsMetrics(deals) {
  const byStage = {
    new: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0,
  };
  let wonValue = 0;
  let inManagementValue = 0;
  deals.forEach((deal) => {
    byStage[deal.stage] += 1;
    const value = Number(deal.value || 0);
    if (deal.stage === "won") wonValue += value;
    if (deal.stage === "new" || deal.stage === "contacted" || deal.stage === "qualified") {
      inManagementValue += value;
    }
  });
  return {
    total: deals.length,
    in_management: byStage.new + byStage.contacted + byStage.qualified,
    won: byStage.won,
    lost: byStage.lost,
    value_won: Math.round(wonValue * 100) / 100,
    value_in_management: Math.round(inManagementValue * 100) / 100,
    by_stage: byStage,
  };
}

function buildPipeline(deals) {
  const pipeline = {
    new: [],
    contacted: [],
    qualified: [],
    won: [],
    lost: [],
  };
  deals.forEach((deal) => pipeline[deal.stage].push(deal));
  return pipeline;
}

export default async function handler(req, res) {
  setCors(res, "GET,POST,PATCH,OPTIONS");
  if (handleOptions(req, res)) return;
  if (!["GET", "POST", "PATCH"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    if (req.method === "GET") {
      const contactId = trimText(req.query?.contactId || "", 140);
      const includePipeline = String(req.query?.pipeline || "").trim() === "1";

      let queryRef = db.collection("deals").where("client_id", "==", uid);
      if (contactId) queryRef = queryRef.where("contact_id", "==", contactId);

      const snap = await queryRef.get();
      const deals = snap.docs
        .map(normalizeDealDoc)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return res.status(200).json({
        deals,
        metrics: summarizeDealsMetrics(deals),
        pipeline: includePipeline ? buildPipeline(deals) : null,
      });
    }

    const body = parseJsonBody(req);
    if (req.method === "POST") {
      const contactId = trimText(body.contact_id || body.contactId || "", 140);
      if (!contactId) return res.status(400).json({ error: "contact_id is required" });

      const contactRef = db.collection("crm_contacts").doc(contactId);
      const contactSnap = await contactRef.get();
      if (!contactSnap.exists) return res.status(404).json({ error: "Contact not found" });
      const contactData = contactSnap.data() || {};
      if (trimText(contactData.client_id || "", 140) !== uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const nowIso = new Date().toISOString();
      const defaultClose = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const name = trimText(contactData.name || "Contacto", 180) || "Contacto";
      const title = trimText(body.title || "", 220) || `Venta - ${name}`;

      const payload = {
        client_id: uid,
        contact_id: contactId,
        title,
        stage: normalizeDealStage(body.stage || "new"),
        value: toNullableNumber(body.value),
        currency: trimText(body.currency || "PEN", 12).toUpperCase() || "PEN",
        probability: toNullableNumber(body.probability),
        expected_close_date: toIsoDate(body.expected_close_date || body.expectedCloseDate || defaultClose, true),
        source: trimText(body.source || "manual", 80) || "manual",
        owner_user_id: trimText(body.owner_user_id || body.ownerUserId || uid, 140) || uid,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const dealRef = await db.collection("deals").add(payload);
      await contactRef.set(
        {
          updated_at: nowIso,
          last_activity_at: nowIso,
        },
        { merge: true },
      );

      await recordActivityEvent({
        clientId: uid,
        entityType: "deal",
        entityId: dealRef.id,
        type: "deal_created",
        createdBy: uid,
        payload: {
          contact_id: contactId,
          stage: payload.stage,
          title: payload.title,
          value: payload.value,
          currency: payload.currency,
        },
      });

      return res.status(201).json({ success: true, deal: { id: dealRef.id, ...payload } });
    }

    const dealId = trimText(body.id || body.deal_id || "", 140);
    if (!dealId) return res.status(400).json({ error: "id is required" });
    const dealRef = db.collection("deals").doc(dealId);
    const dealSnap = await dealRef.get();
    if (!dealSnap.exists) return res.status(404).json({ error: "Deal not found" });
    const current = normalizeDealDoc(dealSnap);
    if (current.client_id !== uid) return res.status(403).json({ error: "Forbidden" });

    const nextStage = body.stage ? normalizeDealStage(body.stage, current.stage) : current.stage;
    const nowIso = new Date().toISOString();
    const updates = {
      updated_at: nowIso,
    };

    if (body.title !== undefined) updates.title = trimText(body.title, 220) || current.title;
    if (body.stage !== undefined) updates.stage = nextStage;
    if (body.value !== undefined) updates.value = toNullableNumber(body.value);
    if (body.currency !== undefined) updates.currency = trimText(body.currency, 12).toUpperCase() || current.currency;
    if (body.probability !== undefined) updates.probability = toNullableNumber(body.probability);
    if (body.expected_close_date !== undefined || body.expectedCloseDate !== undefined) {
      updates.expected_close_date = toIsoDate(body.expected_close_date || body.expectedCloseDate, true);
    }
    if (body.source !== undefined) updates.source = trimText(body.source, 80) || current.source;

    await dealRef.set(updates, { merge: true });

    if (current.contact_id) {
      await db.collection("crm_contacts").doc(current.contact_id).set(
        {
          updated_at: nowIso,
          last_activity_at: nowIso,
        },
        { merge: true },
      );
    }

    if (current.stage !== nextStage) {
      await recordActivityEvent({
        clientId: uid,
        entityType: "deal",
        entityId: dealId,
        type: "deal_stage_changed",
        createdBy: uid,
        payload: {
          from_stage: current.stage,
          to_stage: nextStage,
          contact_id: current.contact_id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      deal: {
        ...current,
        ...updates,
        id: dealId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process deals",
      details: trimText(error?.message || "Unknown error", 220),
    });
  }
}
