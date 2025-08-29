import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Play, Pause, X, Trash2, Server, Wifi, WifiOff, Download, RefreshCw, CheckCircle, AlertCircle, MapPin, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoUploadForm } from "./VideoUploadForm";
import { EditValidityModal } from "./EditValidityModal";
import { Television, Video } from "@/types/television";

interface TelevisionCardProps {
  television: Television;
  number: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Television, 'id'>>) => void;
}

export const TelevisionCard = ({ television, number, onRemove, onUpdate }: TelevisionCardProps) => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [editValidityDialog, setEditValidityDialog] = useState<{
    isOpen: boolean;
    video: Video | null;
  }>({
    isOpen: false,
    video: null
  });
  const { toast } = useToast();

  const refreshVideoList = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${television.backendUrl}/list`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.videos) {
          onUpdate(television.id, { videos: result.videos });
          toast({
            title: "Lista atualizada",
            description: `${result.videos.length} vídeos encontrados.`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para lidar com sucesso no upload
  const handleUploadSuccess = async (result: any) => {
    await refreshVideoList();
  };

  const handleDeleteVideo = async (filename: string) => {
    try {
      // Deletar do backend
      const deleteUrl = `${television.backendUrl}/delete/${filename}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Falha ao deletar');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Falha ao deletar vídeo do servidor');
      }

      // Atualizar a lista de vídeos
      await refreshVideoList();
      
      toast({
        title: "Vídeo excluído",
        description: `${filename} foi removido do servidor com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o vídeo do servidor ${television.backendUrl}`,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Abrir dialog de upload quando arquivos são arrastados
    setUploadDialogOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const togglePlay = (filename: string) => {
    const videoRef = videoRefs.current[filename];
    if (videoRef) {
      if (playingVideo === filename) {
        videoRef.pause();
        setPlayingVideo(null);
      } else {
        // Pausar todos os outros vídeos
        Object.values(videoRefs.current).forEach(ref => {
          if (ref && ref !== videoRef) {
            ref.pause();
          }
        });
        videoRef.play();
        setPlayingVideo(filename);
      }
    }
  };

  const handleVideoEnd = () => {
    setPlayingVideo(null);
  };

  // Função para obter classes de borda baseadas no status do servidor
  const getServerStatusBorder = () => {
    switch (television.serverStatus) {
      case 'online':
        return 'border-green-500 shadow-green-500/20';
      case 'offline':
        return 'border-red-500 shadow-red-500/20';
      case 'checking':
        return 'border-yellow-500 shadow-yellow-500/20 animate-pulse';
      default:
        return 'border-tv-border';
    }
  };

  // Função para obter o ícone do status do servidor
  const getServerStatusIcon = () => {
    switch (television.serverStatus) {
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

  const handleRemove = () => {
    onRemove(television.id);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${television.coordenadas.lat},${television.coordenadas.lng}&z=15&t=m&hl=pt-BR`;
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para abrir o modal de edição de validade
  const handleEditVideoValidity = (video: Video) => {
    setEditValidityDialog({
      isOpen: true,
      video
    });
  };

  // Função para atualizar a validade do vídeo
  const handleUpdateVideoValidity = async (expirationDays: number) => {
    if (!editValidityDialog.video) return;

    try {
      const response = await fetch(`${television.backendUrl}/update-validity`, {
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
        const updatedVideos = television.videos.map(video => 
          video.filename === editValidityDialog.video?.filename 
            ? { ...video, expirationDays } 
            : video
        );
        onUpdate(television.id, { videos: updatedVideos });

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

    setEditValidityDialog({ isOpen: false, video: null });
  };

  return (
    <Card className={`relative group bg-gradient-tv hover:shadow-tv-hover transition-all duration-300 border-2 ${getServerStatusBorder()} ${isDragOver ? 'ring-2 ring-primary animate-glow-pulse' : ''}`}>
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <div className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded-md">
          {number}
        </div>
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          {getServerStatusIcon()}
          <span className="text-xs font-medium">
            {television.serverStatus === 'online' && 'Online'}
            {television.serverStatus === 'offline' && 'Offline'}
            {television.serverStatus === 'checking' && 'Verificando...'}
            {!television.serverStatus && 'N/A'}
          </span>
        </div>
      </div>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshVideoList}
          disabled={isRefreshing}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/80 hover:bg-primary text-primary-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive text-destructive-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        {/* Upload Area */}
        <div
          className={`aspect-video bg-tv-screen border-2 border-tv-frame rounded-lg mb-4 relative overflow-hidden border-dashed ${isDragOver ? 'ring-2 ring-primary animate-glow-pulse' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Upload className="h-8 w-8 mb-2" />
            <p className="text-sm text-center mb-2">
              Arraste vídeo(s) aqui ou clique para selecionar
            </p>
            <p className="text-xs text-center mb-3 text-muted-foreground/80">
              Configure validade e envie múltiplos arquivos .mp4
            </p>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-tv-border hover:bg-tv-frame"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Vídeo(s)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <VideoUploadForm
                  backendUrl={television.backendUrl}
                  onUploadSuccess={handleUploadSuccess}
                  onClose={() => setUploadDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Video List */}
        {television.videos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Vídeos ({television.videos.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshVideoList}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {television.videos.map((video) => (
                <div key={video.filename} className="bg-tv-screen border border-tv-border rounded-md">
                  {/* Video Player */}
                  <div className="aspect-video relative">
                    <video
                      ref={(el) => (videoRefs.current[video.filename] = el)}
                      src={video.url}
                      className="w-full h-full object-cover rounded-t-md"
                      onEnded={handleVideoEnd}
                      onPlay={() => setPlayingVideo(video.filename)}
                      onPause={() => setPlayingVideo(null)}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => togglePlay(video.filename)}
                        className="bg-black/50 hover:bg-black/70 text-white border-none"
                      >
                        {playingVideo === video.filename ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(video.downloadUrl, '_blank')}
                        className="bg-blue-500/70 hover:bg-blue-500 text-white border-none"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteVideo(video.filename)}
                        className="bg-destructive/70 hover:bg-destructive text-white border-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                   </div>
                   {/* Video Info */}
                   <div 
                     className="p-2 cursor-pointer hover:bg-muted/30 transition-colors"
                     onClick={() => handleEditVideoValidity(video)}
                     title="Clique para editar a validade do vídeo"
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
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
                         <span className="text-xs font-medium text-foreground">
                           {video.filename}
                         </span>
                       </div>
                       <span className="text-xs text-muted-foreground">
                         {formatFileSize(video.size)}
                       </span>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Television Information - Read Only */}
        <div className="space-y-3 pt-3 border-t border-tv-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Backend URL</Label>
            <div className="bg-tv-screen border border-tv-border rounded-md px-3 py-2 text-sm">
              {television.backendUrl}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Legenda</Label>
            <div className="bg-tv-screen border border-tv-border rounded-md px-3 py-2 text-sm">
              {television.caption}
            </div>
          </div>

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
              onClick={openGoogleMaps}
              className="bg-tv-screen hover:bg-tv-frame border-tv-border"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Mapa
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <div className="bg-tv-screen border border-tv-border rounded-md px-2 py-1 text-xs h-8 flex items-center">
                {television.coordenadas.lat}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <div className="bg-tv-screen border border-tv-border rounded-md px-2 py-1 text-xs h-8 flex items-center">
                {television.coordenadas.lng}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Validity Dialog */}
      <EditValidityModal
        isOpen={editValidityDialog.isOpen}
        onClose={() => setEditValidityDialog({ isOpen: false, video: null })}
        onConfirm={handleUpdateVideoValidity}
        video={editValidityDialog.video}
        backendUrl={television.backendUrl}
      />
    </Card>
  );
};