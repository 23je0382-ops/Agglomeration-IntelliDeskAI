import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketQueue from './pages/TicketQueue';
import TicketDetail from './pages/TicketDetail';
import KnowledgeBase from './pages/KnowledgeBase';
import Analytics from './pages/Analytics';

import EmailInbox from './pages/EmailInbox';
import EmailInboxMongo from './pages/EmailInboxMongo';
import CustomerManagement from './pages/CustomerManagement';
import SalesOutreach from './pages/SalesOutreach';
import Organizations from './pages/Organizations';
import OrganizationDetail from './pages/OrganizationDetail';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--neon-cyan)]"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketQueue /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/emails" element={<ProtectedRoute><EmailInbox /></ProtectedRoute>} />
            <Route path="/emails-mongo" element={<ProtectedRoute><EmailInboxMongo /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesOutreach /></ProtectedRoute>} />
            <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
            <Route path="/organizations/:id" element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
