import { Button } from "@/components/ui/button";
import { Grid, List, LayoutGrid } from "lucide-react";
import { ViewMode } from "@/types/television";

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector = ({ currentMode, onModeChange }: ViewModeSelectorProps) => {
  const modes = [
    { id: 'grid' as ViewMode, icon: Grid, label: 'Grade' },
    { id: 'list' as ViewMode, icon: List, label: 'Lista' },
    { id: 'compact' as ViewMode, icon: LayoutGrid, label: 'Compacto' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      {modes.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant={currentMode === id ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange(id)}
          className={`flex items-center gap-2 ${
            currentMode === id 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "hover:bg-background"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};