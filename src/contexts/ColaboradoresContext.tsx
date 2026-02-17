import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Colaborador {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    cargo: string | null;
    status: 'ativo' | 'inativo';
    timestamp?: string;
}

interface ColaboradoresContextType {
    colaboradores: Colaborador[];
    isLoading: boolean;
    addColaborador: (data: Omit<Colaborador, "id">) => Promise<void>;
    updateColaborador: (id: string, data: Partial<Colaborador>) => Promise<void>;
    deleteColaborador: (id: string) => Promise<void>;
    toggleStatus: (id: string) => Promise<void>;
    refreshColaboradores: () => Promise<void>;
}

const ColaboradoresContext = createContext<ColaboradoresContextType | undefined>(undefined);

// Helper to map DB row to UI model
const mapRowToColaborador = (row: any): Colaborador => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    cargo: row.cargo,
    status: (row.status as 'ativo' | 'inativo') || 'ativo',
    timestamp: row.created_at
});

export function ColaboradoresProvider({ children }: { children: ReactNode }) {
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchColaboradores = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('colaboradores')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;

            setColaboradores((data || []).map(mapRowToColaborador));
        } catch (error) {
            console.error("Erro ao buscar colaboradores:", error);
            toast.error("Erro ao carregar equipe.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchColaboradores();
    }, []);

    const addColaborador = async (data: Omit<Colaborador, "id">) => {
        try {
            const { data: newColab, error } = await supabase
                .from('colaboradores')
                .insert([{
                    nome: data.nome,
                    email: data.email,
                    telefone: data.telefone,
                    cargo: data.cargo,
                    status: data.status
                }])
                .select()
                .single();

            if (error) throw error;
            if (newColab) {
                setColaboradores(prev => [...prev, mapRowToColaborador(newColab)]);
                toast.success("Colaborador adicionado!");
            }
        } catch (error) {
            console.error("Erro ao adicionar colaborador:", error);
            toast.error("Erro ao salvar colaborador.");
        }
    };

    const updateColaborador = async (id: string, data: Partial<Colaborador>) => {
        try {
            const updates: any = {};
            if (data.nome !== undefined) updates.nome = data.nome;
            if (data.email !== undefined) updates.email = data.email;
            if (data.telefone !== undefined) updates.telefone = data.telefone;
            if (data.cargo !== undefined) updates.cargo = data.cargo;
            if (data.status !== undefined) updates.status = data.status;

            const { error } = await supabase
                .from('colaboradores')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            setColaboradores(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
            toast.success("Dados atualizados.");
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error);
            toast.error("Erro ao atualizar dados.");
        }
    };

    const deleteColaborador = async (id: string) => {
        try {
            const { error } = await supabase
                .from('colaboradores')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setColaboradores(prev => prev.filter(c => c.id !== id));
            toast.success("Colaborador removido.");
        } catch (error) {
            console.error("Erro ao remover colaborador:", error);
            toast.error("Erro ao excluir colaborador.");
        }
    };

    const toggleStatus = async (id: string) => {
        const colaborador = colaboradores.find(c => c.id === id);
        if (!colaborador) return;

        const newStatus = colaborador.status === 'ativo' ? 'inativo' : 'ativo';
        await updateColaborador(id, { status: newStatus });
    };

    return (
        <ColaboradoresContext.Provider
            value={{
                colaboradores,
                isLoading,
                addColaborador,
                updateColaborador,
                deleteColaborador,
                toggleStatus,
                refreshColaboradores: fetchColaboradores
            }}
        >
            {children}
        </ColaboradoresContext.Provider>
    );
}

export function useColaboradores() {
    const context = useContext(ColaboradoresContext);
    if (context === undefined) {
        throw new Error("useColaboradores must be used within a ColaboradoresProvider");
    }
    return context;
}
