import {
  db,
  buildOperationDocId,
  chunkArray,
  handleOptions,
  mergeContactData,
  normalizeEmailForDedupe,
  normalizePhoneForDedupe,
  parseJsonBody,
  recordActivityEvent,
  requireAuthUid,
  sanitizeContactInput,
  setCors,
  trimText,
} from "./_common.js";

async function findContactByDedupeTx(tx, clientId, dedupePhone, dedupeEmail) {
  if (dedupePhone) {
    const phoneQ = db
      .collection("crm_contacts")
      .where("client_id", "==", clientId)
      .where("dedupe_phone", "==", dedupePhone)
      .limit(1);
    const phoneSnap = await tx.get(phoneQ);
    if (!phoneSnap.empty) {
      return phoneSnap.docs[0];
    }
  }

  if (dedupeEmail) {
    const emailQ = db
      .collection("crm_contacts")
      .where("client_id", "==", clientId)
      .where("dedupe_email", "==", dedupeEmail)
      .limit(1);
    const emailSnap = await tx.get(emailQ);
    if (!emailSnap.empty) {
      return emailSnap.docs[0];
    }
  }

  const fallbackQ = db.collection("crm_contacts").where("client_id", "==", clientId).limit(800);
  const fallbackSnap = await tx.get(fallbackQ);
  for (const docSnap of fallbackSnap.docs) {
    const row = docSnap.data() || {};
    const rowPhone = normalizePhoneForDedupe(row.phone || row.dedupe_phone || "");
    const rowEmail = normalizeEmailForDedupe(row.email || row.dedupe_email || "");
    if (dedupePhone && rowPhone && rowPhone === dedupePhone) return docSnap;
    if (dedupeEmail && rowEmail && rowEmail === dedupeEmail) return docSnap;
  }
  return null;
}

async function migrateReferences(clientId, primaryContactId, duplicateContactId, uid) {
  if (!primaryContactId || !duplicateContactId || primaryContactId === duplicateContactId) return;

  const nowIso = new Date().toISOString();

  const moveInCollection = async (collectionName, queryBuilder, mutator) => {
    const snap = await queryBuilder.get();
    if (snap.empty) return 0;
    let touched = 0;
    const chunks = chunkArray(snap.docs, 400);
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((docSnap) => {
        batch.set(docSnap.ref, mutator(docSnap.data() || {}), { merge: true });
        touched += 1;
      });
      await batch.commit();
    }
    return touched;
  };

  const movedDeals = await moveInCollection(
    "deals",
    db.collection("deals").where("client_id", "==", clientId).where("contact_id", "==", duplicateContactId),
    () => ({
      contact_id: primaryContactId,
      updated_at: nowIso,
    }),
  );

  const movedTasks = await moveInCollection(
    "tasks",
    db
      .collection("tasks")
      .where("client_id", "==", clientId)
      .where("entity_type", "==", "contact")
      .where("entity_id", "==", duplicateContactId),
    () => ({
      entity_id: primaryContactId,
      updated_at: nowIso,
    }),
  );

  const movedEvents = await moveInCollection(
    "activity_events",
    db
      .collection("activity_events")
      .where("client_id", "==", clientId)
      .where("entity_type", "==", "contact")
      .where("entity_id", "==", duplicateContactId),
    () => ({
      entity_id: primaryContactId,
    }),
  );

  await db.collection("crm_contacts").doc(duplicateContactId).delete().catch(() => {});

  await recordActivityEvent({
    clientId,
    entityType: "contact",
    entityId: primaryContactId,
    type: "dedupe_merge",
    createdBy: uid,
    payload: {
      primary_contact_id: primaryContactId,
      duplicate_contact_id: duplicateContactId,
      moved_deals: movedDeals,
      moved_tasks: movedTasks,
      moved_events: movedEvents,
    },
  });
}

export default async function handler(req, res) {
  setCors(res, "POST,OPTIONS");
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = await requireAuthUid(req, res);
  if (!uid) return;

  try {
    const body = parseJsonBody(req);
    const idempotencyKey = trimText(body.idempotencyKey || "", 300);
    const reason = trimText(body.reason || "merge", 120);
    const incomingContact = body.incomingContact && typeof body.incomingContact === "object" ? body.incomingContact : null;
    const primaryContactIdRaw = trimText(body.primaryContactId || "", 140);
    const duplicateContactIdRaw = trimText(body.duplicateContactId || "", 140);

    if (!incomingContact && (!primaryContactIdRaw || !duplicateContactIdRaw)) {
      return res.status(400).json({
        error: "incomingContact or (primaryContactId + duplicateContactId) is required",
      });
    }

    const operationDocId = idempotencyKey ? buildOperationDocId(uid, idempotencyKey) : "";
    const operationRef = operationDocId ? db.collection("crm_merge_operations").doc(operationDocId) : null;

    let result = null;
    let pendingMigration = null;

    await db.runTransaction(async (tx) => {
      if (operationRef) {
        const opSnap = await tx.get(operationRef);
        if (opSnap.exists) {
          const opData = opSnap.data() || {};
          if (opData.status === "completed" && opData.result) {
            result = opData.result;
            return;
          }
          if (opData.status === "pending_migration") {
            pendingMigration = {
              primaryContactId: trimText(opData.primary_contact_id || "", 140),
              duplicateContactId: trimText(opData.duplicate_contact_id || "", 140),
            };
            result = opData.result || null;
            return;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const normalizedIncoming = incomingContact ? sanitizeContactInput(incomingContact, uid) : null;
      const dedupePhone = normalizedIncoming ? normalizePhoneForDedupe(normalizedIncoming.phone || "") : "";
      const dedupeEmail = normalizedIncoming ? normalizeEmailForDedupe(normalizedIncoming.email || "") : "";

      let primaryRef = null;
      let duplicateRef = null;

      if (primaryContactIdRaw) {
        const ref = db.collection("crm_contacts").doc(primaryContactIdRaw);
        const snap = await tx.get(ref);
        if (!snap.exists) {
          throw new Error("primary contact not found");
        }
        const data = snap.data() || {};
        if (trimText(data.client_id || "", 140) !== uid) {
          throw new Error("forbidden primary contact");
        }
        primaryRef = ref;
      } else {
        const found = await findContactByDedupeTx(tx, uid, dedupePhone, dedupeEmail);
        if (found) primaryRef = found.ref;
      }

      if (duplicateContactIdRaw) {
        duplicateRef = db.collection("crm_contacts").doc(duplicateContactIdRaw);
        const duplicateSnap = await tx.get(duplicateRef);
        if (!duplicateSnap.exists) {
          throw new Error("duplicate contact not found");
        }
        const duplicateData = duplicateSnap.data() || {};
        if (trimText(duplicateData.client_id || "", 140) !== uid) {
          throw new Error("forbidden duplicate contact");
        }
      }

      if (!primaryRef && normalizedIncoming) {
        const createdRef = db.collection("crm_contacts").doc();
        tx.set(createdRef, normalizedIncoming);
        const createdResult = {
          success: true,
          action: "created",
          reason,
          primary_contact_id: createdRef.id,
          merged_contact_id: null,
          contact: { id: createdRef.id, ...normalizedIncoming },
          idempotency_key: idempotencyKey || null,
        };
        result = createdResult;

        tx.set(
          db.collection("activity_events").doc(),
          {
            client_id: uid,
            entity_type: "contact",
            entity_id: createdRef.id,
            type: "contact_created",
            payload_json: {
              reason,
              source: trimText(normalizedIncoming.source || "", 80) || "manual",
            },
            created_at: nowIso,
            created_by: uid,
          },
          { merge: true },
        );

        if (operationRef) {
          tx.set(
            operationRef,
            {
              status: "completed",
              idempotency_key: idempotencyKey,
              client_id: uid,
              primary_contact_id: createdRef.id,
              duplicate_contact_id: null,
              result: createdResult,
              updated_at: nowIso,
              created_at: nowIso,
            },
            { merge: true },
          );
        }
        return;
      }

      if (!primaryRef) {
        throw new Error("No primary contact available for merge");
      }

      const primarySnap = await tx.get(primaryRef);
      const primaryData = primarySnap.data() || {};
      let mergedData = mergeContactData(primaryData, normalizedIncoming || {});
      let mergeAction = normalizedIncoming ? "merged" : "noop";
      let mergedContactId = null;
      let needsMigration = false;

      if (duplicateRef && duplicateRef.id !== primaryRef.id) {
        const duplicateSnap = await tx.get(duplicateRef);
        const duplicateData = duplicateSnap.data() || {};
        mergedData = mergeContactData(mergedData, duplicateData);
        mergedContactId = duplicateRef.id;
        mergeAction = "merged";
        needsMigration = true;
      }

      tx.set(primaryRef, mergedData, { merge: true });

      tx.set(
        db.collection("activity_events").doc(),
        {
          client_id: uid,
          entity_type: "contact",
          entity_id: primaryRef.id,
          type: "dedupe_merge",
          payload_json: {
            reason,
            duplicate_contact_id: mergedContactId,
            source_lead_id: trimText(mergedData.source_lead_id || "", 140) || null,
            idempotency_key: idempotencyKey || null,
          },
          created_at: nowIso,
          created_by: uid,
        },
        { merge: true },
      );

      const mergedResult = {
        success: true,
        action: mergeAction,
        reason,
        primary_contact_id: primaryRef.id,
        merged_contact_id: mergedContactId,
        contact: { id: primaryRef.id, ...primaryData, ...mergedData },
        idempotency_key: idempotencyKey || null,
      };
      result = mergedResult;

      if (operationRef) {
        tx.set(
          operationRef,
          {
            status: needsMigration ? "pending_migration" : "completed",
            idempotency_key: idempotencyKey,
            client_id: uid,
            primary_contact_id: primaryRef.id,
            duplicate_contact_id: mergedContactId,
            result: mergedResult,
            updated_at: nowIso,
            created_at: nowIso,
          },
          { merge: true },
        );
      } else if (needsMigration) {
        pendingMigration = {
          primaryContactId: primaryRef.id,
          duplicateContactId: mergedContactId,
        };
      }
    });

    if (!result && pendingMigration && pendingMigration.primaryContactId && pendingMigration.duplicateContactId) {
      result = {
        success: true,
        action: "merged",
        reason,
        primary_contact_id: pendingMigration.primaryContactId,
        merged_contact_id: pendingMigration.duplicateContactId,
        contact: null,
        idempotency_key: idempotencyKey || null,
      };
    }

    const migrationCandidate =
      pendingMigration && pendingMigration.primaryContactId && pendingMigration.duplicateContactId
        ? pendingMigration
        : result?.merged_contact_id
          ? {
            primaryContactId: trimText(result.primary_contact_id || "", 140),
            duplicateContactId: trimText(result.merged_contact_id || "", 140),
          }
          : null;

    if (migrationCandidate?.primaryContactId && migrationCandidate?.duplicateContactId) {
      await migrateReferences(uid, migrationCandidate.primaryContactId, migrationCandidate.duplicateContactId, uid);
      if (operationRef) {
        await operationRef.set(
          {
            status: "completed",
            updated_at: new Date().toISOString(),
          },
          { merge: true },
        );
      }
    }

    return res.status(200).json(result || { success: true, action: "noop" });
  } catch (error) {
    const message = trimText(error?.message || "Merge failed", 220);
    const status = /not found|forbidden|required|No primary/.test(message) ? 400 : 500;
    return res.status(status).json({ error: message });
  }
}
