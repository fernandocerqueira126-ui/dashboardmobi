import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLeads } from "@/contexts/LeadsContext";
import {
  FileText,
  Search,
  Sparkles,
  ArrowLeft,
  Home,
  DollarSign,
  Loader2,
  User,
  Phone,
  Copy,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface LeadData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  value: number | null;
  linkImovelInteresse?: string | null;
}

interface ImovelResult {
  id: string;
  content: string;
  metadata: {
    referencia?: string;
    valor?: string;
    link_imagem?: string;
    source?: string;
  };
}

export default function Proposta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, isLoading: isLoadingAllLeads } = useLeads();

  const [lead, setLead] = useState<LeadData | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(!!id);

  // RAG search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ImovelResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImovel, setSelectedImovel] = useState<ImovelResult | null>(null);

  // Gemini state
  const [instructions, setInstructions] = useState("");
  const [minuta, setMinuta] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load lead data from context when ID changes
  useEffect(() => {
    if (!id) {
      setLead(null);
      setIsLoadingLead(false);
      return;
    }
    
    const found = leads.find(l => l.id === id);
    if (found) {
      setLead({
        id: found.id,
        name: found.name,
        phone: found.phone,
        email: found.email,
        value: found.value,
        linkImovelInteresse: found.linkImovelInteresse
      });
      setIsLoadingLead(false);
    } else if (!isLoadingAllLeads) {
      // If not in context and loaded, fetch from DB
      (async () => {
        setIsLoadingLead(true);
        const { data, error } = await supabase
          .from("leads")
          .select("id, name, phone, email, value, link_imovel_interesse")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast.error("Lead não encontrado.");
          navigate("/proposta");
          return;
        }
        setLead({
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          value: data.value,
          linkImovelInteresse: data.link_imovel_interesse
        });
        setIsLoadingLead(false);
      })();
    }
  }, [id, leads, isLoadingAllLeads, navigate]);

  // RAG search — Real database search in imobiliaria_rag
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      
      // Real RAG search combining text content and metadata referencia
      const { data, error } = await supabase
        .from("imobiliaria_rag")
        .select("id, content, metadata")
        .or(`content.ilike.%${searchQuery}%,metadata->>referencia.ilike.%${searchQuery}%`)
        .limit(8);
        
      if (!error && data) {
        setSearchResults(data as any as ImovelResult[]);
      }
      setIsSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGenerateMinuta = async () => {
    if (!lead) {
      toast.error("Selecione um lead primeiro.");
      return;
    }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      toast.error("Serviço de IA (Groq) não configurado.");
      return;
    }

    setIsGenerating(true);
    setMinuta("");

    const imovelInfo = selectedImovel
      ? `Imóvel selecionado: Referência ${selectedImovel.metadata.referencia || "N/A"} — Valor: ${selectedImovel.metadata.valor || "Sob consulta"}\nDescrição: ${selectedImovel.content}`
      : lead.linkImovelInteresse
      ? `Imóvel de interesse original: Referência ${lead.linkImovelInteresse}`
      : "O imóvel será definido em conjunto com o cliente durante o atendimento.";

    const userData = `DADOS DO CLIENTE:
- Nome: ${lead.name}
- Contato: ${lead.phone || "Não informado"}
- Disponibilidade financeira estimada: ${lead.value ? Number(lead.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Não informada"}

DADOS DO IMÓVEL:
${imovelInfo}

INSTRUÇÕES DO CORRETOR: 
${instructions || "Crie uma proposta comercial persuasiva e profissional."}`;

    try {
      const body = {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você é um assistente de corretagem de imóveis de elite. Use os dados do imóvel (Referência, Valor, Descrição) e as instruções do corretor para criar uma proposta comercial formal, persuasiva e bem formatada em Markdown em português brasileiro."
          },
          {
            role: "user",
            content: userData
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      };

      console.log('Payload Groq:', JSON.stringify(body, null, 2));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Groq error detail:", errorData);
        throw new Error(`Status: ${response.status}`);
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content ?? "";

      if (!text) throw new Error("Resposta vazia da Groq.");

      setMinuta(text);
      toast.success("Proposta Groq-AI gerada com sucesso!");
    } catch (error) {
      console.error("Groq error:", error);
      toast.error("Erro ao gerar proposta via Groq. Veja o console para detalhes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMinuta = () => {
    navigator.clipboard.writeText(minuta);
    toast.success("Proposta copiada!");
  };

  const currentLeadName = lead ? lead.name : "Selecione um Lead";

  if (isLoadingLead && id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Fluxo de Proposta"
        subtitle={lead ? `Compondo para ${lead.name}` : "Selecione um lead para começar"}
        icon={<FileText className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/leads")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao CRM
          </Button>

          {/* Lead Selection / Info Card */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lead Beneficiário
              </p>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-[10px] h-7 px-2">
                    {lead ? "Trocar Lead" : "Selecionar Lead"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px] max-h-[300px] overflow-y-auto">
                  {leads.map(l => (
                    <DropdownMenuItem 
                      key={l.id} 
                      onClick={() => navigate(`/proposta/${l.id}`)}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span className="font-medium text-sm">{l.name}</span>
                      <span className="text-[10px] text-muted-foreground">{l.phone || "Sem telefone"}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {lead ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-bold text-sm shrink-0">
                  {lead.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {lead.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {lead.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        <Phone className="w-3 h-3 shrink-0" />
                        {lead.phone}
                      </p>
                    )}
                    {lead.value != null && (
                      <p className="text-xs text-warning font-semibold flex items-center gap-1 whitespace-nowrap">
                        <DollarSign className="w-3 h-3" />
                        {Number(lead.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center border-2 border-dashed border-border rounded-lg bg-secondary/30">
                <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Selecione um lead no menu acima para começar</p>
              </div>
            )}
          </div>

          <Separator />

          {/* RAG Property Search */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Home className="w-3.5 h-3.5" />
              Busca em Portfólio (RAG)
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Busque por referência ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Real Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-secondary/50 border border-border rounded-lg overflow-hidden shadow-md">
                {searchResults.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setSelectedImovel(result);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left ${
                      idx < searchResults.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {result.metadata.link_imagem ? (
                        <img src={result.metadata.link_imagem} className="w-full h-full object-cover" alt="imovel" />
                      ) : (
                        <Home className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-primary truncate">
                          Ref: {result.metadata.referencia || "Sem ref"}
                        </p>
                        {result.metadata.valor && (
                          <span className="text-sx font-bold text-warning text-[10px]">
                            {result.metadata.valor}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {result.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Property Badge */}
            {selectedImovel && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Imóvel: {selectedImovel.metadata.referencia}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {selectedImovel.content.substring(0, 100)}...
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => setSelectedImovel(null)}
                >
                  Remover
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* AI Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Inteligência Artificial (Geração)
              </h3>
            </div>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Exemplo: Focar na varanda gourmet. Cliente tem urgência. Sugerir financiamento bancário pela CEF..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="bg-secondary border-border min-h-[96px] resize-none text-sm leading-relaxed"
              />
              
              <Button
                onClick={handleGenerateMinuta}
                disabled={isGenerating || !lead}
                className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 text-white gap-2 border-0 shadow-lg shadow-primary/20"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compondo Proposta...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Proposta Profissional
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Result area */}
          {minuta && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Separator />
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Minuta Gerada
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={handleGenerateMinuta}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={handleCopyMinuta}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </Button>
                </div>
              </div>
              <div className="bg-secondary/40 border border-border rounded-xl p-5 shadow-inner">
                <Textarea
                  value={minuta}
                  onChange={(e) => setMinuta(e.target.value)}
                  className="bg-transparent border-0 p-0 focus-visible:ring-0 text-sm leading-relaxed min-h-[350px] resize-none overflow-y-auto"
                />
              </div>
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}
