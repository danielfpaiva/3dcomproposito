import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, Target } from "lucide-react";
import { useRegionalStats } from "@/hooks/useDashboardStats";

interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const regionLayout: Region[] = [
  { id: "norte", name: "Norte", x: 25, y: 2, width: 28, height: 22 },
  { id: "centro", name: "Centro", x: 18, y: 24, width: 30, height: 20 },
  { id: "lisboa", name: "Lisboa", x: 15, y: 46, width: 22, height: 16 },
  { id: "alentejo", name: "Alentejo", x: 22, y: 62, width: 32, height: 18 },
  { id: "algarve", name: "Algarve", x: 20, y: 80, width: 30, height: 14 },
  { id: "acores", name: "Açores", x: 68, y: 10, width: 22, height: 18 },
  { id: "madeira", name: "Madeira", x: 68, y: 55, width: 22, height: 18 },
];

const RegionMap = () => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const { data: regionalStats = [] } = useRegionalStats();

  const getRegionPrinters = (regionId: string) => {
    const stat = regionalStats.find((s) => s.region === regionId);
    return stat?.printer_count ?? 0;
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-foreground mb-3">Impact by Region</h2>
          <p className="text-muted-foreground text-lg">Hover over a region to see printer activity</p>
        </div>

        <div className="relative bg-card rounded-2xl border border-border p-8 shadow-sm overflow-hidden">
          <div className="relative w-full aspect-[2/1] min-h-[300px]">
            {regionLayout.map((region) => {
              const isHovered = hoveredRegion === region.id;
              const printers = getRegionPrinters(region.id);
              const intensity = Math.min(printers / 30, 1);

              return (
                <motion.div
                  key={region.id}
                  className="absolute rounded-xl cursor-pointer transition-colors duration-200 flex items-center justify-center"
                  style={{
                    left: `${region.x}%`, top: `${region.y}%`,
                    width: `${region.width}%`, height: `${region.height}%`,
                    backgroundColor: isHovered ? `hsl(160 84% 39% / 0.25)` : `hsl(213 52% 24% / ${0.06 + intensity * 0.14})`,
                    borderWidth: 2,
                    borderColor: isHovered ? `hsl(160 84% 39% / 0.5)` : `hsl(213 52% 24% / 0.08)`,
                  }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: isHovered ? "hsl(160 84% 39%)" : `hsl(213 52% 24% / ${0.3 + intensity * 0.5})`,
                      }} />
                      <span className={`text-xs font-semibold ${isHovered ? "text-accent" : "text-foreground/40"}`}>{printers}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${isHovered ? "text-foreground/70" : "text-foreground/25"} hidden sm:block`}>{region.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {hoveredRegion && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-navy-deep text-primary-foreground px-5 py-4 rounded-xl shadow-lg border border-navy-light/20 min-w-[220px]"
              >
                <p className="font-bold text-base mb-2">{regionLayout.find((r) => r.id === hoveredRegion)?.name}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-accent" />
                    <span>{getRegionPrinters(hoveredRegion)} printers</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default RegionMap;
