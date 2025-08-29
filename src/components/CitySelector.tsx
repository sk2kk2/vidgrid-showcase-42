import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Television } from "@/types/television";
import { MapPin } from "lucide-react";

interface CitySelectorProps {
  televisions: Television[];
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const CitySelector = ({ televisions, selectedCity, onCityChange }: CitySelectorProps) => {
  // Extract unique cities from televisions
  const cities = Array.from(new Set(televisions.map(tv => tv.cidade))).sort();

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-5 w-5 text-muted-foreground" />
      <Select value={selectedCity} onValueChange={onCityChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtrar por cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as cidades</SelectItem>
          {cities.map((cidade) => (
            <SelectItem key={cidade} value={cidade}>
              {cidade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};