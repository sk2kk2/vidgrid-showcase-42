import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  X, 
  Server, 
  Wifi, 
  WifiOff, 
  Video as VideoIcon,
  Upload,
  MapPin,
  ExternalLink,
  Play,
  Pause,
  Download,
  Trash2
} from "lucide-react";
import { VideoUploadForm } from "./VideoUploadForm";
import { EditValidityModal } from "./EditValidityModal";
import { Television, Video } from "@/types/television";

interface TelevisionCompactProps {
  televisions: Television[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Television, 'id'>>) => void;
  onDeleteVideo?: (televisionId: string, filename: string) => Promise<void>;
  onUploadVideos?: (televisionId: string, files: File[]) => Promise<void>;
}

export const TelevisionCompact = ({ televisions, onRemove, onUpdate, onDeleteVideo, onUploadVideos }: TelevisionCompactProps) => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [dragOverTvId, setDragOverTvId] = useState<string | null>(null);
  const [selectedTvIds, setSelectedTvIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBackendUrl, setSelectedBackendUrl] = useState<string>('');
  const [editValidityDialogOpen, setEditValidityDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedTelevisionId, setSelectedTelevisionId] = useState<string>('');
  const { toast } = useToast();

  const toggleSelection = (televisionId: string) => {
    setSelectedTvIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(televisionId)) {
        newSet.delete(televisionId);
      } else {
        newSet.add(televisionId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedTvIds(new Set());
  };

  // Função para lidar com sucesso no upload
  const handleUploadSuccess = async (result: any) => {
    // Atualizar a lista de vídeos de todos os televisores que usam a mesma URL
    const televisorsToUpdate = televisions.filter(tv => tv.backendUrl === selectedBackendUrl);
    
    for (const television of televisorsToUpdate) {
      try {
        const listResponse = await fetch(`${television.backendUrl}/list`);
        if (listResponse.ok) {
          const listResult = await listResponse.json();
          if (listResult.success && listResult.videos) {
            onUpdate(television.id, { videos: listResult.videos });
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar lista:', error);
      }
    }
  };

  // Função para abrir dialog de upload
  const openUploadDialog = (backendUrl: string) => {
    setSelectedBackendUrl(backendUrl);
    setUploadDialogOpen(true);
  };

  const handleBatchUpload = () => {
    if (selectedTvIds.size === 0) return;
    
    // Usar o primeiro televisor selecionado para obter a URL do backend
    const firstSelectedTv = televisions.find(tv => selectedTvIds.has(tv.id));
    if (firstSelectedTv) {
      openUploadDialog(firstSelectedTv.backendUrl);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedTvIds.size === 0) return;
    
    const selectedTvs = televisions.filter(tv => selectedTvIds.has(tv.id));
    const totalVideos = selectedTvs.reduce((total, tv) => total + tv.videos.length, 0);
    
    if (totalVideos === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum Vídeo Encontrado",
        description: "Os televisores selecionados não possuem vídeos para download.",
      });
      return;
    }

    console.log(`Iniciando download de ${totalVideos} vídeos de ${selectedTvIds.size} televisores`);

    toast({
      title: "Downloads Iniciados",
      description: `Baixando ${totalVideos} vídeo(s) de ${selectedTvIds.size} televisor(es). Verifique sua pasta de downloads.`,
    });

    // Função para forçar download individual
    const forceDownload = (url: string, filename: string) => {
      console.log(`Tentando baixar: ${filename} de ${url}`);
      
      // Criar iframe oculto para cada download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // Criar link de download como backup
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Remover iframe após delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    };

    // Baixar todos os vídeos com delay progressivo
    let downloadIndex = 0;
    for (const tv of selectedTvs) {
      for (const video of tv.videos) {
        const filename = `${tv.caption || tv.id}_${video.filename}`;
        
        setTimeout(() => {
          forceDownload(video.downloadUrl, filename);
          console.log(`Download ${downloadIndex + 1}/${totalVideos}: ${filename}`);
        }, downloadIndex * 1000); // 1 segundo de delay entre downloads
        
        downloadIndex++;
      }
    }

    // Mostrar progresso
    setTimeout(() => {
      toast({
        title: "Downloads em Andamento",
        description: `${totalVideos} download(s) foram iniciados. Aguarde a conclusão.`,
      });
    }, 2000);

    clearSelection();
  };

  const getServerStatusIcon = (status?: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      case 'checking':
        return <Server className="h-3 w-3 text-yellow-500 animate-spin" />;
      default:
        return <Server className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getServerStatusColor = (status?: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return 'border-green-500 bg-green-500/10';
      case 'offline':
        return 'border-red-500 bg-red-500/10';
      case 'checking':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-muted bg-muted/10';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const togglePlay = (videoId: string, videoElement: HTMLVideoElement) => {
    if (playingVideo === videoId) {
      videoElement.pause();
      setPlayingVideo(null);
    } else {
      // Pausar todos os outros vídeos
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => video.pause());
      
      videoElement.play();
      setPlayingVideo(videoId);
    }
  };

  const handleDrop = (e: React.DragEvent, televisionId: string) => {
    e.preventDefault();
    setDragOverTvId(null);
    // Abrir dialog de upload quando arquivos são arrastados
    const television = televisions.find(tv => tv.id === televisionId);
    if (television) {
      openUploadDialog(television.backendUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, televisionId: string) => {
    e.preventDefault();
    setDragOverTvId(televisionId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTvId(null);
    }
  };

  const handleFileSelect = (televisionId: string) => {
    const television = televisions.find(tv => tv.id === televisionId);
    if (television) {
      openUploadDialog(television.backendUrl);
    }
  };

  const openGoogleMaps = (television: Television) => {
    const url = `https://www.google.com/maps?q=${television.coordenadas.lat},${television.coordenadas.lng}&z=15&t=m&hl=pt-BR`;
    window.open(url, '_blank');
  };

  const confirmDelete = (message: string, action: () => void) => {
    setDeleteMessage(message);
    setDeleteAction(() => action);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteAction) {
      deleteAction();
    }
    setDeleteConfirmOpen(false);
    setDeleteAction(null);
    setDeleteMessage("");
  };

  const handleBatchDeleteVideos = () => {
    if (selectedTvIds.size === 0 || !onDeleteVideo) return;
    
    const selectedTvs = televisions.filter(tv => selectedTvIds.has(tv.id));
    const totalVideos = selectedTvs.reduce((total, tv) => total + tv.videos.length, 0);
    
    if (totalVideos === 0) return;

    const action = async () => {
      for (const tv of selectedTvs) {
        for (const video of tv.videos) {
          await onDeleteVideo(tv.id, video.filename);
        }
      }
      clearSelection();
    };

    confirmDelete(
      `Tem certeza que deseja apagar todos os ${totalVideos} vídeos dos ${selectedTvIds.size} televisores selecionados?`,
      action
    );
  };

  const handleEditVideoValidity = (video: Video, televisionId: string, backendUrl: string) => {
    setSelectedVideo(video);
    setSelectedTelevisionId(televisionId);
    setSelectedBackendUrl(backendUrl);
    setEditValidityDialogOpen(true);
  };

  const handleUpdateVideoValidity = async (newExpirationDays: number) => {
    if (!selectedVideo || !selectedTelevisionId) return;

    try {
      const response = await fetch(`${selectedBackendUrl}/update-validity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedVideo.filename,
          expirationDays: newExpirationDays
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Atualizar a lista de vídeos do televisor
          const listResponse = await fetch(`${selectedBackendUrl}/list`);
          if (listResponse.ok) {
            const listResult = await listResponse.json();
            if (listResult.success && listResult.videos) {
              onUpdate(selectedTelevisionId, { videos: listResult.videos });
              toast({
                title: "Validade Atualizada",
                description: `O vídeo "${selectedVideo.filename}" agora tem validade de ${newExpirationDays} dias.`,
              });
            }
          }
        } else {
          throw new Error(result.message || 'Erro ao atualizar validade');
        }
      } else {
        throw new Error('Erro na comunicação com o servidor');
      }
    } catch (error) {
      console.error('Erro ao atualizar validade:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Atualizar Validade",
        description: "Não foi possível atualizar a validade do vídeo. Tente novamente.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações em Lote */}
      {selectedTvIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedTvIds.size} televisor{selectedTvIds.size !== 1 ? 'es' : ''} selecionado{selectedTvIds.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchUpload}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload em Lote
              </Button>
              <Button
                onClick={handleBatchDownload}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Todos os Videos
              </Button>
              <Button
                onClick={handleBatchDeleteVideos}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Apagar Todos os Vídeos
              </Button>
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
              >
                Limpar Seleção
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
        {televisions.map((television, index) => (
          <Card 
            key={television.id} 
            className={`p-3 relative group hover:shadow-lg transition-all cursor-pointer ${
              selectedTvIds.has(television.id)
                ? 'ring-2 ring-primary border-primary bg-primary/10' 
                : dragOverTvId === television.id 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : ''
            }`}
            onClick={() => toggleSelection(television.id)}
            onDrop={(e) => handleDrop(e, television.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, television.id)}
            onDragLeave={handleDragLeave}
          >
            {/* Indicador de Seleção */}
            {selectedTvIds.has(television.id) && (
              <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold">✓</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(television.id);
              }}
              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </Button>
          
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                #{index + 1}
              </div>
              <Badge 
                variant="outline" 
                className={`${getServerStatusColor(television.serverStatus)} border text-xs px-1`}
              >
                {getServerStatusIcon(television.serverStatus)}
              </Badge>
            </div>
            
            {/* Caption & Backend URL */}
            <div>
              <h4 className="font-medium text-sm truncate">
                {television.caption || `Televisor ${index + 1}`}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {television.backendUrl}
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <div className="text-xs">
                  <span className="font-medium">{television.cidade}</span>
                  <span className="text-muted-foreground">, {television.estado}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleMaps(television);
                }}
                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Coordinates */}
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Lat: {television.coordenadas.lat}</span>
                <span>Lng: {television.coordenadas.lng}</span>
              </div>
            </div>
            
            {/* Videos Section */}
            {television.videos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <VideoIcon className="h-3 w-3 text-primary" />
                    <span>Vídeos ({television.videos.length})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUploadDialog(television.backendUrl);
                    }}
                    className="h-5 text-xs px-2"
                  >
                    <Upload className="h-2 w-2 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {television.videos.map((video) => (
                    <div 
                      key={video.filename} 
                      className="flex items-center gap-1 p-1 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVideoValidity(video, television.id, television.backendUrl);
                      }}
                      title="Clique para editar a validade do vídeo"
                    >
                      {/* Expiration days indicator */}
                      <div className="flex-shrink-0">
                        {video.expirationDays !== undefined && (
                          <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                            video.expirationDays <= 0 
                              ? 'text-red-500' 
                              : video.expirationDays <= 7 
                              ? 'text-yellow-500' 
                              : 'text-white'
                          }`}>
                            {video.expirationDays <= 0 ? 'EXP' : `${video.expirationDays}d`}
                          </span>
                        )}
                      </div>

                      {/* Mini video preview */}
                      <div className="relative w-8 h-6 bg-black rounded overflow-hidden flex-shrink-0">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          onPlay={() => setPlayingVideo(`${television.id}-${video.filename}`)}
                          onPause={() => setPlayingVideo(null)}
                          onEnded={() => setPlayingVideo(null)}
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const videoEl = e.currentTarget.closest('.relative')?.querySelector('video') as HTMLVideoElement;
                              if (videoEl) {
                                togglePlay(`${television.id}-${video.filename}`, videoEl);
                              }
                            }}
                            className="bg-black/50 hover:bg-black/70 text-white h-4 w-4 p-0"
                          >
                            {playingVideo === `${television.id}-${video.filename}` ? (
                              <Pause className="h-2 w-2" />
                            ) : (
                              <Play className="h-2 w-2" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Video info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{video.filename}</p>
                        <p className="text-muted-foreground">{formatFileSize(video.size)}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(video.downloadUrl, '_blank');
                          }}
                          className="h-5 w-5 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <Download className="h-2 w-2" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(
                              `Tem certeza que deseja apagar o vídeo "${video.filename}"?`,
                              async () => {
                                if (onDeleteVideo) {
                                  await onDeleteVideo(television.id, video.filename);
                                }
                              }
                            );
                          }}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center gap-2 p-3 bg-muted/30 rounded border-2 border-dashed transition-all ${
                  dragOverTvId === television.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  <span>
                    {dragOverTvId === television.id 
                      ? 'Solte aqui' 
                      : 'Arraste vídeos aqui'
                    }
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-dashed h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openUploadDialog(television.backendUrl);
                  }}
                >
                  <Upload className="h-2 w-2 mr-1" />
                  Selecionar Vídeos
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Configure validade e envie múltiplos arquivos .mp4
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>

    {/* Upload Dialog */}
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <VideoUploadForm
          backendUrl={selectedBackendUrl}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setUploadDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>

    {/* Edit Validity Dialog */}
    <EditValidityModal
      isOpen={editValidityDialogOpen}
      onClose={() => setEditValidityDialogOpen(false)}
      onConfirm={handleUpdateVideoValidity}
      video={selectedVideo}
      backendUrl={selectedBackendUrl}
    />
    
    {/* Modal de Confirmação de Delete */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};
