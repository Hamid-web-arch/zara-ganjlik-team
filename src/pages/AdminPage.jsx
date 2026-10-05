import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { IMGBB_API_KEY } from "../lib/config";
import { validateImageFile } from "../lib/fileValidation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import MemberSection from "../components/MemberSection";
import AdminMomentsPanel from "../components/AdminMomentsPanel";
import AdminScheduleUpload from "../components/AdminScheduleUpload";
import EnergyVideoUpload from "../components/EnergyVideoUpload";
import AdminBriefingUpload from "../components/AdminBriefingUpload";

function HeroSettingsSection() {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "hero"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || "");
          if (data.image) {
            setImageUrl(data.image);
            setPreviewUrl(data.image);
          }
        }
      } catch (error) {
        console.error("Hero məlumat gətirilərkən xəta:", error);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const validationError = validateImageFile(selected);
    if (validationError) {
      alert(validationError);
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
        const formData = new FormData();
        formData.append("image", file);
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body: formData,
        });
        const imgData = await resp.json();
        if (imgData.success) finalImageUrl = imgData.data.url;
      }

      await setDoc(doc(db, "settings", "hero"), {
        title: title.trim() || "Gandjlik 6615",
        image: finalImageUrl,
        updatedAt: serverTimestamp(),
      });

      setImageUrl(finalImageUrl);
      setFile(null);
      alert("Ana səhifə uğurla yeniləndi!");
    } catch (err) {
      console.error("Hero update xətası:", err);
      alert("Yenilənmə alınmadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-16">
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-[20px] uppercase tracking-widest text-white font-bold">Hero Section Ayarları</h2>
      </div>

      <div className="glass p-8 rounded-sm mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-white/30 block">Başlıq Yazısı</label>
              <input
                type="text"
                placeholder="Məsələn: GANDJLIK 6615"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[10px] tracking-widest outline-none focus:border-white transition-all text-white"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[9px] uppercase tracking-widest text-white/30 block">Arxa Fon Şəkli</label>
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
            {saving ? "UPDATING..." : "Yadda Saxla və Yenilə"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { authorized } = useAuthGuard({ requireAdmin: true });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Logout xətası:", error);
    }
  };

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[9999]">
        <p className="font-sync text-[10px] tracking-[0.5em] uppercase text-white animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="font-sync text-xl tracking-tighter uppercase">
            GNC. <span className="text-white/20">Admin</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mt-1">Management Console</p>
        </div>
        <div>
          <Link
            to="/"
            className="text-[9px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition mr-2 inline-block"
          >
            Back
          </Link>
          <button
            onClick={handleLogout}
            className="text-[9px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition"
          >
            Logout
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
          <MemberSection collectionName="crew" heading="MANAGE CREW" entityName="Crew" />
          <MemberSection collectionName="staff" heading="MANAGE STAFF" entityName="Staff" />
        </div>
      </main>
    </div>
  );
}
