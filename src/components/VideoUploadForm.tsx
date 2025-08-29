import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileVideo, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ValidityPeriodModal } from "./ValidityPeriodModal";

interface VideoUploadFormProps {
  backendUrl: string;
  onUploadSuccess?: (result: any) => void;
  onClose?: () => void;
}

export const VideoUploadForm = ({ backendUrl, onUploadSuccess, onClose }: VideoUploadFormProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showValidityModal, setShowValidityModal] = useState(false);
  const [currentPrazoValidade, setCurrentPrazoValidade] = useState<string>('');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.includes("mp4") || file.name.toLowerCase().endsWith(".mp4")
    );
    
    const invalidFiles = files.filter(file => 
      !file.type.includes("mp4") && !file.name.toLowerCase().endsWith(".mp4")
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalidFiles.length} arquivo(s) ignorado(s). Apenas arquivos .mp4 são aceitos.`,
        variant: "destructive"
      });
    }
    
    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um vídeo para upload",
        variant: "destructive"
      });
      return;
    }

    // Mostrar modal para escolher prazo de validade
    setShowValidityModal(true);
  };

  const handleValidityConfirm = async (prazoValidade: string) => {
    setCurrentPrazoValidade(prazoValidade);
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('video', file);
          formData.append('prazoValidade', prazoValidade);

          const response = await fetch(`${backendUrl}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload falhou para ${file.name}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(`Erro no servidor para ${file.name}`);
          }

          successCount++;
          
          if (onUploadSuccess) {
            onUploadSuccess(result);
          }

        } catch (error) {
          console.error(`Erro no upload de ${file.name}:`, error);
          errorCount++;
        }
      }

      // Mostrar feedback final
      if (successCount === selectedFiles.length) {
        toast({
          title: "Upload concluído",
          description: `${successCount} vídeo(s) enviados com sucesso e XML gerado automaticamente.`
        });
        
        // Limpar formulário
        setSelectedFiles([]);
        setCurrentPrazoValidade('');
        
        if (onClose) {
          onClose();
        }
      } else if (successCount > 0) {
        toast({
          title: "Upload parcialmente concluído",
          description: `${successCount} de ${selectedFiles.length} vídeos enviados com sucesso.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro no upload",
          description: "Nenhum vídeo foi enviado com sucesso.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erro geral no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Erro inesperado durante o upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-6 w-6" />
              Upload de Vídeos
            </CardTitle>
            <CardDescription>
              Envie seus vídeos e defina o prazo de validade. Um arquivo XML será gerado automaticamente.
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de arquivos */}
          <div className="space-y-2">
            <Label htmlFor="video-files">Selecionar Vídeos (.mp4)</Label>
            <Input
              id="video-files"
              type="file"
              accept=".mp4,video/mp4"
              multiple
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {/* Lista de arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileVideo className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nota sobre prazo de validade */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Prazo de Validade</h4>
            <p className="text-xs text-muted-foreground">
              Após selecionar os vídeos e clicar em enviar, você poderá definir o prazo de validade antes do upload começar.
            </p>
          </div>

          {/* Botão de submit */}
          <Button
            type="submit"
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Upload className="h-5 w-5 mr-2 animate-spin" />
                Enviando {selectedFiles.length} vídeo(s)...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Enviar {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Vídeo(s)
              </>
            )}
          </Button>

          {/* Informação sobre XML */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Geração Automática de XML</h4>
            <p className="text-xs text-muted-foreground">
              Para cada vídeo enviado, será criado automaticamente um arquivo XML com os metadados:
              nome do arquivo, data de envio e prazo de validade.
            </p>
          </div>
        </form>
      </CardContent>

      {/* Modal de prazo de validade */}
      <ValidityPeriodModal
        isOpen={showValidityModal}
        onClose={() => setShowValidityModal(false)}
        onConfirm={handleValidityConfirm}
        fileCount={selectedFiles.length}
      />
    </Card>
  );
};