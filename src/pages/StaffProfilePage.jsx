import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { IMGBB_API_KEY } from "../lib/config";
import { validateImageFile } from "../lib/fileValidation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import StaffSchedule from "../components/StaffSchedule";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { profile: authProfile, collectionName } = useAuthGuard();
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Local, editable copy of the auth-resolved profile — handleUpload below mutates it
  // optimistically after a successful image upload, which the hook's own value can't do.
  useEffect(() => {
    if (authProfile) setProfile(authProfile);
  }, [authProfile]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!collectionName || !profile) {
      alert("Sistem hələ hazır deyil, bir az gözləyin...");
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      e.target.value = "";
      return;
    }

    // No "uploading, please wait" alert here: alert() is blocking, so firing it before
    // the fetch call only delayed the upload until the user dismissed the dialog.
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const result = await resp.json();

      if (result.success) {
        const imageUrl = result.data.url;
        await updateDoc(doc(db, collectionName, profile.uid), { image: imageUrl });
        setProfile((prev) => ({ ...prev, image: imageUrl }));
        alert("Şəkil uğurla yeniləndi!");
      } else {
        alert("ImgBB xətası: " + (result.error ? result.error.message : "Naməlum xəta"));
      }
    } catch (error) {
      console.error("Xəta detalları:", error);
      alert("Şəkil yüklənmədi. Konsola (F12) baxın.");
    } finally {
      setUploading(false);
    }
  };

  const handleResetPassword = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Şifrəni dəyişmək üçün email ünvanınıza link göndərildi.");
    } catch (error) {
      console.error("Şifrə sıfırlama xətası:", error);
      alert("Link göndərilmədi. Bir az sonra yenidən cəhd edin.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
      alert("Çıxış edilərkən xəta baş verdi.");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto p-8 pt-20">
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-fashion text-4xl text-white tracking-tighter">MY PROFILE</h1>
          <div className="flex gap-4">
            <div>
              <Link
                to="/"
                className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition inline-block"
              >
                Back to Home
              </Link>
              <button
                onClick={handleLogout}
                className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-10 rounded-sm flex flex-col md:flex-row items-center gap-10 border border-white/10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
              <img
                src={profile?.image || DEFAULT_AVATAR}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Profile"
              />
            </div>
            <label className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition">
              <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
              <span className="text-[8px] font-bold">EDIT</span>
            </label>
          </div>

          <div className="flex-1 w-full space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">Full Name</label>
                <p className="text-sm tracking-widest mt-1">{profile ? profile.name || "N/A" : "Loading..."}</p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">Role</label>
                <p className="text-sm tracking-widest mt-1 uppercase">
                  {profile ? profile.role || "N/A" : "Loading..."}
                </p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">ID Code</label>
                <p className="text-sm tracking-widest mt-1">{profile ? profile.idCode || "-" : "Loading..."}</p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">Email</label>
                <p className="text-sm tracking-widest mt-1">
                  {profile ? profile.email || profile.authEmail : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {profile && <StaffSchedule employeeName={profile.name} />}

        <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-sm">
          <h2 className="text-[10px] uppercase tracking-[0.3em] mb-6">Security Settings</h2>
          <button
            onClick={handleResetPassword}
            className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
