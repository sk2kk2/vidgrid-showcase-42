
import { useEffect, useState, useRef } from 'react';
import { useServerConfig } from '@/hooks/useServerConfig';
import ServerConfig from '@/components/ServerConfig';
import { Button } from '@/components/ui/button';

interface Video {
  filename: string;
  url: string;
  size: number;
  created: string;
}

const Monitor = () => {
  // Server configuration
  const { serverUrl, isConfigured, updateServerUrl, clearServerConfig } = useServerConfig();
  
  // Component state for video monitoring
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buscar lista de vídeos do servidor
  const fetchVideos = async () => {
    if (!serverUrl) {
      setError('Servidor não configurado');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/list`, {
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json();
      
      if (data.success && data.videos.length > 0) {
        const previousVideosCount = videos.length;
        const currentVideoFilename = videos[currentVideoIndex]?.filename;
        
        // Reescrever URLs dos vídeos para usar o servidor configurado
        const processedVideos = data.videos.map((video: Video) => ({
          ...video,
          url: video.url.includes('localhost') 
            ? `${serverUrl}/videos/${video.filename}`
            : video.url
        }));
        
        setVideos(processedVideos);
        setError(null);
        
        // Verificar se o vídeo atual foi deletado
        if (previousVideosCount > 0 && currentVideoFilename) {
          const currentVideoExists = data.videos.some(video => video.filename === currentVideoFilename);
          
          if (!currentVideoExists) {
            console.log('Vídeo atual foi deletado, passando para o próximo...');
            // Se o vídeo atual foi deletado, ajustar o índice
            if (currentVideoIndex >= data.videos.length) {
              setCurrentVideoIndex(0);
            }
            // Forçar reload do vídeo
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.load();
              }
            }, 100);
          }
        }
      } else {
        setVideos([]);
        setError('Nenhum vídeo encontrado');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro ao buscar vídeos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reproduzir próximo vídeo na sequência
  const playNextVideo = () => {
    if (videos.length > 0) {
      const newIndex = currentVideoIndex >= videos.length - 1 ? 0 : currentVideoIndex + 1;
      console.log(`=== SEQUÊNCIA DE VÍDEOS ===`);
      console.log(`Total de vídeos: ${videos.length}`);
      console.log(`Índice atual: ${currentVideoIndex} (${videos[currentVideoIndex]?.filename})`);
      console.log(`Próximo índice: ${newIndex} (${videos[newIndex]?.filename})`);
      console.log(`Lista completa:`, videos.map((v, i) => `${i}: ${v.filename}`));
      
      console.log(`Mudando para vídeo ${newIndex + 1}/${videos.length}: ${videos[newIndex]?.filename}`);
      setCurrentVideoIndex(newIndex);
    } else {
      console.log('Nenhum vídeo disponível para reproduzir');
    }
  };

  // Buscar vídeos quando servidor estiver configurado
  useEffect(() => {
    if (isConfigured && serverUrl) {
      fetchVideos();
      
      // Atualizar lista a cada 30 segundos
      const interval = setInterval(fetchVideos, 30000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, serverUrl]);

  // Auto-play próximo vídeo quando terminar
  const handleVideoEnded = () => {
    console.log('Vídeo terminou...');
    if (videos.length === 1 && videoRef.current) {
      console.log('Looping vídeo único...');
      const v = videoRef.current;
      v.currentTime = 0;
      v.play().catch((err) => {
        console.error('Erro ao reiniciar vídeo único:', err);
      });
      return;
    }
    console.log('Vídeo terminou, passando para o próximo...');
    playNextVideo();
  };

  // Recarregar vídeo quando índice mudar
  useEffect(() => {
    if (videoRef.current && videos.length > 0 && videos[currentVideoIndex]) {
      const currentVideo = videos[currentVideoIndex];
      console.log(`=== CARREGANDO VÍDEO ===`);
      console.log(`Índice: ${currentVideoIndex}`);
      console.log(`Arquivo: ${currentVideo.filename}`);
      console.log(`URL: ${currentVideo.url}`);
      
      // Para vídeos únicos, adicionar um pequeno delay para evitar conflitos
      if (videos.length === 1) {
        setTimeout(() => {
          if (videoRef.current) {
            console.log('Recarregando vídeo único...');
            videoRef.current.load();
          }
        }, 100);
      } else {
        console.log('Carregando próximo vídeo da sequência...');
        videoRef.current.load();
      }
    } else if (videos.length > 0) {
      console.log('Erro: Vídeo não encontrado no índice', currentVideoIndex, 'Lista:', videos.map(v => v.filename));
    }
  }, [currentVideoIndex]);

  // Reproduzir automaticamente quando vídeo carregar
  const handleLoadedData = () => {
    if (videoRef.current && videos.length > 0) {
      console.log('Vídeo carregado, iniciando reprodução...');
      videoRef.current.play().catch(err => {
        console.error('Erro ao reproduzir vídeo:', err);
        // Se falhar ao reproduzir, tentar o próximo vídeo
        playNextVideo();
      });
    }
  };

  // Lidar com erros de carregamento de vídeo
  const handleVideoError = () => {
    const currentVideo = videos[currentVideoIndex];
    console.error('Erro ao carregar vídeo:', currentVideo?.filename);
    
    // Tentar próximo vídeo em vez de recarregar a página
    if (videos.length > 1) {
      console.log('Tentando próximo vídeo...');
      playNextVideo();
    } else {
      console.log('Erro no vídeo único, tentando recarregar...');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 2000);
    }
  };

  // Detectar mixed content (HTTPS -> HTTP)
  const isMixedContent = () => {
    return window.location.protocol === 'https:' && serverUrl?.startsWith('http:');
  };

  // Handlers para ações de erro
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchVideos();
  };

  const handleReconfigure = () => {
    setShowConfig(true);
  };

  // Mostrar configuração se não estiver configurado ou se solicitado
  if (!isConfigured || showConfig) {
    return (
      <ServerConfig 
        onServerSet={(url) => {
          updateServerUrl(url);
          setShowConfig(false);
          setError(null);
          setLoading(true);
        }}
        initialUrl={serverUrl || ''}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Carregando vídeos...</div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-destructive text-xl">
            {error || 'Nenhum vídeo disponível'}
          </div>
          
          {isMixedContent() && (
            <div className="text-muted-foreground text-sm bg-card p-3 rounded border border-border">
              <p className="font-medium">⚠️ Problema de Mixed Content</p>
              <p>Você está acessando via HTTPS mas o servidor é HTTP.</p>
              <p>Abra via HTTP ou configure HTTPS no servidor.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleRetry}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={handleReconfigure}
              variant="outline"
              className="w-full"
            >
              Configurar Servidor
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Servidor: {serverUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-background p-0 overflow-hidden">
      <div className="w-full h-screen overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-background"
          controls={false}
          autoPlay
          muted
          loop={videos.length === 1}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="metadata"
          onEnded={handleVideoEnded}
          onLoadedData={handleLoadedData}
          onError={handleVideoError}
          onCanPlay={() => {
            // Garantir reprodução em Android TV
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          }}
        >
          {currentVideo && (
            <source 
              src={currentVideo.url} 
              type="video/mp4" 
              key={`${currentVideoIndex}-${currentVideo.filename}`}
            />
          )}
          Seu navegador não suporta reprodução de vídeo.
        </video>
        
        {/* Indicador discreto do vídeo atual */}
        <div className="absolute bottom-4 right-4 bg-background/80 text-foreground text-sm px-3 py-2 rounded border border-border">
          {currentVideoIndex + 1}/{videos.length} - {currentVideo?.filename}
        </div>
        
        {/* Controles para Android TV */}
        <div className="absolute bottom-4 left-4 space-x-2 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
              }
            }}
            className="bg-background/80 text-foreground border-border"
          >
            🔊
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={playNextVideo}
            className="bg-background/80 text-foreground border-border"
          >
            ⏭️
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconfigure}
            className="bg-background/80 text-foreground border-border"
          >
            ⚙️
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Monitor;
