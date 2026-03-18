import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, GripVertical, Pencil, Plus } from "lucide-react";
import { useLeads, Column } from "@/contexts/LeadsContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function SortableItem({ 
  column, 
  onEdit 
}: { 
  column: Column; 
  onEdit: (col: Column) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-secondary/30 border border-border/50 rounded-xl mb-3 shadow-sm group hover:bg-secondary/50">
      <div className="flex items-center gap-3">
        <button className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="font-semibold text-foreground">{column.title}</span>
        {/* We can show lead count here if needed */}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onEdit(column)} className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ConfigKanban() {
  const navigate = useNavigate();
  const { columns, reorderColumns, addColumn, updateColumn, deleteColumn } = useLeads();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Column>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      reorderColumns(arrayMove(columns, oldIndex, newIndex));
      toast.success("Ordem atualizada com sucesso");
    }
  };

  const openAddModal = () => {
    setFormData({
      title: "",
      subtitle: "",
      color: "#3B82F6"
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (column: Column) => {
    setFormData(column);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const saveColumn = () => {
    if (!formData.title) {
      toast.error("O nome da etapa é obrigatório");
      return;
    }

    if (isEditing && formData.id) {
      updateColumn(formData.id, {
        title: formData.title,
        subtitle: formData.subtitle,
        color: formData.color
      });
      toast.success("Etapa atualizada com sucesso");
    } else {
      const newId = formData.title.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
      addColumn({
        id: newId,
        title: formData.title,
        subtitle: formData.subtitle || "",
        color: formData.color || "#3B82F6"
      });
      toast.success("Etapa adicionada com sucesso");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Configuração do Funil"
        subtitle="Gerencie as etapas do seu Kanban"
        icon={
          <Button variant="ghost" size="icon" onClick={() => navigate("/leads")} className="-ml-3 mr-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Etapas</h2>
            <span className="bg-secondary px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
              {columns.length}
            </span>
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar etapa
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={columns.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {columns.map((col) => (
                  <SortableItem key={col.id} column={col} onEdit={openEditModal} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? `Editar etapa em ${formData.title}` : "Nova etapa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Qualificado"
                className="bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.subtitle || ""}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Descrição desta etapa..."
                className="bg-secondary/50 resize-none"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border/50 w-fit">
                <input
                  type="color"
                  value={formData.color || "#3B82F6"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer shrink-0 border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-medium uppercase min-w-[70px]">
                  {formData.color || "#3B82F6"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            {isEditing && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (formData.id) {
                    deleteColumn(formData.id);
                    setIsModalOpen(false);
                    toast.success("Etapa removida");
                  }
                }}
              >
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveColumn}>
                {isEditing ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
