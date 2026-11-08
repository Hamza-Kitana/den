import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutGrid, Pencil, Plus, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { can, uid, useStore, type Role, type User } from "@/lib/store";
import { Avatar, Field, Modal, PageHeader } from "@/components/kit";

export const Route = createFileRoute("/_app/users")({
  head: () => ({
    meta: [
      { title: "Staff — SmileCare" },
      { name: "description", content: "Manage clinic staff accounts." },
      { property: "og:title", content: "Staff — SmileCare" },
      { property: "og:description", content: "Clinic staff accounts." },
    ],
  }),
  component: Users,
});

const roleTone: Record<Role, string> = {
  admin: "bg-destructive/10 text-destructive",
  doctor: "bg-primary/10 text-primary",
  secretary: "bg-info/10 text-info",
};

type Draft = User & { passwordInput?: string };
type ViewMode = "cards" | "table";
const VIEW_KEY = "smilecare-users-view";

function Users() {
  const s = useStore();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [view, setView] = useState<ViewMode>("table");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "cards" || saved === "table") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeView = (mode: ViewMode) => {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  if (!can.manageUsers(s.user?.role)) return <Navigate to="/dashboard" />;

  const save = () => {
    if (!edit) return;
    const username = edit.username.trim();
    if (!edit.name.trim() || !username) return;
    const taken = s.users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== edit.id,
    );
    if (taken) {
      toast.error(s.t("usernameTaken"));
      return;
    }
    const password = edit.id
      ? edit.passwordInput?.trim() || edit.password
      : edit.passwordInput?.trim() || edit.password;
    if (!password) {
      toast.error(s.t("password"));
      return;
    }
    const next: User = {
      id: edit.id || uid(),
      name: edit.name.trim(),
      username,
      password,
      role: edit.role,
      ...(edit.phone?.trim() ? { phone: edit.phone.trim() } : {}),
    };
    s.setUsers((all) => (edit.id ? all.map((u) => (u.id === edit.id ? next : u)) : [...all, next]));
    toast.success(s.t("saved"));
    setEdit(null);
  };

  const removeUser = (u: User) => {
    if (u.id === s.user?.id) return;
    if (!confirm(s.t("confirmDelete"))) return;
    s.setUsers((a) => a.filter((x) => x.id !== u.id));
    toast.success(s.t("deleted"));
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title={s.t("users")}
        action={
          <button
            type="button"
            onClick={() =>
              setEdit({
                id: "",
                name: "",
                username: "",
                password: "",
                passwordInput: "",
                role: "secretary",
                phone: "",
              })
            }
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            {s.t("addUser")}
          </button>
        }
      />

      <div className="mb-5 flex justify-end">
        <div className="inline-flex rounded-xl border bg-card p-1">
          <button
            type="button"
            onClick={() => changeView("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "table"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-4 w-4" />
            {s.t("viewTable")}
          </button>
          <button
            type="button"
            onClick={() => changeView("cards")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "cards"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            {s.t("viewCards")}
          </button>
        </div>
      </div>

      {view === "table" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{s.t("name")}</th>
                <th className="p-3 text-start">{s.t("username")}</th>
                <th className="p-3 text-start">{s.t("phone")}</th>
                <th className="p-3 text-start">{s.t("role")}</th>
                <th className="p-3 text-end">{s.t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {s.users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="h-9 w-9 text-xs" />
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground" dir="ltr">
                    @{u.username}
                  </td>
                  <td className="p-3" dir="ltr">
                    {u.phone || "—"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${roleTone[u.role]}`}>
                      {s.t(u.role)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEdit({ ...u, passwordInput: "" })}
                        className="rounded-lg p-2 hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {u.id !== s.user?.id && (
                        <button
                          type="button"
                          onClick={() => removeUser(u)}
                          className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {s.users.map((u) => (
            <div key={u.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{u.name}</div>
                  <div className="text-sm text-muted-foreground" dir="ltr">
                    @{u.username}
                  </div>
                  {u.phone && (
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {u.phone}
                    </div>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleTone[u.role]}`}>
                  {s.t(u.role)}
                </span>
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setEdit({ ...u, passwordInput: "" })}
                  className="rounded-lg p-2 hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {u.id !== s.user?.id && (
                  <button
                    type="button"
                    onClick={() => removeUser(u)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? s.t("edit") : s.t("addUser")}
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={s.t("name")} full>
              <input
                className="field"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label={s.t("username")}>
              <input
                className="field"
                dir="ltr"
                value={edit.username}
                onChange={(e) => setEdit({ ...edit, username: e.target.value })}
              />
            </Field>
            <Field label={s.t("password")}>
              <input
                type="password"
                className="field"
                dir="ltr"
                placeholder={edit.id ? s.t("passwordKeep") : undefined}
                value={edit.passwordInput ?? ""}
                onChange={(e) => setEdit({ ...edit, passwordInput: e.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <Field label={s.t("phone")}>
              <input
                className="field"
                dir="ltr"
                value={edit.phone ?? ""}
                onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
              />
            </Field>
            <Field label={s.t("role")} full>
              <select
                className="field"
                value={edit.role}
                disabled={edit.id === s.user?.id}
                onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}
              >
                {(["admin", "doctor", "secretary"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {s.t(r)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEdit(null)} className="btn btn-ghost">
                {s.t("cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={
                  !edit.name ||
                  !edit.username ||
                  (!edit.id && !(edit.passwordInput || edit.password))
                }
                className="btn btn-primary"
              >
                {s.t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
