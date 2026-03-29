import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import FollowUpsPage from './pages/FollowUpsPage';
import InteractionsPage from './pages/InteractionsPage';
import ProspectsPage from './pages/ProspectsPage';
import BillQuotationPage from './pages/BillQuotationPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import EmployeesPage from './pages/EmployeesPage';
import DistributionPage from './pages/DistributionPage';
import CampaignsPage from './pages/CampaignsPage';

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
            <Route path="followups" element={<FollowUpsPage />} />
            <Route path="interactions" element={<InteractionsPage />} />
            <Route path="service-management" element={<ProspectsPage />} />
            <Route path="prospects" element={<Navigate to="/service-management" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="distribution" element={<DistributionPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
