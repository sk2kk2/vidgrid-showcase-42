import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServerConfigProps {
  onServerSet: (url: string) => void;
  initialUrl?: string;
}

const ServerConfig = ({ onServerSet, initialUrl = '' }: ServerConfigProps) => {
  const [serverUrl, setServerUrl] = useState(initialUrl);
  const [isConnecting, setIsConnecting] = useState(false);

  // Detectar IP local para sugestão
  useEffect(() => {
    if (!initialUrl) {
      // Sugerir IP comum da rede local
      const suggestions = ['192.168.1.100:3000', '192.168.0.100:3000'];
      setServerUrl(`http://${suggestions[0]}`);
    }
  }, [initialUrl]);

  const handleConnect = async () => {
    if (!serverUrl.trim()) return;

    setIsConnecting(true);
    
    try {
      // Normalizar URL
      let url = serverUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      
      // Testar conexão
      const response = await fetch(`${url}/status`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        // Salvar no localStorage
        localStorage.setItem('monitorServerUrl', url);
        onServerSet(url);
      } else {
        throw new Error('Servidor não respondeu corretamente');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('Erro ao conectar com o servidor. Verifique o endereço e tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-tv-screen border-tv-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground">Monitor de Vídeos</CardTitle>
          <p className="text-muted-foreground">Configure o endereço do servidor</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Endereço do Servidor
            </label>
            <Input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="http://192.168.1.100:3000"
              className="bg-input border-border text-foreground"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Exemplo: http://192.168.1.100:3000
            </p>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={!serverUrl.trim() || isConnecting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Certifique-se que o servidor está rodando</p>
            <p>• Use o IP da máquina onde está o backend</p>
            <p>• Teste primeiro no navegador: http://IP:3000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerConfig;