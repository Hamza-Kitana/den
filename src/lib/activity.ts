import type { Appointment, Patient, User } from "./store";

export type LogEntity = "auth" | "patient" | "appointment" | "user" | "system" | "settings";
export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "login_fail"
  | "reset"
  | "settings";

export type ActivityLog = {
  id: string;
  at: string;
  userId: string | null;
  userName: string;
  action: LogAction;
  entity: LogEntity;
  summary: string;
};

export type Actor = { id: string | null; name: string };

const MAX_LOGS = 500;

export function trimLogs(logs: ActivityLog[]): ActivityLog[] {
  return logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs;
}

export function makeLog(
  actor: Actor,
  action: LogAction,
  entity: LogEntity,
  summary: string,
): ActivityLog {
  return {
    id: Math.random().toString(36).slice(2, 10),
    at: new Date().toISOString(),
    userId: actor.id,
    userName: actor.name,
    action,
    entity,
    summary,
  };
}

function byId<T extends { id: string }>(list: T[]) {
  return new Map(list.map((x) => [x.id, x]));
}

function changedKeys(a: Record<string, unknown>, b: Record<string, unknown>, keys: string[]) {
  return keys.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

export function diffPatients(before: Patient[], after: Patient[], ar: boolean): ActivityLog[] {
  const actorPlaceholder = { id: null, name: "" }; // filled by caller via map
  const prev = byId(before);
  const next = byId(after);
  const out: { action: LogAction; summary: string }[] = [];

  for (const [id, p] of next) {
    const old = prev.get(id);
    if (!old) {
      out.push({
        action: "create",
        summary: ar ? `إضافة مريض: ${p.name}` : `Added patient: ${p.name}`,
      });
      continue;
    }
    const fields = changedKeys(
      old as unknown as Record<string, unknown>,
      p as unknown as Record<string, unknown>,
      ["name", "phone", "email", "gender", "dob", "blood", "address", "allergies", "history", "notes"],
    );
    if (fields.length) {
      out.push({
        action: "update",
        summary: ar
          ? `تعديل بيانات ${p.name}: ${fields.join(", ")}`
          : `Updated ${p.name}: ${fields.join(", ")}`,
      });
    }

    const oldTeeth = JSON.stringify(old.teeth ?? {});
    const newTeeth = JSON.stringify(p.teeth ?? {});
    if (oldTeeth !== newTeeth) {
      out.push({
        action: "update",
        summary: ar ? `تحديث مخطط أسنان ${p.name}` : `Updated dental chart for ${p.name}`,
      });
    }

    const trDiff = listCountDiff(old.treatments ?? [], p.treatments ?? []);
    if (trDiff) {
      out.push({
        action: "update",
        summary: ar
          ? `علاجات ${p.name}: ${trDiff}`
          : `Treatments for ${p.name}: ${trDiff}`,
      });
    }

    const procDiff = listCountDiff(old.procedures ?? [], p.procedures ?? []);
    if (procDiff) {
      out.push({
        action: "update",
        summary: ar ? `إجراءات ${p.name}: ${procDiff}` : `Procedures for ${p.name}: ${procDiff}`,
      });
    }

    const sessDiff = listCountDiff(old.sessions ?? [], p.sessions ?? []);
    if (sessDiff) {
      out.push({
        action: "update",
        summary: ar ? `جلسات ${p.name}: ${sessDiff}` : `Sessions for ${p.name}: ${sessDiff}`,
      });
    }

    const phOld = (old.photos ?? []).length;
    const phNew = (p.photos ?? []).length;
    if (phNew > phOld) {
      out.push({
        action: "create",
        summary: ar
          ? `إضافة ${phNew - phOld} صورة لـ ${p.name}`
          : `Added ${phNew - phOld} photo(s) for ${p.name}`,
      });
    } else if (phNew < phOld) {
      out.push({
        action: "delete",
        summary: ar
          ? `حذف ${phOld - phNew} صورة من ${p.name}`
          : `Deleted ${phOld - phNew} photo(s) from ${p.name}`,
      });
    }
  }

  for (const [id, p] of prev) {
    if (!next.has(id)) {
      out.push({
        action: "delete",
        summary: ar ? `حذف مريض: ${p.name}` : `Deleted patient: ${p.name}`,
      });
    }
  }

  return out.map((x) => makeLog(actorPlaceholder, x.action, "patient", x.summary));
}

function listCountDiff<T extends { id: string }>(a: T[], b: T[]) {
  const added = b.filter((x) => !a.some((y) => y.id === x.id)).length;
  const removed = a.filter((x) => !b.some((y) => y.id === x.id)).length;
  const updated = b.filter((x) => {
    const o = a.find((y) => y.id === x.id);
    return o && JSON.stringify(o) !== JSON.stringify(x);
  }).length;
  const parts: string[] = [];
  if (added) parts.push(`+${added}`);
  if (removed) parts.push(`-${removed}`);
  if (updated) parts.push(`~${updated}`);
  return parts.join(" ") || "";
}

export function diffAppointments(
  before: Appointment[],
  after: Appointment[],
  patients: Patient[],
  ar: boolean,
): ActivityLog[] {
  const actorPlaceholder = { id: null, name: "" };
  const nameOf = (pid: string) => patients.find((p) => p.id === pid)?.name ?? pid;
  const prev = byId(before);
  const next = byId(after);
  const out: { action: LogAction; summary: string }[] = [];

  for (const [id, a] of next) {
    const old = prev.get(id);
    const who = nameOf(a.patientId);
    if (!old) {
      out.push({
        action: "create",
        summary: ar
          ? `موعد جديد: ${who} — ${a.date} ${a.time} (${a.type})`
          : `New appointment: ${who} — ${a.date} ${a.time} (${a.type})`,
      });
      continue;
    }
    if (JSON.stringify(old) !== JSON.stringify(a)) {
      const bits: string[] = [];
      if (old.status !== a.status) bits.push(ar ? `الحالة→${a.status}` : `status→${a.status}`);
      if (old.date !== a.date || old.time !== a.time)
        bits.push(ar ? `الوقت→${a.date} ${a.time}` : `time→${a.date} ${a.time}`);
      if (old.type !== a.type) bits.push(ar ? `النوع→${a.type}` : `type→${a.type}`);
      if (old.patientId !== a.patientId) bits.push(ar ? `المريض→${who}` : `patient→${who}`);
      out.push({
        action: "update",
        summary: ar
          ? `تعديل موعد ${who}: ${bits.join("، ") || "تحديث"}`
          : `Updated appointment for ${who}: ${bits.join(", ") || "update"}`,
      });
    }
  }

  for (const [id, a] of prev) {
    if (!next.has(id)) {
      out.push({
        action: "delete",
        summary: ar
          ? `حذف موعد: ${nameOf(a.patientId)} — ${a.date} ${a.time}`
          : `Deleted appointment: ${nameOf(a.patientId)} — ${a.date} ${a.time}`,
      });
    }
  }

  return out.map((x) => makeLog(actorPlaceholder, x.action, "appointment", x.summary));
}

export function diffUsers(before: User[], after: User[], ar: boolean): ActivityLog[] {
  const actorPlaceholder = { id: null, name: "" };
  const prev = byId(before);
  const next = byId(after);
  const out: { action: LogAction; summary: string }[] = [];

  for (const [id, u] of next) {
    const old = prev.get(id);
    if (!old) {
      out.push({
        action: "create",
        summary: ar
          ? `إضافة مستخدم: ${u.name} (@${u.username}) — ${u.role}`
          : `Added user: ${u.name} (@${u.username}) — ${u.role}`,
      });
      continue;
    }
    const fields = changedKeys(
      { ...old, password: old.password ? "***" : "" },
      { ...u, password: u.password ? "***" : "" },
      ["name", "username", "role", "phone", "password"],
    );
    if (fields.length) {
      out.push({
        action: "update",
        summary: ar
          ? `تعديل مستخدم ${u.name}: ${fields.join(", ")}`
          : `Updated user ${u.name}: ${fields.join(", ")}`,
      });
    }
  }

  for (const [id, u] of prev) {
    if (!next.has(id)) {
      out.push({
        action: "delete",
        summary: ar
          ? `حذف مستخدم: ${u.name} (@${u.username})`
          : `Deleted user: ${u.name} (@${u.username})`,
      });
    }
  }

  return out.map((x) => makeLog(actorPlaceholder, x.action, "user", x.summary));
}

export function stampLogs(logs: ActivityLog[], actor: Actor): ActivityLog[] {
  return logs.map((l) => ({
    ...l,
    userId: actor.id,
    userName: actor.name || (actor.id ? l.userName : "System"),
  }));
}
