import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Printer, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const HeroSection = () => {
  const { data: stats } = useDashboardStats();

  const statItems = [
    { icon: Users, value: stats?.total_contributors ?? 0, label: "Contributors Joined" },
    { icon: Printer, value: stats?.parts_completed ?? 0, label: "Parts Completed" },
    { icon: Heart, value: stats?.wheelchairs_completed ?? 0, label: "Wheelchairs Completed" },
  ];

  return (
    <section className="relative bg-navy-gradient pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-sm font-medium text-emerald-light">Live Mission — Portugal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground leading-tight mb-6">
            Transform scattered prints into<br />
            <span className="text-gradient-hero">collective impact.</span>
          </h1>

          <p className="text-lg text-primary-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Coordinate distributed 3D printing of wheelchair parts for charity.
            Every printer matters. Every part counts. Every chair changes a life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/contribute">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-bold text-base px-8 py-6 rounded-xl glow-accent">
                Join the Mission <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-medium text-base px-8 py-6 rounded-xl bg-transparent">
              See How It Works
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {statItems.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm">
              <stat.icon className="w-5 h-5 text-accent mb-3" />
              <span className="text-3xl font-black text-primary-foreground animate-count-up">{stat.value}</span>
              <span className="text-sm text-primary-foreground/50 mt-1">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
