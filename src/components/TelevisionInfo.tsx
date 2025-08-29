import { Television } from "@/types/television";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tv, ExternalLink, Video } from "lucide-react";

interface TelevisionInfoProps {
  televisions: Television[];
}

export const TelevisionInfo = ({ televisions }: TelevisionInfoProps) => {
  const openGoogleMaps = (coordenadas: { lat: number; lng: number }, cidade: string) => {
    const url = `https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lng}&z=15&t=m&hl=pt-BR`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Verificando';
      default:
        return 'Desconhecido';
    }
  };

  if (televisions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Tv className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Televisores Ativos ({televisions.length})</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {televisions.map((tv) => (
          <Card key={tv.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold">
                    TV {tv.numero}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(tv.serverStatus)}`} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {getStatusText(tv.serverStatus)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{tv.cidade}</span>
                  <span className="text-muted-foreground">• {tv.estado}</span>
                </div>
                
                {tv.caption && (
                  <p className="text-xs text-muted-foreground truncate">
                    {tv.caption}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>{tv.videos.length} vídeos</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => openGoogleMaps(tv.coordenadas, tv.cidade)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Mapa
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground font-mono">
                  {tv.coordenadas.lat.toFixed(4)}, {tv.coordenadas.lng.toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};