import type { StaffRole } from "@/lib/types";

export function canEdit(role: StaffRole): boolean {
  return role === "ADMIN" || role === "ADJUSTER";
}

export function canManageTemplates(role: StaffRole): boolean {
  return role === "ADMIN";
}
