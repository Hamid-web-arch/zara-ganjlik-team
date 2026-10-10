import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateMember, uploadToCloudinary, forgotPassword, changePassword } from "../lib/api";
import { validateImageFile } from "../lib/fileValidation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAuth } from "../lib/authState";
import StaffSchedule from "../components/StaffSchedule";
import StaffTrainings from "../components/StaffTrainings";
import { useLanguage } from "../lib/i18n/languageContext";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const s = t.staffProfile;
  const { profile: authProfile, collectionName } = useAuthGuard();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Local, editable copy of the auth-resolved profile — handleUpload below mutates it
  // optimistically after a successful image upload, which the hook's own value can't do.
  useEffect(() => {
    if (authProfile) setProfile(authProfile);
  }, [authProfile]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!collectionName || !profile) {
      notify(s.notify.notReady);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      notify(validationError);
      e.target.value = "";
      return;
    }

    // No "uploading, please wait" notice here: the upload starts immediately and the
    // input is disabled while it runs.
    setUploading(true);

    try {
      const imageUrl = await uploadToCloudinary(file, "avatar");
      await updateMember(collectionName, profile.uid, { image: imageUrl });
      setProfile((prev) => ({ ...prev, image: imageUrl }));
      notify(s.notify.imageUpdated);
    } catch (error) {
      console.error("Xəta detalları:", error);
      notify(s.notify.imageFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    try {
      await forgotPassword(profile.email);
      notify(s.notify.resetSent);
    } catch (error) {
      console.error("Şifrə sıfırlama xətası:", error);
      notify(s.notify.resetFailed);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return notify(s.notify.tooShort);
    if (newPassword !== confirmPassword) return notify(s.notify.mismatch);

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      notify(s.notify.passwordChanged);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      notify(error.message || s.notify.passwordChangeFailed);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
      notify(s.notify.logoutFailed);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto p-8 pt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <h1 className="font-fashion text-4xl text-white tracking-tighter">{s.myProfile}</h1>
          <div className="flex gap-3">
            <Link
              to="/"
              className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition inline-block"
            >
              {s.backHome}
            </Link>
            <button
              onClick={handleLogout}
              className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
            >
              {s.logout}
            </button>
          </div>
        </div>

        <div className="glass-card p-10 rounded-sm flex flex-col md:flex-row items-center gap-10 border border-white/10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
              <img
                src={profile?.image || DEFAULT_AVATAR}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={s.myProfile}
              />
            </div>
            {/* Visible by default — :hover doesn't exist on touch, so gating this on
                hover alone (as before) made it undiscoverable on mobile. */}
            <label className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
              <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
              <span className="text-[8px] font-bold">{s.edit}</span>
            </label>
          </div>

          <div className="flex-1 w-full space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">{s.fullName}</label>
                <p className="text-sm tracking-widest mt-1">
                  {profile ? profile.name || "N/A" : t.common.loading}
                </p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">{s.role}</label>
                <p className="text-sm tracking-widest mt-1 uppercase">
                  {profile ? profile.role || "N/A" : t.common.loading}
                </p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">{s.idCode}</label>
                <p className="text-sm tracking-widest mt-1">
                  {profile ? profile.idCode || "-" : t.common.loading}
                </p>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/40">{s.email}</label>
                <p className="text-sm tracking-widest mt-1">
                  {profile ? profile.email : t.common.loading}
                </p>
              </div>
            </div>
          </div>
        </div>

        {profile && <StaffSchedule employeeName={profile.name} />}
        {profile && <StaffTrainings />}

        <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-sm space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] mb-6">{s.security}</h2>

          {!showChangePassword ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
              >
                {s.changePassword}
              </button>
              <button
                onClick={handleResetPassword}
                className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
              >
                {s.resetPassword}
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-sm">
              <input
                type="password"
                placeholder={s.currentPasswordPh}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[11px] tracking-[0.2em] outline-none focus:border-white placeholder:text-white/30"
              />
              <input
                type="password"
                placeholder={s.newPasswordPh}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[11px] tracking-[0.2em] outline-none focus:border-white placeholder:text-white/30"
              />
              <input
                type="password"
                placeholder={s.confirmPasswordPh}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[11px] tracking-[0.2em] outline-none focus:border-white placeholder:text-white/30"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="text-[9px] uppercase tracking-[0.3em] bg-white text-black px-6 py-3 hover:bg-gray-200 transition disabled:opacity-40"
                >
                  {changingPassword ? s.changing : s.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="text-[9px] uppercase tracking-[0.3em] border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
