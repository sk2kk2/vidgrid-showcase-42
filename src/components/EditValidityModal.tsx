import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock } from "lucide-react";
import { Video } from "@/types/television";

interface EditValidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newExpirationDays: number) => void;
  video: Video | null;
  backendUrl: string;
}

export const EditValidityModal = ({ isOpen, onClose, onConfirm, video, backendUrl }: EditValidityModalProps) => {
  const [newExpirationDays, setNewExpirationDays] = useState<string>('');

  const handleConfirm = () => {
    const days = parseInt(newExpirationDays);
    if (days > 0) {
      onConfirm(days);
      onClose();
    }
  };

  const isValid = newExpirationDays && parseInt(newExpirationDays) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Editar Prazo de Validade
          </DialogTitle>
          <DialogDescription>
            Atualize o prazo de validade do vídeo "{video?.filename}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-expiration">Validade atual</Label>
            <div className="p-2 bg-muted rounded text-sm">
              {video?.expirationDays !== undefined ? (
                video.expirationDays <= 0 ? (
                  <span className="text-red-500 font-medium">Expirado</span>
                ) : (
                  <span>{video.expirationDays} dias restantes</span>
                )
              ) : (
                <span className="text-muted-foreground">Sem validade definida</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-expiration">Nova validade (dias)</Label>
            <Input
              id="new-expiration"
              type="number"
              min="1"
              max="365"
              value={newExpirationDays}
              onChange={(e) => setNewExpirationDays(e.target.value)}
              placeholder="Ex: 30"
            />
            <p className="text-xs text-muted-foreground">
              O vídeo ficará válido por {newExpirationDays || "0"} dias a partir de hoje
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              <Calendar className="h-4 w-4 mr-2" />
              Atualizar Validade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};