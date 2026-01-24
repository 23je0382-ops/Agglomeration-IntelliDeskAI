import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateTicket />} />
            <Route path="/tickets" element={<TicketQueue />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/emails" element={<EmailInbox />} />
            <Route path="/emails-mongo" element={<EmailInboxMongo />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/sales" element={<SalesOutreach />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
