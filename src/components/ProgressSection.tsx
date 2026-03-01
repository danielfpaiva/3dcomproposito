import { motion } from "framer-motion";
import { Target, TrendingUp, Package, Heart } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const ProgressSection = () => {
  const { data: stats } = useDashboardStats();

  console.log('📊 ProgressSection - Raw stats from API:', stats);
  console.log('📊 ProgressSection - total_requests:', stats?.total_requests);
  console.log('📊 ProgressSection - wheelchairs_completed:', stats?.wheelchairs_completed);
  console.log('📊 ProgressSection - parts_in_progress:', stats?.parts_in_progress);
  console.log('📊 ProgressSection - total_parts:', stats?.total_parts);
  console.log('📊 ProgressSection - parts_completed:', stats?.parts_completed);

  const completed = stats?.wheelchairs_completed ?? 0;
  const totalRequests = stats?.total_requests ?? 0;
  const target = Math.max(totalRequests, 10);
  const percent = target > 0 ? Math.round((completed / target) * 100) : 0;

  console.log('📊 ProgressSection - Calculated values:');
  console.log('  completed:', completed);
  console.log('  totalRequests:', totalRequests);
  console.log('  target:', target);
  console.log('  percent:', percent);

  return (
    <section className="py-20 px-6 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-foreground mb-3">Progresso da Missão</h2>
          <p className="text-muted-foreground text-lg">A acompanhar o nosso impacto coletivo em tempo real</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <div className="mb-8">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Cadeiras Concluídas</p>
                <p className="text-4xl font-black text-foreground">
                  {completed} <span className="text-lg font-medium text-muted-foreground">/ {target}</span>
                </p>
              </div>
              <span className="text-2xl font-bold text-accent">{percent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }} className="h-4 rounded-full bg-gradient-to-r from-accent to-emerald-light" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Target, label: "Peças em Progresso", value: stats?.parts_in_progress ?? 0, color: "text-accent" },
              { icon: TrendingUp, label: "Total de Peças", value: stats?.total_parts ?? 0, color: "text-emerald-light" },
              { icon: Package, label: "Peças Concluídas", value: stats?.parts_completed ?? 0, color: "text-navy-light" },
              { icon: Heart, label: "Total Doado", value: `${Math.floor((stats?.total_donated_cents ?? 0) / 100)}€`, color: "text-rose-500" },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/60">
                <metric.icon className={`w-5 h-5 ${metric.color} shrink-0`} />
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProgressSection;
