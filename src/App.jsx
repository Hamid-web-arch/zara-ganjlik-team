import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ForcePasswordResetPage = lazy(() => import("./pages/ForcePasswordResetPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const StaffProfilePage = lazy(() => import("./pages/StaffProfilePage"));
const MomentsPage = lazy(() => import("./pages/MomentsPage"));
const BriefingsPage = lazy(() => import("./pages/BriefingsPage"));
const BriefingDetailPage = lazy(() => import("./pages/BriefingDetailPage"));

function App() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/staff-profile" element={<StaffProfilePage />} />
        <Route path="/moments" element={<MomentsPage />} />
        <Route path="/briefings" element={<BriefingsPage />} />
        <Route path="/briefings/:id" element={<BriefingDetailPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
