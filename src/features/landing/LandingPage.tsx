import { BrandLogo } from "../../components/shared/BrandLogo";
import { HeroSection } from "./HeroSection";
import { WorkGraphAnimation } from "./WorkGraphAnimation";
import { BentoFeatures } from "./BentoFeatures";
import { FinalCta } from "./FinalCta";

interface LandingPageProps {
  aiProviderLabel: string;
  scenarioLabel: string;
  scenarioName: string;
  onLaunch: () => void;
}

export function LandingPage({
  aiProviderLabel,
  scenarioLabel,
  scenarioName,
  onLaunch
}: LandingPageProps) {
  return (
    <main 
      className="min-h-screen bg-[#F8FAFC] selection:bg-[#0369A1]/20 relative overflow-hidden"
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
    >
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50" aria-label="Landing navigation">
        <BrandLogo variant="landing" />
      </header>

      <HeroSection onLaunch={onLaunch} />
      
      <WorkGraphAnimation 
        aiProviderLabel={aiProviderLabel}
        scenarioLabel={scenarioLabel}
        scenarioName={scenarioName}
      />
      
      <BentoFeatures />
      
      <FinalCta onLaunch={onLaunch} />
    </main>
  );
}
