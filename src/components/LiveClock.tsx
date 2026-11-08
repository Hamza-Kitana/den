import { useEffect, useState } from "react";

export function LiveDate({ locale }: { locale: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="text-sm font-semibold tracking-tight">
      {now.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </div>
  );
}

export function LiveTime() {
  const [label, setLabel] = useState(() => new Date().toLocaleTimeString("en-GB"));

  useEffect(() => {
    const id = window.setInterval(() => {
      setLabel(new Date().toLocaleTimeString("en-GB"));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-xl border bg-background px-3 py-2 font-mono text-sm font-semibold tabular-nums"
      dir="ltr"
    >
      {label}
    </div>
  );
}
