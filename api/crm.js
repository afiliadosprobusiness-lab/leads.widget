import contactsMergeHandler from "../server/crm/contacts-merge.js";
import dealsHandler from "../server/crm/deals.js";
import tasksHandler from "../server/crm/tasks.js";
import timelineHandler from "../server/crm/timeline.js";

function normalizeResource(value) {
  return String(value || "").trim().toLowerCase();
}

export default async function handler(req, res) {
  const resource = normalizeResource(req.query?.resource);

  if (resource === "contacts-merge") return contactsMergeHandler(req, res);
  if (resource === "deals") return dealsHandler(req, res);
  if (resource === "tasks") return tasksHandler(req, res);
  if (resource === "timeline") return timelineHandler(req, res);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  return res.status(404).json({ error: "CRM resource not found" });
}
