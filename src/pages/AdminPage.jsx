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
  const { authorized } = useAuthGuard({ requireAdmin: true });
  const { logout } = useAuth();
  const [section, setSection] = useState("hero");

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
  // it shows up in the nav for free, no separate routing/layout to keep in sync.
  const SECTIONS = [
    { id: "hero", label: s.hero.title, render: () => <HeroSettingsSection /> },
    { id: "energy", label: s.energy.title, render: () => <EnergyVideoUpload /> },
    { id: "schedule", label: s.schedule.title, render: () => <AdminScheduleUpload /> },
    { id: "moments", label: s.moments.title, render: () => <AdminMomentsPanel /> },
    { id: "briefings", label: s.briefings.title, render: () => <AdminBriefingUpload /> },
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
  ];
  const active = SECTIONS.find((item) => item.id === section) || SECTIONS[0];

  return (
    <div className="admin-light min-h-screen bg-white text-zinc-900 flex flex-col md:flex-row">
      <aside className="md:w-64 md:shrink-0 md:flex md:flex-col md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50">
        <div className="p-6 border-b border-zinc-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-sync text-lg tracking-tighter uppercase text-zinc-900">
              GNC. <span className="text-zinc-400">Admin</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mt-1">{s.console}</p>
          </div>
          {/* Compact on mobile, where the full-width buttons below are hidden to keep the
              nav bar from being pushed down by them. */}
          <div className="flex gap-3 md:hidden shrink-0 pt-1">
            <Link to="/" className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition">
              {s.back}
            </Link>
            <button onClick={handleLogout} className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition">
              {s.logout}
            </button>
          </div>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto md:flex-1">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`text-left whitespace-nowrap px-6 py-4 text-[10px] uppercase tracking-[0.2em] border-b border-zinc-100 transition shrink-0 ${
                item.id === active.id
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

      <main className="flex-1 min-w-0 p-6 md:p-10">{active.render()}</main>
    </div>
  );
}
