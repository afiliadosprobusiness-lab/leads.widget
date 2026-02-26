import {
  TASK_STATUSES,
  chunkArray,
  handleOptions,
  normalizeTaskPriority,
  normalizeTaskStatus,
  parseJsonBody,
  recordActivityEvent,
  requireAuthUid,
  setCors,
  toIsoDate,
  trimText,
} from "./_common.js";
import { db } from "../../api/_firebase.js";

const DEFAULT_TIME_ZONE = "America/Lima";

function normalizeEntityType(value) {
  const candidate = trimText(value || "", 40).toLowerCase();
  return candidate === "deal" ? "deal" : "contact";
}

function normalizeTaskDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    client_id: trimText(data.client_id || "", 140),
    entity_type: normalizeEntityType(data.entity_type || "contact"),
    entity_id: trimText(data.entity_id || "", 140),
    title: trimText(data.title || "", 220),
    due_at: trimText(data.due_at || "", 60) || null,
    status: normalizeTaskStatus(data.status || "open"),
    priority: normalizeTaskPriority(data.priority || "med"),
    created_by: trimText(data.created_by || "", 140) || null,
    assigned_to: trimText(data.assigned_to || "", 140) || null,
    created_at: toIsoDate(data.created_at, true),
    updated_at: toIsoDate(data.updated_at || data.created_at, true),
    completed_at: trimText(data.completed_at || "", 60) || null,
  };
}

function normalizeTimeZone(value) {
  const candidate = trimText(value || "", 80);
  if (!candidate) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function toTimeZoneDayKey(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = {};
  parts.forEach((part) => {
    if (part.type) byType[part.type] = part.value;
  });
  const year = byType.year || "";
  const month = byType.month || "";
  const day = byType.day || "";
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function isDateSameDay(left, right, timeZone) {
  const leftKey = toTimeZoneDayKey(left, timeZone);
  const rightKey = toTimeZoneDayKey(right, timeZone);
  if (!leftKey || !rightKey) return false;
  return leftKey === rightKey;
}

function isOverdueTask(task, nowIso) {
  if (task.status !== "open") return false;
  if (!task.due_at) return false;
  const due = new Date(task.due_at);
  const now = new Date(nowIso);
  if (Number.isNaN(due.getTime()) || Number.isNaN(now.getTime())) return false;
  return due.getTime() < now.getTime();
}

function getWindowFilter(window) {
  const candidate = trimText(window || "today", 30).toLowerCase();
  if (["today", "overdue", "upcoming", "completed", "all"].includes(candidate)) return candidate;
  return "today";
}

function sortTasks(items) {
  return [...items].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const aDate = new Date(a.due_at || a.updated_at || a.created_at).getTime();
    const bDate = new Date(b.due_at || b.updated_at || b.created_at).getTime();
    if (a.status === "done" && b.status === "done") return bDate - aDate;
    return aDate - bDate;
  });
}

async function ensureEntityBelongsToClient(uid, entityType, entityId) {
  const collectionName = entityType === "deal" ? "deals" : "crm_contacts";
  const snap = await db.collection(collectionName).doc(entityId).get();
  if (!snap.exists) return null;
  const row = snap.data() || {};
  if (trimText(row.client_id || "", 140) !== uid) return null;
  return { id: snap.id, ...row };
}

async function markOverdueTasks(uid, tasks, nowIso) {
  const overdueTasks = tasks.filter((task) => isOverdueTask(task, nowIso));
  if (overdueTasks.length === 0) return tasks;

  const chunks = chunkArray(overdueTasks, 350);
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((task) => {
      batch.set(
        db.collection("tasks").doc(task.id),
        {
          status: "overdue",
          updated_at: nowIso,
        },
        { merge: true },
      );
    });
    await batch.commit();
  }

  await Promise.all(
    overdueTasks.map((task) =>
      recordActivityEvent({
        clientId: uid,
        entityType: task.entity_type,
        entityId: task.entity_id,
        type: "task_overdue",
        createdBy: uid,
        payload: {
          task_id: task.id,
          title: task.title,
          due_at: task.due_at,
        },
      }),
    ),
  );

  return tasks.map((task) =>
    overdueTasks.some((item) => item.id === task.id)
      ? { ...task, status: "overdue", updated_at: nowIso }
      : task,
  );
}

function applyTasksFilters(tasks, { uid, windowFilter, contactId, dealId, timeZone }) {
  let output = [...tasks];
  const now = new Date();
  if (contactId) {
    output = output.filter((task) => task.entity_type === "contact" && task.entity_id === contactId);
  }
  if (dealId) {
    output = output.filter((task) => task.entity_type === "deal" && task.entity_id === dealId);
  }
  if (windowFilter === "completed") {
    output = output.filter((task) => task.status === "done");
  } else if (windowFilter === "overdue") {
    output = output.filter((task) => task.status === "overdue");
  } else if (windowFilter === "today") {
    output = output.filter((task) => task.status !== "done" && task.due_at && isDateSameDay(task.due_at, now, timeZone));
  } else if (windowFilter === "upcoming") {
    output = output.filter((task) => {
      if (task.status === "done") return false;
      if (!task.due_at) return false;
      const due = new Date(task.due_at);
      if (Number.isNaN(due.getTime())) return false;
      return due.getTime() >= now.getTime() && !isDateSameDay(due, now, timeZone);
    });
  }

  output = output.filter((task) => !task.assigned_to || task.assigned_to === uid);
  return sortTasks(output);
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
      const windowFilter = getWindowFilter(req.query?.window || req.query?.filter || "today");
      const timeZone = normalizeTimeZone(req.query?.timeZone || req.query?.tz || "");
      const contactId = trimText(req.query?.contactId || "", 140);
      const dealId = trimText(req.query?.dealId || "", 140);
      const nowIso = new Date().toISOString();

      const snap = await db.collection("tasks").where("client_id", "==", uid).get();
      const tasks = snap.docs.map(normalizeTaskDoc);
      const updatedTasks = await markOverdueTasks(uid, tasks, nowIso);
      const filtered = applyTasksFilters(updatedTasks, { uid, windowFilter, contactId, dealId, timeZone });

      return res.status(200).json({
        tasks: filtered,
        totals: {
          all: updatedTasks.length,
          open: updatedTasks.filter((task) => task.status === "open").length,
          overdue: updatedTasks.filter((task) => task.status === "overdue").length,
          completed: updatedTasks.filter((task) => task.status === "done").length,
        },
      });
    }

    const body = parseJsonBody(req);
    if (req.method === "POST") {
      const entityType = normalizeEntityType(body.entity_type || body.entityType || "contact");
      const entityId = trimText(body.entity_id || body.entityId || "", 140);
      const title = trimText(body.title || "", 220);
      if (!entityId) return res.status(400).json({ error: "entity_id is required" });
      if (!title) return res.status(400).json({ error: "title is required" });

      const entity = await ensureEntityBelongsToClient(uid, entityType, entityId);
      if (!entity) return res.status(404).json({ error: "Entity not found" });

      const nowIso = new Date().toISOString();
      const dueAt = body.due_at || body.dueAt ? toIsoDate(body.due_at || body.dueAt, false) : "";
      const payload = {
        client_id: uid,
        entity_type: entityType,
        entity_id: entityId,
        title,
        due_at: dueAt || null,
        status: "open",
        priority: normalizeTaskPriority(body.priority || "med"),
        created_by: uid,
        assigned_to: trimText(body.assigned_to || body.assignedTo || uid, 140) || uid,
        created_at: nowIso,
        updated_at: nowIso,
        completed_at: null,
      };

      const createdRef = await db.collection("tasks").add(payload);

      await recordActivityEvent({
        clientId: uid,
        entityType,
        entityId,
        type: "task_created",
        createdBy: uid,
        payload: {
          task_id: createdRef.id,
          title,
          due_at: payload.due_at,
          priority: payload.priority,
        },
      });

      return res.status(201).json({ success: true, task: { id: createdRef.id, ...payload } });
    }

    const taskId = trimText(body.id || body.task_id || "", 140);
    if (!taskId) return res.status(400).json({ error: "id is required" });
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return res.status(404).json({ error: "Task not found" });
    const current = normalizeTaskDoc(taskSnap);
    if (current.client_id !== uid) return res.status(403).json({ error: "Forbidden" });

    const nowIso = new Date().toISOString();
    const updates = {
      updated_at: nowIso,
    };

    if (body.title !== undefined) updates.title = trimText(body.title, 220) || current.title;
    if (body.priority !== undefined) updates.priority = normalizeTaskPriority(body.priority, current.priority);
    if (body.assigned_to !== undefined || body.assignedTo !== undefined) {
      updates.assigned_to = trimText(body.assigned_to || body.assignedTo, 140) || uid;
    }
    if (body.due_at !== undefined || body.dueAt !== undefined) {
      updates.due_at = toIsoDate(body.due_at || body.dueAt, false) || null;
    }

    let nextStatus = current.status;
    if (body.status !== undefined) {
      nextStatus = normalizeTaskStatus(body.status, current.status);
    }

    if (nextStatus === "open" && updates.due_at) {
      const due = new Date(updates.due_at);
      if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) nextStatus = "overdue";
    }
    if (nextStatus === "open" && current.due_at && !updates.due_at) {
      const due = new Date(current.due_at);
      if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) nextStatus = "overdue";
    }

    updates.status = TASK_STATUSES.includes(nextStatus) ? nextStatus : current.status;
    if (updates.status === "done") {
      updates.completed_at = nowIso;
    } else if (current.status === "done" && updates.status !== "done") {
      updates.completed_at = null;
    }

    await taskRef.set(updates, { merge: true });

    if (current.status !== updates.status) {
      const eventType = updates.status === "done"
        ? "task_completed"
        : updates.status === "overdue"
          ? "task_overdue"
          : "task_reopened";
      await recordActivityEvent({
        clientId: uid,
        entityType: current.entity_type,
        entityId: current.entity_id,
        type: eventType,
        createdBy: uid,
        payload: {
          task_id: taskId,
          title: updates.title || current.title,
          from_status: current.status,
          to_status: updates.status,
        },
      });
    }

    return res.status(200).json({
      success: true,
      task: {
        ...current,
        ...updates,
        id: taskId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process tasks",
      details: trimText(error?.message || "Unknown error", 240),
    });
  }
}
