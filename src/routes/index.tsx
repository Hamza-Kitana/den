import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Globe,
  Lock,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  User as UserIcon,
} from "lucide-react";
import clinic from "@/assets/clinic.jpg";
import { useStore } from "@/lib/store";
import { ToothLogo } from "@/components/ToothLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — SmileCare Dental Clinic" },
      {
        name: "description",
        content: "Sign in to SmileCare to manage appointments, patients and dental charts.",
      },
      { property: "og:title", content: "Sign in — SmileCare Dental Clinic" },
      {
        property: "og:description",
        content: "Dental clinic management system for admins, doctors and secretaries.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const s = useStore();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (s.user) nav({ to: "/dashboard" });
  }, [s.user, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.login(u, p)) setErr(true);
  };

  const demos = [
    { role: "admin" as const, u: "admin", p: "admin123", icon: ShieldCheck },
    { role: "doctor" as const, u: "doctor", p: "doctor123", icon: Stethoscope },
    { role: "secretary" as const, u: "secretary", p: "sec123", icon: ClipboardList },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={clinic}
          alt=""
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4f4c] via-[#0a4f4c]/45 to-transparent" />
        <div className="absolute bottom-0 p-12 text-white">
          <ToothLogo className="mb-6 h-14 w-14" />
          <h2 className="text-4xl font-extrabold leading-tight">{s.t("appName")}</h2>
          <p className="mt-3 max-w-md text-lg text-white/80">{s.t("tagline")}</p>
        </div>
      </div>

      <div className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-8 safe-pb safe-pt sm:p-6">
        <div className="absolute end-4 top-4 flex gap-2 sm:end-6 sm:top-6">
          <button
            type="button"
            onClick={() => s.setLang(s.lang === "ar" ? "en" : "ar")}
            className="btn btn-ghost h-10"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">{s.t("lang")}</span>
          </button>
          <button
            type="button"
            onClick={s.toggleDark}
            className="btn btn-ghost h-10 w-10 px-0"
            aria-label={s.t("theme")}
          >
            {s.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <div className="animate-rise w-full max-w-md pt-10 sm:pt-0">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <ToothLogo className="h-11 w-11" />
            <span className="text-2xl font-bold">{s.t("appName")}</span>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{s.t("welcomeBack")}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{s.t("loginSub")}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="relative">
              <UserIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="field ps-10 py-3"
                placeholder={s.t("username")}
                value={u}
                onChange={(e) => {
                  setU(e.target.value);
                  setErr(false);
                }}
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                className="field ps-10 py-3"
                placeholder={s.t("password")}
                value={p}
                onChange={(e) => {
                  setP(e.target.value);
                  setErr(false);
                }}
                autoComplete="current-password"
              />
            </div>
            {err && <p className="text-sm font-medium text-destructive">{s.t("invalid")}</p>}
            <button type="submit" className="btn btn-primary w-full py-3 text-base">
              {s.t("signIn")}
            </button>
          </form>
          <div className="mt-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {s.t("demo")}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {demos.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => {
                    setU(d.u);
                    setP(d.p);
                    setErr(false);
                    if (!s.login(d.u, d.p)) setErr(true);
                  }}
                  className="card flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 p-3 transition active:scale-[0.98] hover:border-primary/50 sm:gap-2 sm:p-4"
                >
                  <d.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  <span className="text-xs font-semibold sm:text-sm">{s.t(d.role)}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:inline">
                    {s.t("useDemo")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
