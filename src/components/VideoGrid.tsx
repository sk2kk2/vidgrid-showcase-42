import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Tv, Wifi, MapPin, RefreshCw, Upload } from "lucide-react";
import { TelevisionCard } from "./TelevisionCard";
import { TelevisionList } from "./TelevisionList";
import { TelevisionCompact } from "./TelevisionCompact";
import { ViewModeSelector } from "./ViewModeSelector";
import { CitySelector } from "./CitySelector";
import { TelevisionInfo } from "./TelevisionInfo";
import { VideoUploadForm } from "./VideoUploadForm";
import { nanoid } from "nanoid";
import televisionsData from "@/data/televisions.json";
import { useVideoCheck } from "@/hooks/useVideoCheck";
import { Television, ViewMode } from "@/types/television";

export const VideoGrid = () => {
  // Load televisions from fixed JSON file
  const [televisions, setTelevisions] = useState<Television[]>(televisionsData.televisions);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBackendUrl, setSelectedBackendUrl] = useState<string>('');

  const updateTelevision = (id: string, updates: Partial<Omit<Television, 'id'>>) => {
    setTelevisions(prev => 
      prev.map(tv => 
        tv.id === id ? { ...tv, ...updates } : tv
      )
    );
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
            updateTelevision(television.id, { videos: listResult.videos });
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar lista:', error);
      }
    }
  };

  // Função para abrir dialog de upload
  const openUploadDialog = (backendUrl?: string) => {
    if (backendUrl) {
      setSelectedBackendUrl(backendUrl);
    } else if (televisions.length > 0) {
      setSelectedBackendUrl(televisions[0].backendUrl);
    }
    setUploadDialogOpen(true);
  };

  // Hook para verificar vídeos existentes e status dos servidores
  const { checkVideosExist, checkServerStatus } = useVideoCheck(televisions, updateTelevision);

  const checkAllServersStatus = () => {
    televisions.forEach(television => {
      checkServerStatus(television);
    });
  };

  const checkAllVideos = () => {
    televisions.forEach(television => {
      checkVideosExist(television);
    });
  };

  // Execução automática a cada 30 segundos para verificar status e vídeos
  useEffect(() => {
    // Executar imediatamente na inicialização
    if (televisions.length > 0) {
      checkAllServersStatus();
      checkAllVideos();
    }

    // Configurar intervalo para execução automática
    const interval = setInterval(() => {
      if (televisions.length > 0) {
        checkAllServersStatus();
        checkAllVideos();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [televisions.length]); // Reagir a mudanças no número de televisores

  // Filter televisions by selected city
  const filteredTelevisions = useMemo(() => {
    if (selectedCity === 'todas') {
      return televisions;
    }
    return televisions.filter(tv => tv.cidade === selectedCity);
  }, [televisions, selectedCity]);

  const addTelevision = () => {
    // Generate next available number
    const maxNumber = televisions.length > 0 ? Math.max(...televisions.map(tv => tv.numero)) : 0;
    const newNumber = maxNumber + 1;
    
    const newTelevision: Television = {
      id: nanoid(),
      numero: newNumber,
      videos: [],
      caption: "",
      backendUrl: "http://192.168.1.100:3000", // IP padrão, pode ser editado
      cidade: "Salvador", // Cidade padrão
      estado: "Bahia", // Estado padrão
      coordenadas: {
        lat: -12.9714,
        lng: -38.5014
      }
    };
    setTelevisions(prev => [...prev, newTelevision]);
  };

  const handleDeleteVideo = async (televisionId: string, filename: string) => {
    const television = televisions.find(tv => tv.id === televisionId);
    if (!television) return;

    try {
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
      try {
        const listResponse = await fetch(`${television.backendUrl}/list`);
        if (listResponse.ok) {
          const listResult = await listResponse.json();
          if (listResult.success && listResult.videos) {
            updateTelevision(televisionId, { videos: listResult.videos });
          }
        }
      } catch (refreshError) {
        console.error('Erro ao atualizar lista:', refreshError);
      }
      
      // Toast de sucesso (precisa importar useToast)
      // Para simplicidade, apenas console.log por agora
      console.log(`Vídeo ${filename} excluído com sucesso`);
      
    } catch (error) {
      console.error('Erro ao deletar:', error);
      // Toast de erro
      console.error(`Não foi possível excluir o vídeo do servidor ${television.backendUrl}`);
    }
  };

  const handleMultipleFileUpload = async (televisionId: string, files: File[]) => {
    // Essa função agora só abre o dialog de upload
    const television = televisions.find(tv => tv.id === televisionId);
    if (television) {
      setSelectedBackendUrl(television.backendUrl);
      setUploadDialogOpen(true);
    }
  };

  const removeTelevision = (id: string) => {
    setTelevisions(prev => prev.filter(tv => tv.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tv className="h-12 w-12 text-primary" />
            <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TELEVISORES
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie sua coleção de vídeos em uma interface inspirada em televisores vintage. 
            Arraste e solte seus vídeos, adicione legendas e organize sua galeria.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex justify-center gap-4">
              <Button
                onClick={addTelevision}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg shadow-tv hover:shadow-tv-hover transition-all duration-300"
              >
                <Plus className="h-6 w-6 mr-2" />
                Adicionar Televisor
              </Button>
              {televisions.length > 0 && (
                <>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => openUploadDialog()}
                        size="lg"
                        variant="default"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg shadow-tv hover:shadow-tv-hover transition-all duration-300"
                      >
                        <Upload className="h-6 w-6 mr-2" />
                        Envio em massa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <VideoUploadForm
                        backendUrl={selectedBackendUrl}
                        onUploadSuccess={handleUploadSuccess}
                        onClose={() => setUploadDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={checkAllServersStatus}
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 py-6 text-lg shadow-tv hover:shadow-tv-hover transition-all duration-300"
                  >
                    <Wifi className="h-6 w-6 mr-2" />
                    Verificar Status
                  </Button>
                  <Button
                    onClick={checkAllVideos}
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 py-6 text-lg shadow-tv hover:shadow-tv-hover transition-all duration-300"
                  >
                    <RefreshCw className="h-6 w-6 mr-2" />
                    Atualizar Vídeos
                  </Button>
                </>
              )}
            </div>
            
            {televisions.length > 0 && (
              <ViewModeSelector 
                currentMode={viewMode} 
                onModeChange={setViewMode} 
              />
            )}
          </div>
          
          {/* City Filter */}
          {televisions.length > 0 && (
            <div className="flex justify-center">
              <CitySelector 
                televisions={televisions}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTelevisions.map((television) => (
              <TelevisionCard
                key={television.id}
                television={television}
                number={television.numero}
                onRemove={removeTelevision}
                onUpdate={updateTelevision}
              />
            ))}
          </div>
        )}
        
        {viewMode === 'list' && (
          <TelevisionList
            televisions={filteredTelevisions}
            onRemove={removeTelevision}
            onUpdate={updateTelevision}
            onDeleteVideo={handleDeleteVideo}
            onUploadVideos={handleMultipleFileUpload}
          />
        )}
        
        {viewMode === 'compact' && (
          <TelevisionCompact
            televisions={filteredTelevisions}
            onRemove={removeTelevision}
            onUpdate={updateTelevision}
            onDeleteVideo={handleDeleteVideo}
            onUploadVideos={handleMultipleFileUpload}
          />
        )}

        {/* Empty State */}
        {filteredTelevisions.length === 0 && televisions.length > 0 && (
          <div className="text-center py-16">
            <MapPin className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-muted-foreground mb-2">
              Nenhum televisor encontrado em {selectedCity}
            </h3>
            <p className="text-muted-foreground mb-6">
              Selecione outra cidade ou adicione televisores para esta localização.
            </p>
          </div>
        )}

        {televisions.length === 0 && (
          <div className="text-center py-16">
            <Tv className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-muted-foreground mb-2">
              Nenhum televisor adicionado
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando seu primeiro televisor para carregar vídeos.
            </p>
            <Button
              onClick={addTelevision}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-6 w-6 mr-2" />
              Adicionar Primeiro Televisor
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
