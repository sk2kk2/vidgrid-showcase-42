import { useState, useEffect } from 'react';

export const useServerConfig = () => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Verificar query string primeiro
    const urlParams = new URLSearchParams(window.location.search);
    const serverParam = urlParams.get('server');
    
    if (serverParam) {
      const normalizedUrl = normalizeServerUrl(serverParam);
      setServerUrl(normalizedUrl);
      setIsConfigured(true);
      // Salvar no localStorage para próximas sessões
      localStorage.setItem('monitorServerUrl', normalizedUrl);
      return;
    }

    // Verificar localStorage
    const savedUrl = localStorage.getItem('monitorServerUrl');
    if (savedUrl) {
      setServerUrl(savedUrl);
      setIsConfigured(true);
      return;
    }

    // Verificar variável de ambiente
    const envUrl = import.meta.env.VITE_MONITOR_SERVER_URL;
    if (envUrl) {
      const normalizedUrl = normalizeServerUrl(envUrl);
      setServerUrl(normalizedUrl);
      setIsConfigured(true);
      return;
    }

    // Não configurado
    setIsConfigured(false);
  }, []);

  const updateServerUrl = (url: string) => {
    const normalizedUrl = normalizeServerUrl(url);
    setServerUrl(normalizedUrl);
    setIsConfigured(true);
    localStorage.setItem('monitorServerUrl', normalizedUrl);
  };

  const clearServerConfig = () => {
    setServerUrl(null);
    setIsConfigured(false);
    localStorage.removeItem('monitorServerUrl');
  };

  return {
    serverUrl,
    isConfigured,
    updateServerUrl,
    clearServerConfig
  };
};

const normalizeServerUrl = (url: string): string => {
  let normalized = url.trim();
  
  // Adicionar protocolo se necessário
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `http://${normalized}`;
  }
  
  // Remover barra final
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
};