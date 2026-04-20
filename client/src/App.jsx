import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const FollowUpsPage = lazy(() => import('./pages/FollowUpsPage'));
const InteractionsPage = lazy(() => import('./pages/InteractionsPage'));
const ProspectsPage = lazy(() => import('./pages/ProspectsPage'));
const BillQuotationPage = lazy(() => import('./pages/BillQuotationPage'));
const SavedQuotationsPage = lazy(() => import('./pages/SavedQuotationsPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const PurchaseHistoryPage = lazy(() => import('./pages/PurchaseHistoryPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const DistributionPage = lazy(() => import('./pages/DistributionPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const WebsiteUsersPage = lazy(() => import('./pages/WebsiteUsersPage'));
const WebsiteOrdersPage = lazy(() => import('./pages/WebsiteOrdersPage'));
const WebsiteBookingsPage = lazy(() => import('./pages/WebsiteBookingsPage'));
const WebsiteContactsPage = lazy(() => import('./pages/WebsiteContactsPage'));

const websiteSyncModulesEnabled = String(import.meta.env.VITE_ENABLE_WEBSITE_SYNC_MODULES || 'true').toLowerCase() !== 'false';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '8px', fontSize: '14px' },
          }}
        />
        <Suspense fallback={<Spinner text="Loading page..." />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="customer-details" element={<CustomerDetailsPage />} />
              <Route path="purchase-history" element={<PurchaseHistoryPage />} />
              <Route path="bill-quotation" element={<BillQuotationPage />} />
              <Route path="saved-quotations" element={<SavedQuotationsPage />} />
              <Route path="followups" element={<FollowUpsPage />} />
              <Route path="interactions" element={<InteractionsPage />} />
              <Route path="service-management" element={<ProspectsPage />} />
              <Route path="prospects" element={<Navigate to="/service-management" replace />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="distribution" element={<DistributionPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              {websiteSyncModulesEnabled && (
                <>
                  <Route path="website-users" element={<WebsiteUsersPage />} />
                  <Route path="website-orders" element={<WebsiteOrdersPage />} />
                  <Route path="website-bookings" element={<WebsiteBookingsPage />} />
                  <Route path="website-contacts" element={<WebsiteContactsPage />} />
                </>
              )}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
