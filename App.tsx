import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Lazily load page components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InvoiceListPage = lazy(() => import('./pages/invoices/InvoiceListPage'));
const InvoiceFormPage = lazy(() => import('./pages/invoices/InvoiceFormPage'));
const InvoicePdfViewPage = lazy(() => import('./pages/invoices/InvoicePdfViewPage'));
const ClientListPage = lazy(() => import('./pages/clients/ClientListPage'));
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense 
          fallback={
            <div className="flex h-screen justify-center items-center p-6 bg-gray-100">
              <LoadingSpinner size={12} />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* PDF View route outside main Layout but still protected */}
            <Route 
              path="/invoices/:id/view"
              element={
                <PrivateRoute>
                  <InvoicePdfViewPage />
                </PrivateRoute>
              }
            />
            
            {/* All other routes are protected and within the main Layout */}
            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/invoices" element={<InvoiceListPage />} />
                    <Route path="/invoices/new" element={<InvoiceFormPage />} />
                    <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
                    <Route path="/clients" element={<ClientListPage />} />
                    <Route path="/clients/new" element={<ClientFormPage />} />
                    <Route path="/clients/:id/edit" element={<ClientFormPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }/>
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
