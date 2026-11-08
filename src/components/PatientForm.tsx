import { useState } from "react";
import { can, useStore, type Patient, type PatientInfo } from "@/lib/store";
import { Field } from "./kit";

export function PatientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Patient | (PatientInfo & { id?: string });
  onSave: (p: PatientInfo) => void;
  onCancel: () => void;
}) {
  const s = useStore();
  const [p, setP] = useState<PatientInfo>({
    name: initial.name,
    phone: initial.phone,
    email: initial.email,
    gender: initial.gender,
    dob: initial.dob,
    blood: initial.blood,
    address: initial.address,
    allergies: initial.allergies,
    history: initial.history,
    notes: initial.notes,
  });
  const med = can.editMedical(s.user?.role);
  const set =
    (k: keyof PatientInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setP({ ...p, [k]: e.target.value });

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={s.t("name")} full>
          <input className="field" value={p.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label={s.t("phone")}>
          <input className="field" dir="ltr" value={p.phone} onChange={set("phone")} />
        </Field>
        <Field label={s.t("email")}>
          <input className="field" dir="ltr" value={p.email} onChange={set("email")} />
        </Field>
        <Field label={s.t("gender")}>
          <select className="field" value={p.gender} onChange={set("gender")}>
            <option value="male">{s.t("male")}</option>
            <option value="female">{s.t("female")}</option>
          </select>
        </Field>
        <Field label={s.t("dob")}>
          <input type="date" className="field" value={p.dob} onChange={set("dob")} />
        </Field>
        <Field label={s.t("blood")}>
          <select className="field" value={p.blood} onChange={set("blood")} disabled={!med}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label={s.t("address")} full>
          <input className="field" value={p.address} onChange={set("address")} />
        </Field>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Field label={s.t("allergies")}>
          <input
            className="field"
            value={p.allergies}
            onChange={set("allergies")}
            disabled={!med}
          />
        </Field>
        <Field label={s.t("history")}>
          <textarea
            rows={3}
            className="field resize-none"
            value={p.history}
            onChange={set("history")}
            disabled={!med}
          />
        </Field>
        <Field label={s.t("notes")}>
          <textarea rows={3} className="field resize-none" value={p.notes} onChange={set("notes")} />
        </Field>
      </section>

      {!med && <p className="text-xs text-muted-foreground">{s.t("readOnly")}</p>}

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t bg-card px-5 py-4 sm:-mx-6 sm:px-6">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          {s.t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => onSave(p)}
          disabled={!p.name.trim()}
          className="btn btn-primary min-w-28"
        >
          {s.t("save")}
        </button>
      </div>
    </div>
  );
}
