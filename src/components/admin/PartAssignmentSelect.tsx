import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contributor {
  id: string;
  name: string;
  printer_model: string;
  region?: string;
  materials?: string[];
  experience_level?: string;
  build_volume_ok?: boolean;
}

interface PartAssignmentSelectProps {
  value: string | null;
  contributors: Contributor[];
  onAssign: (contributorId: string | null) => void;
  disabled?: boolean;
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

const PartAssignmentSelect = ({ value, contributors, onAssign, disabled }: PartAssignmentSelectProps) => {
  // Group contributors by region
  const grouped = contributors.reduce<Record<string, Contributor[]>>((acc, c) => {
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
        <SelectItem value="none">Nenhum</SelectItem>
        {regionKeys.map((region) => (
          <SelectGroup key={region}>
            <SelectLabel className="text-xs font-bold text-muted-foreground uppercase">
              {regionLabels[region] ?? region}
            </SelectLabel>
            {grouped[region].map((c) => {
              const expLabel = c.experience_level === "expert" ? "⭐" : c.experience_level === "beginner" ? "🔰" : "";
              const volWarn = c.build_volume_ok === false ? " ⚠️" : "";
              return (
                <SelectItem key={c.id} value={c.id}>
                  {expLabel}{c.name} · {c.printer_model} {c.materials?.length ? `· ${c.materials.join("/")}` : ""}{volWarn}
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
