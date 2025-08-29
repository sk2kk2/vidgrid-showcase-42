import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Play, 
  Pause, 
  X, 
  Trash2, 
  Server, 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw,
  Video as VideoIcon,
  Upload,
  MapPin,
  ExternalLink
} from "lucide-react";
import { VideoUploadForm } from "./VideoUploadForm";
import { EditValidityModal } from "./EditValidityModal";
import { Television, Video } from "@/types/television";
import { useToast } from "@/hooks/use-toast";

interface TelevisionListProps {
  televisions: Television[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Television, 'id'>>) => void;
  onDeleteVideo?: (televisionId: string, filename: string) => Promise<void>;
  onUploadVideos?: (televisionId: string, files: File[]) => Promise<void>;
}

export const TelevisionList = ({ televisions, onRemove, onUpdate, onDeleteVideo, onUploadVideos }: TelevisionListProps) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [dragOverTvId, setDragOverTvId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBackendUrl, setSelectedBackendUrl] = useState<string>('');
  const [editValidityDialog, setEditValidityDialog] = useState<{
    isOpen: boolean;
    video: Video | null;
    televisionId: string;
    backendUrl: string;
  }>({
    isOpen: false,
    video: null,
    televisionId: '',
    backendUrl: ''
  });
  const { toast } = useToast();

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

  const getServerStatusIcon = (status?: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Server className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Server className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getServerStatusText = (status?: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Verificando...';
      default:
        return 'N/A';
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
    if (playingVideoId === videoId) {
      videoElement.pause();
      setPlayingVideoId(null);
    } else {
      // Pausar todos os outros vídeos
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => video.pause());
      
      videoElement.play();
      setPlayingVideoId(videoId);
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
    // Só remove o drag over se realmente saiu do elemento
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

  // Função para abrir o modal de edição de validade
  const handleEditVideoValidity = (video: Video, televisionId: string, backendUrl: string) => {
    setEditValidityDialog({
      isOpen: true,
      video,
      televisionId,
      backendUrl
    });
  };

  // Função para atualizar a validade do vídeo
  const handleUpdateVideoValidity = async (expirationDays: number) => {
    if (!editValidityDialog.video) return;

    try {
      const response = await fetch(`${editValidityDialog.backendUrl}/update-validity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: editValidityDialog.video.filename,
          expirationDays: expirationDays
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar validade');
      }

      const result = await response.json();
      if (result.success) {
        // Atualizar a lista de vídeos
        const television = televisions.find(tv => tv.id === editValidityDialog.televisionId);
        if (television) {
          const updatedVideos = television.videos.map(video => 
            video.filename === editValidityDialog.video?.filename 
              ? { ...video, expirationDays } 
              : video
          );
          onUpdate(editValidityDialog.televisionId, { videos: updatedVideos });
        }

        toast({
          title: "Validade atualizada",
          description: `Vídeo ${editValidityDialog.video.filename} agora expira em ${expirationDays} dias.`,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar validade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a validade do vídeo.",
        variant: "destructive"
      });
    }

    setEditValidityDialog({ isOpen: false, video: null, televisionId: '', backendUrl: '' });
  };

  return (
    <div className="space-y-4">
      {televisions.map((television, index) => (
        <Card 
          key={television.id} 
          className={`p-6 transition-all ${
            dragOverTvId === television.id 
              ? 'ring-2 ring-primary border-primary bg-primary/5' 
              : ''
          }`}
          onDrop={(e) => handleDrop(e, television.id)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, television.id)}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-md">
                #{index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {television.caption || `Televisor ${index + 1}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {television.backendUrl}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getServerStatusColor(television.serverStatus)} border`}
              >
                {getServerStatusIcon(television.serverStatus)}
                <span className="ml-1 text-xs">
                  {getServerStatusText(television.serverStatus)}
                </span>
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(television.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Vídeos */}
            {television.videos.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <VideoIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Vídeos ({television.videos.length})
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {television.videos.map((video) => (
                    <div 
                      key={video.filename} 
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                    >
                      {/* Preview do vídeo */}
                      <div className="relative w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          onPlay={() => setPlayingVideoId(`${television.id}-${video.filename}`)}
                          onPause={() => setPlayingVideoId(null)}
                          onEnded={() => setPlayingVideoId(null)}
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              const videoEl = e.currentTarget.closest('.relative')?.querySelector('video') as HTMLVideoElement;
                              if (videoEl) {
                                togglePlay(`${television.id}-${video.filename}`, videoEl);
                              }
                            }}
                            className="bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0"
                          >
                            {playingVideoId === `${television.id}-${video.filename}` ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                        {/* Info do vídeo */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer hover:bg-muted/30 rounded p-1 transition-colors"
                          onClick={() => handleEditVideoValidity(video, television.id, television.backendUrl)}
                          title="Clique para editar a validade do vídeo"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {video.expirationDays !== undefined && (
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                video.expirationDays <= 0 
                                  ? 'text-red-500 bg-red-500/10' 
                                  : video.expirationDays <= 7 
                                  ? 'text-yellow-500 bg-yellow-500/10' 
                                  : 'text-white bg-gray-500/10'
                              }`}>
                                {video.expirationDays <= 0 ? 'EXP' : `${video.expirationDays}d`}
                              </span>
                            )}
                            <p className="font-medium text-sm truncate">
                              {video.filename}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatFileSize(video.size)}</span>
                            <span>{new Date(video.created).toLocaleDateString()}</span>
                          </div>
                        </div>
                      
                      {/* Ações */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.downloadUrl, '_blank')}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (onDeleteVideo) {
                              onDeleteVideo(television.id, video.filename);
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg border-2 border-dashed transition-all ${
                  dragOverTvId === television.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">
                    {dragOverTvId === television.id 
                      ? 'Solte os vídeos aqui' 
                      : 'Arraste vídeos aqui ou clique para selecionar'
                    }
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-dashed"
                  onClick={() => {
                    openUploadDialog(television.backendUrl);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Vídeos
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Configure validade e envie múltiplos arquivos .mp4
                </p>
              </div>
            )}

            {/* Informações de Localização */}
            <div className="pt-4 border-t border-muted space-y-3">
              {/* Legenda */}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Legenda</span>
                <div className="text-sm text-foreground mt-1">
                  {television.caption || `Televisor ${index + 1}`}
                </div>
              </div>

              {/* Localização */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{television.cidade}</p>
                    <p className="text-xs text-muted-foreground">{television.estado}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${television.coordenadas.lat},${television.coordenadas.lng}&z=15&t=m&hl=pt-BR`;
                    window.open(url, '_blank');
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Mapa
                </Button>
              </div>
              
              {/* Coordenadas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Latitude</span>
                  <div className="text-sm text-foreground font-mono">
                    {television.coordenadas.lat}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Longitude</span>
                  <div className="text-sm text-foreground font-mono">
                    {television.coordenadas.lng}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
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
        isOpen={editValidityDialog.isOpen}
        onClose={() => setEditValidityDialog({ isOpen: false, video: null, televisionId: '', backendUrl: '' })}
        onConfirm={handleUpdateVideoValidity}
        video={editValidityDialog.video}
        backendUrl={editValidityDialog.backendUrl}
      />
    </div>
  );
};