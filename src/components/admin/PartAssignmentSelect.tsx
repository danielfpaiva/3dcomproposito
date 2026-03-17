import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Contributor {
  id: string;
  name: string;
  printer_models: string[];
  region?: string;
  materials?: string[];
  experience_level?: string;
  build_volume_ok?: boolean;
  build_plate_size?: string | null;
}

interface PartAssignmentSelectProps {
  value: string | null;
  contributors: Contributor[];
  onAssign: (contributorId: string | null) => void;
  disabled?: boolean;
  allocatedContributorIds?: string[]; // IDs of contributors already allocated in this project
  contributorPartCounts?: Record<string, number>; // Number of parts assigned to each contributor
}

const regionLabels: Record<string, string> = {
  norte: "Norte",
  centro: "Centro",
  lisboa: "Lisboa",
  alentejo: "Alentejo",
  algarve: "Algarve",
  acores: "Açores",
  madeira: "Madeira",
};

const PartAssignmentSelect = ({ value, contributors, onAssign, disabled, allocatedContributorIds = [], contributorPartCounts = {} }: PartAssignmentSelectProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contributors by search term
  const filteredContributors = contributors.filter((c) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.printer_models?.some((p) => p.toLowerCase().includes(search)) ||
      c.materials?.some((m) => m.toLowerCase().includes(search))
    );
  });

  // Group contributors by region
  const grouped = filteredContributors.reduce<Record<string, Contributor[]>>((acc, c) => {
    const region = c.region || "outro";
    if (!acc[region]) acc[region] = [];
    acc[region].push(c);
    return acc;
  }, {});

  const regionKeys = Object.keys(grouped).sort((a, b) => {
    const order = ["norte", "centro", "lisboa", "alentejo", "algarve", "acores", "madeira"];
    return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
  });

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onAssign(v === "none" ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[220px] h-8 text-xs">
        <SelectValue placeholder="Atribuir voluntário" />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b sticky top-0 bg-background z-10">
          <Input
            placeholder="Pesquisar voluntário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        <SelectItem value="none">Nenhum</SelectItem>
        {regionKeys.length === 0 && searchTerm && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhum voluntário encontrado
          </div>
        )}
        {regionKeys.map((region) => (
          <SelectGroup key={region}>
            <SelectLabel className="text-xs font-bold text-muted-foreground uppercase">
              {regionLabels[region] ?? region}
            </SelectLabel>
            {grouped[region].map((c) => {
              const expLabel = c.experience_level === "expert" ? "⭐" : c.experience_level === "beginner" ? "🔰" : "";
              const volWarn = c.build_volume_ok === false ? " ⚠️" : "";
              const plate = c.build_plate_size ? ` · ${c.build_plate_size}` : "";
              const isAllocated = allocatedContributorIds.includes(c.id);
              const partCount = contributorPartCounts[c.id] || 0;
              const countLabel = partCount > 0 ? ` [${partCount} peça${partCount > 1 ? "s" : ""}]` : " [0 peças]";
              return (
                <SelectItem key={c.id} value={c.id} disabled={isAllocated}>
                  {expLabel}{c.name}{countLabel} · {c.printer_models?.join(", ") || "—"}{plate} {c.materials?.length ? `· ${c.materials.join("/")}` : ""}{volWarn}
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PartAssignmentSelect;
