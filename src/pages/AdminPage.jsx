import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSettings, putSettings, uploadToCloudinary } from "../lib/api";
import { validateImageFile } from "../lib/fileValidation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAuth } from "../lib/authState";
import MemberSection from "../components/MemberSection";
import AdminMomentsPanel from "../components/AdminMomentsPanel";
import AdminScheduleUpload from "../components/AdminScheduleUpload";
import EnergyVideoUpload from "../components/EnergyVideoUpload";
import AdminBriefingUpload from "../components/AdminBriefingUpload";
import AdminTrainingPanel from "../components/AdminTrainingPanel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../lib/i18n/languageContext";

function HeroSettingsSection() {
  const { t } = useLanguage();
  const s = t.adminPanel.hero;
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings("hero")
      .then((data) => {
        if (!data) return;
        setTitle(data.title || "");
        if (data.image) {
          setImageUrl(data.image);
          setPreviewUrl(data.image);
        }
      })
      .catch((error) => console.error("Hero məlumat gətirilərkən xəta:", error));
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const validationError = validateImageFile(selected);
    if (validationError) {
      notify(validationError);
      e.target.value = "";
      return;
    }
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      if (file) {
        finalImageUrl = await uploadToCloudinary(file, "hero");
      }

      await putSettings("hero", { title: title.trim() || "Gandjlik 6615", image: finalImageUrl });

      setImageUrl(finalImageUrl);
      setFile(null);
      notify(s.saved);
    } catch (err) {
      console.error("Hero update xətası:", err);
      notify(s.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-[20px] uppercase tracking-widest text-zinc-900 font-bold mb-8">{s.title}</h2>

      <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.titleLabel}</label>
              <input
                type="text"
                placeholder={s.titlePh}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-widest outline-none focus:border-zinc-900 transition-all text-zinc-900"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.bgLabel}</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 bg-zinc-50 border border-zinc-200 py-3 px-4 text-[9px] outline-none cursor-pointer text-zinc-700"
                />
                {previewUrl && (
                  <div className="w-20 h-20 border border-zinc-200 rounded overflow-hidden">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 text-white px-12 py-4 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-40"
          >
            {saving ? s.saving : s.save}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const s = t.adminPanel;
  const { authorized, profile } = useAuthGuard({ requireAdmin: true });
  const { logout } = useAuth();
  const [section, setSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("admin-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("admin-theme", dark ? "dark" : "light");
    } catch {
      // ignore (private browsing, storage disabled, etc.)
    }
  }, [dark]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout xətası:", error);
    }
  };

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[9999]">
        <p className="font-sync text-[10px] tracking-[0.5em] uppercase text-white animate-pulse">
          {t.common.authenticating}
        </p>
      </div>
    );
  }

  // One list drives both the sidebar and which section renders — add a resource here and
  // it shows up in the nav for free, no separate routing/layout to keep in sync. Every
  // entry but "owner" is gated by the viewer's granted `permissions`; "owner" (the
  // General Admin's own account list) only ever shows for kind="owner" itself — it is
  // never a grantable permission, regardless of what's in anyone's permissions array.
  const isGeneralAdmin = profile?.kind === "owner";
  const permissions = profile?.permissions || [];
  const ALL_SECTIONS = [
    { id: "hero", label: s.hero.title, render: () => <HeroSettingsSection /> },
    { id: "energy", label: s.energy.title, render: () => <EnergyVideoUpload /> },
    { id: "schedule", label: s.schedule.title, render: () => <AdminScheduleUpload /> },
    { id: "moments", label: s.moments.title, render: () => <AdminMomentsPanel /> },
    { id: "briefings", label: s.briefings.title, render: () => <AdminBriefingUpload /> },
    { id: "trainings", label: s.trainings.title, render: () => <AdminTrainingPanel /> },
    {
      id: "crew",
      label: s.members.manageCrew,
      render: () => <MemberSection collectionName="crew" heading={s.members.manageCrew} entityName="Crew" />,
    },
    {
      id: "staff",
      label: s.members.manageStaff,
      render: () => <MemberSection collectionName="staff" heading={s.members.manageStaff} entityName="Staff" />,
    },
    {
      id: "owner",
      label: s.members.manageOwner,
      generalAdminOnly: true,
      // kind="owner": never shown on the public homepage (it only ever queries
      // staff/crew) — for admin accounts that shouldn't appear as a team member.
      render: () => <MemberSection collectionName="owner" heading={s.members.manageOwner} entityName="Owner" />,
    },
  ];
  const SECTIONS = ALL_SECTIONS.filter((item) =>
    item.generalAdminOnly ? isGeneralAdmin : isGeneralAdmin || permissions.includes(item.id)
  );
  const active = SECTIONS.find((item) => item.id === section) || SECTIONS[0];

  return (
    <div className={`admin-light min-h-screen bg-white text-zinc-900 flex flex-col md:flex-row ${dark ? "dark" : ""}`}>
      <aside className="md:w-64 md:shrink-0 md:flex md:flex-col md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50">
        <div className="p-6 border-b border-zinc-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-sync text-lg tracking-tighter uppercase text-zinc-900">
              GNC. <span className="text-zinc-400">Admin</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mt-1">{s.console}</p>
            <div className="mt-3 flex items-center gap-4">
              <LanguageSwitcher light />
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                title={dark ? s.lightMode : s.darkMode}
              >
                <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
              </button>
            </div>
          </div>
          {/* Mobile: a hamburger opens the section list as a dropdown instead of the
              desktop sidebar's always-visible vertical list (there's no room for that
              here, and a horizontally-scrolling tab bar hid most sections off-screen). */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden shrink-0 text-lg px-1 -mr-1 text-zinc-700"
            aria-label={s.menu}
            aria-expanded={mobileMenuOpen}
          >
            <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white max-h-[70vh] overflow-y-auto">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] border-b border-zinc-100 transition ${
                  item.id === active?.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-2 p-4">
              <Link
                to="/"
                className="flex-1 text-center text-[9px] uppercase tracking-widest border border-zinc-200 px-4 py-3 hover:bg-zinc-900 hover:text-white transition"
              >
                {s.back}
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 text-[9px] uppercase tracking-widest border border-zinc-200 px-4 py-3 hover:bg-zinc-900 hover:text-white transition"
              >
                {s.logout}
              </button>
            </div>
          </div>
        )}

        <nav className="hidden md:flex md:flex-col md:overflow-y-auto md:flex-1">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`text-left whitespace-nowrap px-6 py-4 text-[10px] uppercase tracking-[0.2em] border-b border-zinc-100 transition shrink-0 ${
                item.id === active?.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex p-4 gap-2 border-t border-zinc-200">
          <Link
            to="/"
            className="flex-1 text-center text-[9px] uppercase tracking-widest border border-zinc-200 px-4 py-3 hover:bg-zinc-900 hover:text-white transition"
          >
            {s.back}
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 text-[9px] uppercase tracking-widest border border-zinc-200 px-4 py-3 hover:bg-zinc-900 hover:text-white transition"
          >
            {s.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 md:p-10">
        {active ? active.render() : <p className="text-[10px] uppercase tracking-widest text-zinc-400">{s.noAccess}</p>}
      </main>
    </div>
  );
}
