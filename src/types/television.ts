export interface Video {
  filename: string;
  url: string;
  downloadUrl: string;
  size: number;
  created: string;
  expirationDays?: number;
}

export interface Television {
  id: string;
  numero: number;
  videos: Video[];
  caption: string;
  backendUrl: string;
  cidade: string;
  estado: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  serverStatus?: 'online' | 'offline' | 'checking';
}

export type ViewMode = 'grid' | 'list' | 'compact';