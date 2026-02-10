import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RegionMap from "@/components/RegionMap";
import ProgressSection from "@/components/ProgressSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <RegionMap />
      <ProgressSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
