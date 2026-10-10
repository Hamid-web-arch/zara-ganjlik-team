import { notify, confirmAsync, promptAsync } from "../lib/notify";
import { useEffect, useRef, useState } from "react";
import {
  listMembers,
  createMember,
  updateMember,
  deleteMember as deleteMemberApi,
  issueTemporaryPassword,
} from "../lib/api";
import { useLanguage } from "../lib/i18n/languageContext";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const EMPTY_FORM = { name: "", role: "", idCode: "", email: "", password: "", accessLevel: "user", section: "" };
const SECTIONS = ["woman", "men", "kids"];

export default function MemberSection({ collectionName, heading, entityName }) {
  const { t } = useLanguage();
  const s = t.adminPanel.members;
  // Owner accounts aren't sales staff, so the Woman/Men/Kids department doesn't apply.
  const needsSection = collectionName !== "owner";
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const loadMembers = () =>
    listMembers(collectionName)
      .then(setMembers)
      .catch((error) => console.error("Üzvlər yüklənərkən xəta:", error));

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEdit = (id) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    setForm({
      name: member.name || "",
      role: member.role || "",
      idCode: member.idCode || "",
      email: member.email || "",
      password: "",
      accessLevel: member.accessLevel || "user",
      section: member.section || "",
    });
    setEditId(id);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleIssueTempPassword = async (id) => {
    const value = await promptAsync(s.issueTempPasswordPrompt, { placeholder: s.password, inputType: "password" });
    if (value === null) return; // cancelled
    if (value.length < 8) {
      notify(s.tooShortPassword);
      return;
    }
    try {
      await issueTemporaryPassword(id, value);
      notify(s.issueTempPasswordSuccess);
    } catch (error) {
      notify(s.issueTempPasswordError + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmAsync(s.confirmDelete.replace("{entity}", entityName.toLowerCase())))) return;
    try {
      await deleteMemberApi(collectionName, id);
      notify(s.deleted.replace("{entity}", entityName));
      await loadMembers();
    } catch (error) {
      notify(s.deleteError + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (needsSection && !form.section) {
      notify(s.sectionRequired);
      setSaving(false);
      return;
    }

    try {
      if (editId) {
        // email/password are intentionally left out of an edit: the API only accepts
        // them on create. Changing another member's login email/password is an admin-
        // console (database) action, not something exposed here.
        await updateMember(collectionName, editId, {
          name: form.name,
          role: form.role,
          idCode: form.idCode,
          accessLevel: form.accessLevel,
          section: needsSection ? form.section : null,
        });
        notify(s.updated.replace("{entity}", entityName));
      } else {
        if (!form.password) {
          notify(s.passwordRequired.replace("{entity}", entityName.toLowerCase()));
          setSaving(false);
          return;
        }
        await createMember(collectionName, {
          name: form.name,
          role: form.role,
          idCode: form.idCode,
          email: form.email,
          password: form.password,
          accessLevel: form.accessLevel,
          section: needsSection ? form.section : null,
        });
        notify(s.added.replace("{entity}", entityName));
      }

      setForm(EMPTY_FORM);
      setEditId(null);
      await loadMembers();
    } catch (error) {
      console.error("Üzv saxlanarkən xəta:", error);
      notify(s.saveError + error.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400";

  return (
    <section className="bg-white border border-zinc-200 p-4 md:p-8 rounded-sm">
      <h2 className="font-sync text-xl font-bold tracking-tighter mb-8 text-zinc-900">{heading}</h2>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-10"
      >
        <input type="text" placeholder={s.name} required value={form.name} onChange={handleChange("name")} className={inputClass} />
        <input type="text" placeholder={s.role} required value={form.role} onChange={handleChange("role")} className={inputClass} />
        <input type="text" placeholder={s.idCode} required value={form.idCode} onChange={handleChange("idCode")} className={inputClass} />
        <input
          type="email"
          placeholder={editId ? s.emailLocked : s.email}
          required
          disabled={!!editId}
          title={editId ? s.emailTitle : undefined}
          value={form.email}
          onChange={handleChange("email")}
          className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
        />
        <input
          type="password"
          placeholder={editId ? s.passwordLocked : s.password}
          disabled={!!editId}
          title={editId ? s.passwordTitle : undefined}
          value={form.password}
          onChange={handleChange("password")}
          className="bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="relative border-b border-zinc-200 focus-within:border-zinc-900">
          <select
            required
            value={form.accessLevel}
            onChange={handleChange("accessLevel")}
            className="w-full bg-transparent py-3 text-[10px] tracking-[0.2em] text-zinc-600 outline-none appearance-none cursor-pointer font-light"
          >
            <option value="user" className="bg-white text-zinc-900">
              {s.userOption}
            </option>
            <option value="admin" className="bg-white text-zinc-900">
              {s.adminOption}
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400 text-[8px]">
            ▼
          </div>
        </div>

        {needsSection && (
          <div className="relative border-b border-zinc-200 focus-within:border-zinc-900">
            <select
              required
              value={form.section}
              onChange={handleChange("section")}
              className="w-full bg-transparent py-3 text-[10px] tracking-[0.2em] text-zinc-600 outline-none appearance-none cursor-pointer font-light"
            >
              <option value="" disabled className="bg-white text-zinc-900">
                {s.sectionPh}
              </option>
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec} className="bg-white text-zinc-900">
                  {s.sectionOptions[sec]}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400 text-[8px]">
              ▼
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="border border-zinc-300 py-3 text-[9px] uppercase tracking-[0.4em] hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all md:col-span-2 lg:col-span-6 mt-2 disabled:opacity-40"
        >
          {saving
            ? s.saving
            : editId
            ? s.update.replace("{entity}", entityName.toUpperCase())
            : s.add.replace("{entity}", entityName)}
        </button>
      </form>

      {/* Mobile: stacked cards — a fixed-layout table can't shrink to a narrow screen without
          truncating every column, so below md this renders as cards instead. */}
      <div className="md:hidden space-y-3 max-h-[400px] overflow-y-auto">
        {members.map((m) => (
          <div key={m.id} className="border border-zinc-200 rounded-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img src={m.image || DEFAULT_AVATAR} className="w-10 h-10 object-cover rounded-full shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-900 truncate">{m.name}</p>
                <p className="text-[9px] text-zinc-500 truncate">
                  {m.role}
                  {m.section && <span className="text-zinc-400"> · {s.sectionOptions[m.section]}</span>}
                  {m.accessLevel === "admin" && <span className="text-blue-600"> [ADMIN]</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500">
              <div>
                <span className="block text-[8px] uppercase tracking-widest text-zinc-400">{s.id}</span>
                {m.idCode || "-"}
              </div>
              <div className="min-w-0">
                <span className="block text-[8px] uppercase tracking-widest text-zinc-400">{s.email}</span>
                <span className="truncate block">{m.email || "-"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-2 border-t border-zinc-100">
              <button onClick={() => handleEdit(m.id)} className="text-[9px] text-blue-600">
                {s.edit}
              </button>
              <button onClick={() => handleIssueTempPassword(m.id)} className="text-[9px] text-amber-600">
                {s.issueTempPassword}
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-[9px] text-red-600">
                {s.remove}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block max-h-[300px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-left" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
          <thead className="sticky top-0 bg-zinc-50">
            <tr className="border-b border-zinc-200 text-[8px] uppercase tracking-[0.4em] text-zinc-400">
              <th className="pb-4 w-[22%]">{s.member}</th>
              <th className="pb-4 w-[18%]">{s.role}</th>
              <th className="pb-4 w-[13%]">{s.id}</th>
              <th className="pb-4 w-[22%]">{s.email}</th>
              <th className="pb-4 w-[25%] text-right pr-6">{s.actions}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="group border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-4 flex items-center gap-3">
                  <img src={m.image || DEFAULT_AVATAR} className="w-10 h-10 object-cover rounded-full" alt="" />
                  <span className="text-[10px] text-zinc-900">{m.name}</span>
                </td>
                <td className="py-4 text-[9px] text-zinc-500">
                  {m.role}
                  {m.section && <span className="text-zinc-400"> · {s.sectionOptions[m.section]}</span>}
                  {m.accessLevel === "admin" && <span className="text-blue-600 text-[8px]"> [ADMIN]</span>}
                </td>
                <td className="py-4 text-[9px] text-zinc-500">{m.idCode || "-"}</td>
                <td className="py-4 text-[9px] text-zinc-500">{m.email || "-"}</td>
                <td className="py-4 text-right space-x-2 pr-6">
                  <button onClick={() => handleEdit(m.id)} className="text-[8px] text-blue-600">
                    {s.edit}
                  </button>
                  <button onClick={() => handleIssueTempPassword(m.id)} className="text-[8px] text-amber-600">
                    {s.issueTempPassword}
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-[8px] text-red-600">
                    {s.remove}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
