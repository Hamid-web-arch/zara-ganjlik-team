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
    <div className="mt-16">
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-[20px] uppercase tracking-widest text-white font-bold">{s.title}</h2>
      </div>

      <div className="glass p-8 rounded-sm mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-white/30 block">{s.titleLabel}</label>
              <input
                type="text"
                placeholder={s.titlePh}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[10px] tracking-widest outline-none focus:border-white transition-all text-white"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-white/30 block">{s.bgLabel}</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 bg-white/5 border border-white/5 py-3 px-4 text-[9px] outline-none cursor-pointer"
                />
                {previewUrl && (
                  <div className="w-20 h-20 border border-white/10 rounded overflow-hidden">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black px-12 py-4 text-[9px] font-bold uppercase tracking-widest hover:bg-gray-50 transition disabled:opacity-40"
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

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="font-sync text-xl tracking-tighter uppercase">
            GNC. <span className="text-white/20">Admin</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mt-1">{s.console}</p>
        </div>
        <div>
          <Link
            to="/"
            className="text-[9px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition mr-2 inline-block"
          >
            {s.back}
          </Link>
          <button
            onClick={handleLogout}
            className="text-[9px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition"
          >
            {s.logout}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <HeroSettingsSection />
        <EnergyVideoUpload />
        <AdminScheduleUpload />
        <AdminMomentsPanel />
        <AdminBriefingUpload />

        <div className="space-y-12">
          <MemberSection collectionName="crew" heading={s.members.manageCrew} entityName="Crew" />
          <MemberSection collectionName="staff" heading={s.members.manageStaff} entityName="Staff" />
        </div>
      </main>
    </div>
  );
}
