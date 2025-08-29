import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock } from "lucide-react";

interface ValidityPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (prazoValidade: string) => void;
  fileCount: number;
}

export const ValidityPeriodModal = ({ isOpen, onClose, onConfirm, fileCount }: ValidityPeriodModalProps) => {
  const [prazoValidade, setPrazoValidade] = useState<string>('30');
  const [tipoValidade, setTipoValidade] = useState<'dias' | 'data'>('dias');
  const [dataValidade, setDataValidade] = useState<string>('');

  const handleConfirm = () => {
    const prazoParaEnvio = tipoValidade === 'dias' ? prazoValidade : dataValidade;
    
    if (!prazoParaEnvio) {
      return;
    }
    
    onConfirm(prazoParaEnvio);
    onClose();
  };

  const isValid = tipoValidade === 'dias' ? prazoValidade : dataValidade;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Definir Prazo de Validade
          </DialogTitle>
          <DialogDescription>
            Defina por quanto tempo {fileCount === 1 ? 'o vídeo' : `os ${fileCount} vídeos`} {fileCount === 1 ? 'ficará' : 'ficarão'} disponível{fileCount === 1 ? '' : 'eis'} para visualização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dias"
                checked={tipoValidade === 'dias'}
                onChange={(e) => setTipoValidade(e.target.value as 'dias')}
              />
              Número de dias
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="data"
                checked={tipoValidade === 'data'}
                onChange={(e) => setTipoValidade(e.target.value as 'data')}
              />
              Data específica
            </label>
          </div>

          {tipoValidade === 'dias' ? (
            <div className="space-y-2">
              <Label htmlFor="prazo-dias">Válido por quantos dias?</Label>
              <Input
                id="prazo-dias"
                type="number"
                min="1"
                max="365"
                value={prazoValidade}
                onChange={(e) => setPrazoValidade(e.target.value)}
                placeholder="Ex: 30"
              />
              <p className="text-xs text-muted-foreground">
                {fileCount === 1 ? 'O vídeo será' : 'Os vídeos serão'} válido{fileCount === 1 ? '' : 's'} por {prazoValidade} dias a partir de hoje
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="data-validade">Data de expiração</Label>
              <Input
                id="data-validade"
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              <Calendar className="h-4 w-4 mr-2" />
              Confirmar e Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};