
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  filename: string;
  url: string;
  downloadUrl: string;
  size: number;
  created: string;
  expirationDays?: number;
}

interface Television {
  id: string;
  videos: Video[];
  caption: string;
  backendUrl: string;
  serverStatus?: 'online' | 'offline' | 'checking';
}

export const useVideoCheck = (
  televisions: Television[],
  updateTelevision: (id: string, updates: Partial<Omit<Television, 'id'>>) => void
) => {
  const { toast } = useToast();

  const parseXmlAndGetExpirationDays = async (xmlUrl: string): Promise<number | undefined> => {
    try {
      console.log(`Fazendo download do XML: ${xmlUrl}`);
      const response = await fetch(xmlUrl);
      
      if (!response.ok) {
        console.log(`Erro ao baixar XML: ${response.status}`);
        return undefined;
      }

      const xmlText = await response.text();
      console.log('Conteúdo XML recebido:', xmlText);
      
      // Parse do XML usando DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Verificar se há erros no parsing
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('Erro no parsing do XML:', parseError.textContent);
        return undefined;
      }

      // Procurar por diferentes possíveis tags de expiração
      let expirationDateStr = '';
      
      // Tentar diferentes formatos possíveis de tags
      const possibleTags = [
        'expiration',
        'expirationDate', 
        'validUntil',
        'expires',
        'dataExpiracao',
        'prazoValidade'
      ];

      for (const tagName of possibleTags) {
        const element = xmlDoc.querySelector(tagName);
        if (element && element.textContent) {
          expirationDateStr = element.textContent.trim();
          console.log(`Encontrada data de expiração na tag ${tagName}: ${expirationDateStr}`);
          break;
        }
      }

      if (!expirationDateStr) {
        console.log('Nenhuma tag de expiração encontrada no XML');
        return undefined;
      }

      // Parse da data de expiração
      const expirationDate = new Date(expirationDateStr);
      
      if (isNaN(expirationDate.getTime())) {
        console.error('Data de expiração inválida:', expirationDateStr);
        return undefined;
      }

      // Calcular dias restantes
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
      
      const expiration = new Date(expirationDate);
      expiration.setHours(0, 0, 0, 0);
      
      const diffTime = expiration.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`Data de expiração: ${expiration.toLocaleDateString()}`);
      console.log(`Hoje: ${today.toLocaleDateString()}`);
      console.log(`Dias restantes: ${diffDays}`);
      
      return diffDays;
      
    } catch (error) {
      console.error('Erro ao processar XML:', error);
      return undefined;
    }
  };

  const checkServerStatus = async (television: Television) => {
    // Marcar como "checking" antes de fazer a verificação
    updateTelevision(television.id, { serverStatus: 'checking' });
    
    try {
      const response = await fetch(`${television.backendUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        updateTelevision(television.id, { serverStatus: 'online' });
        console.log(`Servidor ${television.backendUrl} está online`);
      } else {
        updateTelevision(television.id, { serverStatus: 'offline' });
        console.log(`Servidor ${television.backendUrl} retornou erro: ${response.status}`);
      }
    } catch (error) {
      updateTelevision(television.id, { serverStatus: 'offline' });
      console.error(`Servidor ${television.backendUrl} está offline:`, error);
    }
  };

  const checkVideosExist = async (television: Television) => {
    try {
      console.log(`Verificando vídeos para ${television.caption} em ${television.backendUrl}`);
      
      const response = await fetch(`${television.backendUrl}/check`);
      
      if (!response.ok) {
        console.log(`Servidor ${television.backendUrl} não está disponível`);
        updateTelevision(television.id, { serverStatus: 'offline' });
        return;
      }

      // Se chegou até aqui, o servidor está online
      updateTelevision(television.id, { serverStatus: 'online' });

      const result = await response.json();
      
      if (result.success && result.videos && Array.isArray(result.videos)) {
        console.log(`${result.videos.length} vídeos encontrados para ${television.caption}`);
        
        // Buscar informações de expiração para cada vídeo via XML
        console.log('Processando arquivos XML para informações de expiração...');
        const videosWithExpiration = await Promise.all(
          result.videos.map(async (video: Video) => {
            try {
              // Construir URL do XML baseada no vídeo
              const xmlFilename = video.filename.replace('.mp4', '.xml');
              const xmlUrl = `${television.backendUrl}/xml/${xmlFilename}`;
              
              console.log(`Processando XML: ${xmlUrl}`);
              const expirationDays = await parseXmlAndGetExpirationDays(xmlUrl);
              
              if (expirationDays !== undefined) {
                console.log(`Expiração obtida do XML para ${video.filename}: ${expirationDays} dias`);
                return { ...video, expirationDays };
              } else {
                console.log(`Não foi possível obter expiração do XML para ${video.filename}`);
                return video;
              }
              
            } catch (error) {
              console.error(`Erro ao processar XML para ${video.filename}:`, error);
              return video;
            }
          })
        );
        
        console.log('Vídeos com informação de expiração processada:', videosWithExpiration);
        updateTelevision(television.id, {
          videos: videosWithExpiration
        });
      } else {
        console.log(`Nenhum vídeo encontrado para ${television.caption}`);
        
        updateTelevision(television.id, {
          videos: []
        });
      }
    } catch (error) {
      console.error(`Erro ao verificar vídeos para ${television.caption}:`, error);
      updateTelevision(television.id, { serverStatus: 'offline' });
    }
  };

  useEffect(() => {
    // Verificar todos os televisores quando o componente for montado
    televisions.forEach(television => {
      checkVideosExist(television);
    });
  }, []); // Executar apenas uma vez quando o componente for montado

  return { checkVideosExist, checkServerStatus };
};
