
import { useEffect, useState, useRef } from 'react';

interface Video {
  filename: string;
  url: string;
  size: number;
  created: string;
}

const Monitor = () => {
  // Component state for video monitoring
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buscar lista de vídeos do servidor
  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:3000/list');
      const data = await response.json();
      
      if (data.success && data.videos.length > 0) {
        const previousVideosCount = videos.length;
        const currentVideoFilename = videos[currentVideoIndex]?.filename;
        
        setVideos(data.videos);
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

  // Buscar vídeos na inicialização
  useEffect(() => {
    fetchVideos();
    
    // Atualizar lista a cada 30 segundos
    const interval = setInterval(fetchVideos, 30000);
    return () => clearInterval(interval);
  }, []);

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
    
    console.log('Erro no carregamento de vídeo, recarregando a página...');
    window.location.reload();
  };

  // Countdown automático para recarregar quando não há vídeos
  useEffect(() => {
    if (error || videos.length === 0) {
      if (!loading) {
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              window.location.reload();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    } else {
      setCountdown(10); // Reset countdown when videos are found
    }
  }, [error, videos.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando vídeos...</div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl text-center">
          <div>{error || 'Nenhum vídeo disponível'}</div>
          <div className="mt-4 text-lg text-gray-300">
            Recarregando em {countdown} segundos...
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-black p-0 overflow-hidden">
      <div className="w-full h-screen overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          controls={false}
          autoPlay
          
          loop={videos.length === 1}
          playsInline
          onEnded={handleVideoEnded}
          onLoadedData={handleLoadedData}
          onError={handleVideoError}
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
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
          {currentVideoIndex + 1}/{videos.length} - {currentVideo?.filename}
        </div>
      </div>
    </div>
  );
};

export default Monitor;
