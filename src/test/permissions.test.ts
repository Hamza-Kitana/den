import { describe, expect, it } from "vitest";
import { appointmentsOverlap, can, type Appointment } from "@/lib/store";

describe("permissions", () => {
  it("gates staff management to admin only", () => {
    expect(can.manageUsers("admin")).toBe(true);
    expect(can.manageUsers("doctor")).toBe(false);
    expect(can.manageUsers("secretary")).toBe(false);
  });

  it("lets secretary manage appointments but not the chart", () => {
    expect(can.manageAppointments("secretary")).toBe(true);
    expect(can.editChart("secretary")).toBe(false);
    expect(can.editMedical("secretary")).toBe(false);
  });

  it("lets doctor edit clinical data and statuses", () => {
    expect(can.editChart("doctor")).toBe(true);
    expect(can.editMedical("doctor")).toBe(true);
    expect(can.editApptStatus("doctor")).toBe(true);
    expect(can.manageAppointments("doctor")).toBe(false);
    expect(can.deletePatient("doctor")).toBe(false);
  });
});

describe("appointmentsOverlap", () => {
  const base = {
    id: "a1",
    patientId: "p1",
    date: "2026-10-29",
    time: "10:00",
    duration: 45,
    type: "checkup",
    status: "scheduled" as const,
    notes: "",
  };

  it("detects overlapping slots on the same day", () => {
    const other: Appointment = { ...base, id: "a2", time: "10:30", duration: 30 };
    expect(appointmentsOverlap(base, other)).toBe(true);
  });

  it("ignores cancelled appointments", () => {
    const other: Appointment = { ...base, id: "a2", time: "10:00", status: "cancelled" };
    expect(appointmentsOverlap(base, other)).toBe(false);
  });
});
