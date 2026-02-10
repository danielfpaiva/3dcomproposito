import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contributor {
  id: string;
  name: string;
  printer_model: string;
}

interface PartAssignmentSelectProps {
  value: string | null;
  contributors: Contributor[];
  onAssign: (contributorId: string | null) => void;
  disabled?: boolean;
}

const PartAssignmentSelect = ({ value, contributors, onAssign, disabled }: PartAssignmentSelectProps) => {
  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onAssign(v === "none" ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <SelectValue placeholder="Atribuir voluntário" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nenhum</SelectItem>
        {contributors.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name} ({c.printer_model})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PartAssignmentSelect;
