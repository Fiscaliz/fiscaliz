import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { } from 'react-router-dom'; // ensure types are loaded
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import NewAction from "./pages/NewAction";
import EstablishmentEntry from "./pages/NewAction/EstablishmentEntry";
import DocumentTypeSelection from "./pages/NewAction/DocumentTypeSelection";
import CreateDocument from "./pages/NewAction/CreateDocument";
import InternalActivitySelection from "./pages/NewAction/InternalActivitySelection";
import CreateRA from "./pages/NewAction/CreateRA";
import PFESelection from "./pages/NewAction/PFESelection";
import MonthlyReport from "./pages/MonthlyReport";
import MonthlyReports from "./pages/MonthlyReports";
import DocumentDetail from "./pages/DocumentDetail";
import Documents from "./pages/Documents";
import PDFRedirect from "./pages/PDFRedirect";
import ConsultAI from "./pages/ConsultAI";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/tarefas" element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/perfil/editar" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao" element={
              <ProtectedRoute>
                <NewAction />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/estabelecimento" element={
              <ProtectedRoute>
                <EstablishmentEntry />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/tipo-documento" element={
              <ProtectedRoute>
                <DocumentTypeSelection />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/criar-documento" element={
              <ProtectedRoute>
                <CreateDocument />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/atividade-interna" element={
              <ProtectedRoute>
                <InternalActivitySelection />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/criar-ra" element={
              <ProtectedRoute>
                <CreateRA />
              </ProtectedRoute>
            } />
            <Route path="/nova-acao/pfe" element={
              <ProtectedRoute>
                <PFESelection />
              </ProtectedRoute>
            } />
            <Route path="/relatorio-mensal" element={
              <ProtectedRoute>
                <MonthlyReport />
              </ProtectedRoute>
            } />
            <Route path="/relatorios-mensais" element={
              <ProtectedRoute>
                <MonthlyReports />
              </ProtectedRoute>
            } />
            <Route path="/documento/:id" element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            } />
            <Route path="/documentos" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            
            <Route path="/consultar-ia" element={
              <ProtectedRoute>
                <ConsultAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } />
            {/* Public PDF redirect route - no auth required */}
            <Route path="/pdf/:fileName" element={<PDFRedirect />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
