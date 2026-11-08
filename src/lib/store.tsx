import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dict, type Lang, type ProcedureKey, type TKey } from "./i18n";
import {
  diffAppointments,
  diffPatients,
  diffUsers,
  makeLog,
  stampLogs,
  trimLogs,
  type ActivityLog,
  type Actor,
} from "./activity";

export type { ActivityLog } from "./activity";

export type Role = "admin" | "doctor" | "secretary";
export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  phone?: string;
};
export type ToothStatus =
  "healthy" | "cavity" | "filled" | "crown" | "rootCanal" | "missing" | "implant";
export type ToothInfo = { status: ToothStatus; note: string; updatedAt?: string };
export type Treatment = {
  id: string;
  date: string;
  procedure: ProcedureKey | string;
  tooth?: number | undefined;
  cost: number;
  paid: number;
};
export type PatientSection = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};
/** Planned / catalog procedure for a patient (can be dozens or hundreds). */
export type PatientProcedure = {
  id: string;
  title: string;
  tooth: string;
  cost: number;
  notes: string;
  createdAt: string;
};
/** One clinic session; procedureIds are the procedures done in that session. */
export type ClinicSession = {
  id: string;
  date: string;
  time: string;
  duration: number;
  doctor: string;
  notes: string;
  /** Optional session total — use when not pricing each procedure. */
  cost: number;
  paid: number;
  procedureIds: string[];
};
export type PatientPhoto = {
  id: string;
  dataUrl: string;
  caption: string;
  createdAt: string;
};
export type Patient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: "male" | "female";
  dob: string;
  blood: string;
  address: string;
  allergies: string;
  history: string;
  notes: string;
  createdAt: string;
  teeth: Record<number, ToothInfo>;
  treatments: Treatment[];
  sections: PatientSection[];
  procedures: PatientProcedure[];
  sessions: ClinicSession[];
  photos: PatientPhoto[];
};
export type ApptStatus =
  | "scheduled"
  | "confirmed"
  | "waiting"
  | "inProgress"
  | "done"
  | "cancelled";
export type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: ProcedureKey | string;
  status: ApptStatus;
  notes: string;
};

export const can = {
  manageUsers: (r?: Role) => r === "admin",
  manageAppointments: (r?: Role) => r === "admin" || r === "secretary",
  editApptStatus: (r?: Role) => r === "admin" || r === "doctor" || r === "secretary",
  editChart: (r?: Role) => r === "admin" || r === "doctor",
  editMedical: (r?: Role) => r === "admin" || r === "doctor",
  deletePatient: (r?: Role) => r === "admin",
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function appointmentsOverlap(a: Appointment, b: Appointment) {
  if (a.date !== b.date || a.id === b.id) return false;
  if (a.status === "cancelled" || b.status === "cancelled") return false;
  const a0 = toMin(a.time);
  const a1 = a0 + a.duration;
  const b0 = toMin(b.time);
  const b1 = b0 + b.duration;
  return a0 < b1 && b0 < a1;
}

export function seed() {
  const users: User[] = [
    {
      id: "u1",
      name: "Rami Haddad",
      username: "admin",
      password: "admin123",
      role: "admin",
      phone: "0790000001",
    },
    {
      id: "u2",
      name: "Dr. Lina Mansour",
      username: "doctor",
      password: "doctor123",
      role: "doctor",
      phone: "0790000002",
    },
    {
      id: "u3",
      name: "Sara Odeh",
      username: "secretary",
      password: "sec123",
      role: "secretary",
      phone: "0790000003",
    },
  ];
  const raw: [string, string, "male" | "female", string, string, string, string][] = [
    ["أحمد خليل", "0791234567", "male", "1988-04-12", "O+", "البنسلين", "سكري نوع 2"],
    ["Lara Nasser", "0782345678", "female", "1995-09-03", "A+", "", ""],
    ["محمد العبادي", "0773456789", "male", "1972-01-22", "B+", "", "ضغط دم مرتفع"],
    ["Noor Al-Zoubi", "0794567890", "female", "2001-06-18", "AB-", "Latex", ""],
    ["خالد الشريف", "0785678901", "male", "1965-11-30", "O-", "", "أمراض قلب - يتناول مميعات"],
    ["Hala Saleh", "0776789012", "female", "1990-02-14", "A-", "", "Asthma"],
    ["يوسف قاسم", "0797890123", "male", "2010-08-08", "B-", "", ""],
    ["Maya Haddad", "0788901234", "female", "1983-12-01", "O+", "Ibuprofen", ""],
  ];
  const patients: Patient[] = raw.map(
    ([name, phone, gender, dob, blood, allergies, history], i) => ({
      id: `p${i + 1}`,
      name,
      phone,
      gender,
      dob,
      blood,
      allergies,
      history,
      email: `patient${i + 1}@mail.com`,
      address: i % 2 ? "Amman, Khalda" : "عمّان، الجبيهة",
      notes: "",
      createdAt: shift(-90 + i * 5),
      teeth:
        i === 0
          ? {
              16: { status: "filled", note: "حشوة كومبوزيت 2025" },
              36: { status: "cavity", note: "تسوس عميق - يحتاج علاج عصب" },
              48: { status: "missing", note: "خلع ضرس العقل" },
            }
          : i === 2
            ? {
                11: { status: "crown", note: "Zirconia crown" },
                26: { status: "rootCanal", note: "" },
                46: { status: "implant", note: "Implant placed" },
              }
            : { [14 + i]: { status: "cavity", note: "" } },
      treatments: [
        { id: uid(), date: shift(-40 + i), procedure: "cleaning", cost: 30, paid: 30 },
        {
          id: uid(),
          date: shift(-12 + i),
          procedure: "filling",
          tooth: 16,
          cost: 45,
          paid: i === 0 ? 20 : 45,
        },
      ],
      sections:
        i === 0
          ? [
              {
                id: uid(),
                title: "أدوية حالية",
                content: "ميتفورمين 500mg مرتين يومياً\nأسبرين 81mg مرة يومياً",
                updatedAt: shift(-5),
              },
              {
                id: uid(),
                title: "ملاحظات للمتابعة",
                content: "يفضل جلسات صباحية. حساس للبرودة عند التنظيف.",
                updatedAt: shift(-2),
              },
            ]
          : i === 2
            ? [
                {
                  id: uid(),
                  title: "خطة العلاج",
                  content: "متابعة تاج السن 11 + مراجعة الزرعة بعد 3 أشهر.",
                  updatedAt: shift(-8),
                },
              ]
            : [],
      procedures: [],
      sessions: [],
      photos: [],
    }),
  );

  // Rich demo plan for first patient: many procedures + sessions with checkboxes
  {
    const pr = (title: string, tooth: string, cost: number): PatientProcedure => ({
      id: uid(),
      title,
      tooth,
      cost,
      notes: "",
      createdAt: shift(-40),
    });
    const list = [
      pr("تنظيف وتلميع", "", 30),
      pr("أشعة بانوراما", "", 25),
      pr("حشوة مركبة", "16", 45),
      pr("حشوة مركبة", "26", 45),
      pr("علاج عصب — جلسة 1", "36", 80),
      pr("علاج عصب — جلسة 2", "36", 60),
      pr("حشو قناة الجذر", "36", 40),
      pr("تاج زركونيا", "36", 180),
      pr("خلع ضرس العقل", "48", 70),
      pr("تبييض منزلي", "", 90),
    ];
    patients[0]!.procedures = list;
    patients[0]!.sessions = [
      {
        id: uid(),
        date: shift(-40),
        time: "10:00",
        duration: 45,
        doctor: "Dr. Lina Mansour",
        notes: "جلسة أولى — تنظيف وتشخيص",
        cost: 0,
        paid: 55,
        procedureIds: [list[0]!.id, list[1]!.id],
      },
      {
        id: uid(),
        date: shift(-12),
        time: "11:30",
        duration: 60,
        doctor: "Dr. Lina Mansour",
        notes: "حشوة 16",
        cost: 0,
        paid: 45,
        procedureIds: [list[2]!.id],
      },
    ];
    const crown = pr("تاج زركونيا", "11", 180);
    const review = pr("مراجعة زراعة", "46", 0);
    patients[2]!.procedures = [crown, review];
    patients[2]!.sessions = [
      {
        id: uid(),
        date: shift(-20),
        time: "09:30",
        duration: 90,
        doctor: "Dr. Lina Mansour",
        notes: "تركيب تاج",
        cost: 0,
        paid: 100,
        procedureIds: [crown.id],
      },
    ];
  }
  const types = [
    "checkup",
    "cleaning",
    "filling",
    "rootCanalT",
    "extraction",
    "whitening",
    "orthodontics",
    "implantT",
  ] as const;
  const times = ["09:00", "09:45", "10:30", "11:30", "12:15", "13:30", "14:30", "15:30", "16:30"];
  const appointments: Appointment[] = [];
  for (let d = -3; d <= 5; d++) {
    const count = d === 0 ? 7 : 3 + ((d + 9) % 3);
    for (let k = 0; k < count; k++) {
      const status: ApptStatus =
        d < 0
          ? k % 4 === 3
            ? "cancelled"
            : "done"
          : d === 0
            ? k === 0
              ? "done"
              : k === 1
                ? "inProgress"
                : k === 2
                  ? "waiting"
                  : k % 2
                    ? "confirmed"
                    : "scheduled"
            : k % 2
              ? "confirmed"
              : "scheduled";
      appointments.push({
        id: uid(),
        patientId: `p${((k + d + 9) % 8) + 1}`,
        date: shift(d),
        time: times[k] ?? "09:00",
        duration: [30, 45, 60][k % 3] ?? 30,
        type: types[(k + d + 9) % types.length] ?? "checkup",
        status,
        notes: "",
      });
    }
  }
  return { users, patients, appointments, logs: [] as ActivityLog[] };
}

type Data = ReturnType<typeof seed>;
type Session = { userId: string | null; lang: Lang; dark: boolean };
type LiveMsg = { type: "data"; data: Data; rev: number };
type Ctx = Data & {
  user: User | null;
  lang: Lang;
  dark: boolean;
  ready: boolean;
  t: (k: TKey) => string;
  setLang: (l: Lang) => void;
  toggleDark: () => void;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  resetDemo: () => void;
  setPatients: (f: (p: Patient[]) => Patient[]) => void;
  setAppointments: (f: (a: Appointment[]) => Appointment[]) => void;
  setUsers: (f: (u: User[]) => User[]) => void;
  clearLogs: () => void;
};
const C = createContext<Ctx | null>(null);
const DATA_KEY = "smilecare-data-v1";
const SESSION_KEY = "smilecare-session-v1";
const LEGACY_KEY = "smilecare-v1";
const CHANNEL = "smilecare-live";

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

function normalizeTreatment(t: Treatment): Treatment {
  return {
    ...t,
    cost: Number(t.cost) || 0,
    paid: typeof t.paid === "number" ? t.paid : Number(t.cost) || 0,
  };
}

function normalizeSession(v: ClinicSession & { cost?: number }): ClinicSession {
  return {
    id: v.id,
    date: v.date ?? "",
    time: v.time ?? "",
    duration: Number(v.duration) || 30,
    doctor: v.doctor ?? "",
    notes: v.notes ?? "",
    cost: Number(v.cost) || 0,
    paid: Number(v.paid) || 0,
    procedureIds: Array.isArray(v.procedureIds) ? v.procedureIds : [],
  };
}

function normalizePatient(p: Patient & { clinicVisits?: unknown; checklist?: unknown }): Patient {
  const legacyVisits = Array.isArray(p.clinicVisits) ? (p.clinicVisits as ClinicSession[]) : [];
  const sessionsRaw = Array.isArray(p.sessions) ? p.sessions : legacyVisits;
  return {
    ...p,
    teeth: p.teeth ?? {},
    treatments: (Array.isArray(p.treatments) ? p.treatments : []).map(normalizeTreatment),
    sections: Array.isArray(p.sections) ? p.sections : [],
    procedures: Array.isArray(p.procedures) ? p.procedures : [],
    sessions: sessionsRaw.map((s) =>
      normalizeSession({
        ...s,
        procedureIds: Array.isArray(s.procedureIds) ? s.procedureIds : [],
        paid: Number(s.paid) || 0,
        doctor: s.doctor ?? "",
        notes: s.notes ?? "",
      }),
    ),
    photos: Array.isArray(p.photos) ? p.photos : [],
  };
}

function normalizeData(data: Data): Data {
  return {
    ...data,
    patients: (data.patients ?? []).map(normalizePatient),
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    users: Array.isArray(data.users) ? data.users : [],
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromStorage(): { data: Data; session: Session; rev: number } {
  const legacy = readJson<{ data?: Data; userId?: string | null; lang?: Lang; dark?: boolean }>(
    LEGACY_KEY,
  );
  const storedData = readJson<{ data: Data; rev: number }>(DATA_KEY);
  const storedSession = readJson<Session>(SESSION_KEY);

  const data = normalizeData(storedData?.data ?? legacy?.data ?? seed());
  const rev = storedData?.rev ?? 1;
  const session: Session = storedSession ?? {
    userId: legacy?.userId ?? null,
    lang: legacy?.lang ?? "ar",
    dark: !!legacy?.dark,
  };

  if (!storedData) writeJson(DATA_KEY, { data, rev });
  if (!storedSession) writeJson(SESSION_KEY, session);
  if (legacy && canUseStorage()) localStorage.removeItem(LEGACY_KEY);

  return { data, session, rev };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<Data>(() => seed());
  const [userId, setUserId] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>("ar");
  const [dark, setDark] = useState(false);
  const dataRef = useRef(data);
  const userIdRef = useRef(userId);
  const langRef = useRef(lang);
  const revRef = useRef(1);
  const applyingRemote = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  dataRef.current = data;
  userIdRef.current = userId;
  langRef.current = lang;

  const actorOf = useCallback((): Actor => {
    const id = userIdRef.current;
    const u = dataRef.current.users.find((x) => x.id === id);
    return { id, name: u?.name ?? (id ? "User" : "System") };
  }, []);

  const publish = useCallback((next: Data, nextRev: number) => {
    writeJson(DATA_KEY, { data: next, rev: nextRev });
    const msg: LiveMsg = { type: "data", data: next, rev: nextRev };
    channelRef.current?.postMessage(msg);
  }, []);

  const applyData = useCallback(
    (updater: (d: Data) => Data) => {
      setData((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        const nextRev = revRef.current + 1;
        revRef.current = nextRev;
        queueMicrotask(() => {
          if (!applyingRemote.current) publish(next, nextRev);
        });
        return next;
      });
    },
    [publish],
  );

  const withLogs = useCallback(
    (entries: ActivityLog[], patch: (d: Data) => Data) => {
      const stamped = stampLogs(entries, actorOf());
      applyData((d) => {
        const next = patch(d);
        if (!stamped.length) return next;
        return { ...next, logs: trimLogs([...(next.logs ?? d.logs ?? []), ...stamped]) };
      });
    },
    [actorOf, applyData],
  );

  useEffect(() => {
    const boot = loadFromStorage();
    revRef.current = boot.rev;
    setData(boot.data);
    setUserId(boot.session.userId);
    setLangState(boot.session.lang);
    setDark(boot.session.dark);
    setHydrated(true);

    const ch = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;
    channelRef.current = ch;

    const acceptRemote = (remote: Data, remoteRev: number) => {
      if (remoteRev <= revRef.current) return;
      applyingRemote.current = true;
      revRef.current = remoteRev;
      setData(normalizeData(remote));
      queueMicrotask(() => {
        applyingRemote.current = false;
      });
    };

    const onMessage = (ev: MessageEvent<LiveMsg>) => {
      const msg = ev.data;
      if (!msg || msg.type !== "data" || !msg.data || typeof msg.rev !== "number") return;
      acceptRemote(msg.data, msg.rev);
      writeJson(DATA_KEY, { data: msg.data, rev: msg.rev });
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as { data: Data; rev: number };
        if (!parsed?.data || typeof parsed.rev !== "number") return;
        acceptRemote(parsed.data, parsed.rev);
      } catch {
        /* ignore */
      }
    };

    const pullLatest = () => {
      const stored = readJson<{ data: Data; rev: number }>(DATA_KEY);
      if (stored?.data && typeof stored.rev === "number") acceptRemote(stored.data, stored.rev);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") pullLatest();
    };

    ch?.addEventListener("message", onMessage as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", pullLatest);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ch?.removeEventListener("message", onMessage as EventListener);
      ch?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", pullLatest);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(SESSION_KEY, { userId, lang, dark } satisfies Session);
  }, [hydrated, userId, lang, dark]);

  const setLang = useCallback(
    (l: Lang) => {
      const ar = langRef.current === "ar";
      const prev = langRef.current;
      setLangState(l);
      if (prev === l) return;
      withLogs(
        [
          makeLog(
            actorOf(),
            "settings",
            "settings",
            ar ? `تغيير اللغة إلى ${l}` : `Language changed to ${l}`,
          ),
        ],
        (d) => d,
      );
    },
    [actorOf, withLogs],
  );

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      const ar = langRef.current === "ar";
      queueMicrotask(() => {
        withLogs(
          [
            makeLog(
              actorOf(),
              "settings",
              "settings",
              ar
                ? next
                  ? "تفعيل الوضع الداكن"
                  : "تفعيل الوضع الفاتح"
                : next
                  ? "Dark mode on"
                  : "Light mode on",
            ),
          ],
          (x) => x,
        );
      });
      return next;
    });
  }, [actorOf, withLogs]);

  const logout = useCallback(() => {
    const ar = langRef.current === "ar";
    const actor = actorOf();
    withLogs(
      [
        makeLog(
          actor,
          "logout",
          "auth",
          ar ? `تسجيل خروج: ${actor.name}` : `Logout: ${actor.name}`,
        ),
      ],
      (d) => d,
    );
    setUserId(null);
  }, [actorOf, withLogs]);

  const login = useCallback(
    (u: string, p: string) => {
      const ar = langRef.current === "ar";
      const f = dataRef.current.users.find((x) => x.username === u.trim() && x.password === p);
      if (f) {
        setUserId(f.id);
        userIdRef.current = f.id;
        withLogs(
          [
            makeLog(
              { id: f.id, name: f.name },
              "login",
              "auth",
              ar ? `تسجيل دخول: ${f.name}` : `Login: ${f.name}`,
            ),
          ],
          (d) => d,
        );
        return true;
      }
      withLogs(
        [
          makeLog(
            { id: null, name: u.trim() || "—" },
            "login_fail",
            "auth",
            ar
              ? `فشل تسجيل الدخول: ${u.trim() || "—"}`
              : `Failed login: ${u.trim() || "—"}`,
          ),
        ],
        (d) => d,
      );
      return false;
    },
    [withLogs],
  );

  const resetDemo = useCallback(() => {
    const ar = langRef.current === "ar";
    const actor = actorOf();
    applyData((d) => {
      const fresh = seed();
      return {
        ...fresh,
        logs: trimLogs([
          ...(d.logs ?? []),
          makeLog(
            actor,
            "reset",
            "system",
            ar ? "إعادة ضبط البيانات التجريبية" : "Demo data reset",
          ),
        ]),
      };
    });
  }, [actorOf, applyData]);

  const setPatients = useCallback(
    (f: (p: Patient[]) => Patient[]) => {
      const ar = langRef.current === "ar";
      applyData((d) => {
        const patients = f(d.patients);
        const entries = stampLogs(diffPatients(d.patients, patients, ar), actorOf());
        return {
          ...d,
          patients,
          logs: entries.length ? trimLogs([...(d.logs ?? []), ...entries]) : d.logs,
        };
      });
    },
    [actorOf, applyData],
  );

  const setAppointments = useCallback(
    (f: (a: Appointment[]) => Appointment[]) => {
      const ar = langRef.current === "ar";
      applyData((d) => {
        const appointments = f(d.appointments);
        const entries = stampLogs(
          diffAppointments(d.appointments, appointments, d.patients, ar),
          actorOf(),
        );
        return {
          ...d,
          appointments,
          logs: entries.length ? trimLogs([...(d.logs ?? []), ...entries]) : d.logs,
        };
      });
    },
    [actorOf, applyData],
  );

  const setUsers = useCallback(
    (f: (u: User[]) => User[]) => {
      const ar = langRef.current === "ar";
      applyData((d) => {
        const users = f(d.users);
        const entries = stampLogs(diffUsers(d.users, users, ar), actorOf());
        return {
          ...d,
          users,
          logs: entries.length ? trimLogs([...(d.logs ?? []), ...entries]) : d.logs,
        };
      });
    },
    [actorOf, applyData],
  );

  const clearLogs = useCallback(() => {
    const ar = langRef.current === "ar";
    const actor = actorOf();
    applyData((d) => ({
      ...d,
      logs: [
        makeLog(actor, "delete", "system", ar ? "مسح سجل النشاط" : "Activity log cleared"),
      ],
    }));
  }, [actorOf, applyData]);

  const t = useCallback((k: TKey) => dict[lang][k] ?? k, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      lang,
      dark,
      ready: hydrated,
      user: data.users.find((u) => u.id === userId) ?? null,
      t,
      setLang,
      toggleDark,
      login,
      logout,
      resetDemo,
      setPatients,
      setAppointments,
      setUsers,
      clearLogs,
    }),
    [
      data,
      lang,
      dark,
      hydrated,
      userId,
      t,
      setLang,
      toggleDark,
      login,
      logout,
      resetDemo,
      setPatients,
      setAppointments,
      setUsers,
      clearLogs,
    ],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useStore = () => {
  const c = useContext(C);
  if (!c) throw new Error("no store");
  return c;
};

export const ageOf = (dob: string) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / 3.15576e10);

export type PatientInfo = Omit<
  Patient,
  | "teeth"
  | "treatments"
  | "sections"
  | "procedures"
  | "sessions"
  | "photos"
  | "id"
  | "createdAt"
>;

/** Compress an image file to a data URL suitable for localStorage. */
export function fileToPhotoDataUrl(file: File, maxSide = 1200, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode-failed"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
