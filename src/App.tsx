import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationsProvider>
        <ColaboradoresProvider>
          <LeadsProvider>
            <AgendaProvider>
              <FinanceiroProvider>
                <AtendimentosProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
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
                  </BrowserRouter>
                </AtendimentosProvider>
              </FinanceiroProvider>
            </AgendaProvider>
          </LeadsProvider>
        </ColaboradoresProvider>
      </NotificationsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
