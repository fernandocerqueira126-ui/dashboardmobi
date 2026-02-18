import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { ColaboradoresProvider } from "@/contexts/ColaboradoresContext";
import { AgendaProvider } from "@/contexts/AgendaContext";
import { FinanceiroProvider } from "@/contexts/FinanceiroContext";
import { AtendimentosProvider } from "@/contexts/AtendimentosContext";
import Index from "./pages/Index";
import LeadsCRM from "./pages/LeadsCRM";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Colaboradores from "./pages/Colaboradores";
import Atendimentos from "./pages/Atendimentos";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Automacao from "./pages/Automacao";
import Notificacoes from "./pages/Notificacoes";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <NotificationsProvider>
                    <ColaboradoresProvider>
                      <LeadsProvider>
                        <AgendaProvider>
                          <FinanceiroProvider>
                            <AtendimentosProvider>
                              <MainLayout>
                                <Routes>
                                  <Route path="/" element={<Index />} />
                                  <Route path="/leads" element={<LeadsCRM />} />
                                  <Route path="/agenda" element={<Agenda />} />
                                  <Route path="/clientes" element={<Clientes />} />
                                  <Route path="/colaboradores" element={<Colaboradores />} />
                                  <Route path="/atendimentos" element={<Atendimentos />} />
                                  <Route path="/financeiro" element={<Financeiro />} />
                                  <Route path="/relatorios" element={<Relatorios />} />
                                  <Route path="/automacao" element={<Automacao />} />
                                  <Route path="/notificacoes" element={<Notificacoes />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </MainLayout>
                            </AtendimentosProvider>
                          </FinanceiroProvider>
                        </AgendaProvider>
                      </LeadsProvider>
                    </ColaboradoresProvider>
                  </NotificationsProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
