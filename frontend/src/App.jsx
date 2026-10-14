import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrandProvider } from "./context/BrandContext";
import { dashboardPath } from "./lib/dashboardPath";
import AuthPage from "./pages/AuthPage";
import SuperadminRegisterPage from "./pages/SuperadminRegisterPage";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import SuperadminPlansPage from "./pages/SuperadminPlansPage";
import SuperadminVendorsPage from "./pages/SuperadminVendorsPage";
import SuperadminPaymentsPage from "./pages/SuperadminPaymentsPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorPlansPage from "./pages/VendorPlansPage";
import VendorInvoicesPage from "./pages/VendorInvoicesPage";
import VendorInvoicePage from "./pages/VendorInvoicePage";
import VendorProfilePage from "./pages/VendorProfilePage";
import SuperadminBrandPage from "./pages/SuperadminBrandPage";

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center text-sm tracking-wide text-ink/60">
      Loading account…
    </div>
  );
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}

function RequireRole({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}

function RoleHome() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={dashboardPath(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrandProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestOnly><AuthPage /></GuestOnly>} />
          <Route path="/admin/register" element={<SuperadminRegisterPage />} />
          <Route path="/admin" element={<RequireRole role="SUPERADMIN"><SuperadminDashboard /></RequireRole>} />
          <Route path="/admin/plans" element={<RequireRole role="SUPERADMIN"><SuperadminPlansPage /></RequireRole>} />
          <Route path="/admin/vendors" element={<RequireRole role="SUPERADMIN"><SuperadminVendorsPage /></RequireRole>} />
          <Route path="/admin/payments" element={<RequireRole role="SUPERADMIN"><SuperadminPaymentsPage /></RequireRole>} />
          <Route path="/admin/brand" element={<RequireRole role="SUPERADMIN"><SuperadminBrandPage /></RequireRole>} />
          <Route path="/vendor" element={<RequireRole role="VENDOR"><VendorDashboard /></RequireRole>} />
          <Route path="/vendor/plans" element={<RequireRole role="VENDOR"><VendorPlansPage /></RequireRole>} />
          <Route path="/vendor/invoices" element={<RequireRole role="VENDOR"><VendorInvoicesPage /></RequireRole>} />
          <Route path="/vendor/invoices/:invoiceId" element={<RequireRole role="VENDOR"><VendorInvoicePage /></RequireRole>} />
          <Route path="/vendor/profile" element={<RequireRole role="VENDOR"><VendorProfilePage /></RequireRole>} />
          <Route path="/account" element={<RoleHome />} />
          <Route path="*" element={<RoleHome />} />
        </Routes>
      </BrowserRouter>
      </BrandProvider>
    </AuthProvider>
  );
}
