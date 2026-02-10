import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PORTUGAL_REGIONS } from "@/lib/regions";
import { Search } from "lucide-react";

interface ContributorsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  region: string;
  onRegionChange: (v: string) => void;
  printer: string;
  onPrinterChange: (v: string) => void;
  printerModels: string[];
  material: string;
  onMaterialChange: (v: string) => void;
  experience: string;
  onExperienceChange: (v: string) => void;
  buildVolume: string;
  onBuildVolumeChange: (v: string) => void;
}

const ContributorsFilters = ({
  search, onSearchChange,
  region, onRegionChange,
  printer, onPrinterChange,
  printerModels,
  material, onMaterialChange,
  experience, onExperienceChange,
  buildVolume, onBuildVolumeChange,
}: ContributorsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={region} onValueChange={onRegionChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Região" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as regiões</SelectItem>
          {PORTUGAL_REGIONS.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={printer} onValueChange={onPrinterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Impressora" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as impressoras</SelectItem>
          {printerModels.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={material} onValueChange={onMaterialChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos materiais</SelectItem>
          <SelectItem value="PETG">PETG</SelectItem>
          <SelectItem value="TPU">TPU</SelectItem>
        </SelectContent>
      </Select>
      <Select value={experience} onValueChange={onExperienceChange}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Experiência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda experiência</SelectItem>
          <SelectItem value="beginner">Iniciante</SelectItem>
          <SelectItem value="intermediate">Intermédio</SelectItem>
          <SelectItem value="expert">Experiente</SelectItem>
        </SelectContent>
      </Select>
      <Select value={buildVolume} onValueChange={onBuildVolumeChange}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Volume" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Qualquer volume</SelectItem>
          <SelectItem value="ok">≥ 256mm ✓</SelectItem>
          <SelectItem value="not_ok">Não confirmado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ContributorsFilters;
