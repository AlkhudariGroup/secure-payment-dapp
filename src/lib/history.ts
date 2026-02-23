"use client";

import type { DeploymentRecord } from "@/types";

const STORAGE_KEY = "dr-dxb-server-deployments";
const MAX_ITEMS = 50;

export function getDeploymentHistory(): DeploymentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeploymentRecord[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addDeployment(record: DeploymentRecord): void {
  const history = getDeploymentHistory();
  history.unshift(record);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {
    // ignore quota or parse errors
  }
}
