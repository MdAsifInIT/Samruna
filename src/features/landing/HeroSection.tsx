import { motion } from "framer-motion";
import { landingContent } from "./landingContent";

interface HeroSectionProps {
  onLaunch: () => void;
  onPrepareWorkspace: () => void;
}

export function HeroSection({ onLaunch, onPrepareWorkspace }: HeroSectionProps) {
  return (
    <section 
      className="landing-hero-section relative flex flex-col items-center justify-center pt-32 pb-24 px-6 text-center max-w-5xl mx-auto" 
      aria-label="Product landing page"
    >
      
      {/* Vibrant Light Source for Glassmorphism */}
      <div className="landing-hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-8 relative z-10 bg-white/55 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[40px] p-8 md:p-16 w-full"
      >
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-black/5 shadow-sm mb-2"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#A16207] animate-pulse" />
          <span className="text-xs font-semibold text-[#404040] tracking-widest uppercase">Platform 2.0 Live</span>
        </div>

        <h1 
          className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold tracking-tight text-[#020617] leading-[1.1] pb-2"
          style={{ fontFamily: "'Lexend', sans-serif" }}
        >
          {landingContent.hero.title}
        </h1>
        
        <p 
          className="text-lg md:text-xl text-[#404040] max-w-2xl text-balance leading-relaxed font-medium"
        >
          {landingContent.hero.description}
        </p>

        {/* 3 Benefit Bullets from pattern */}
        <div 
          className="flex flex-col sm:flex-row gap-6 mt-2 text-sm font-semibold text-[#020617]"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0369A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Automated discovery
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0369A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Governed execution
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0369A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Enterprise ready
          </span>
        </div>

        <div
          className="mt-6 flex flex-col items-center w-full sm:w-auto"
        >
          <button
            type="button" 
            onClick={onLaunch}
            onMouseEnter={onPrepareWorkspace}
            onFocus={onPrepareWorkspace}
            className="landing-primary-cta w-full sm:w-auto bg-gradient-to-b from-[#0369A1] to-[#025687] hover:from-[#025687] hover:to-[#01426A] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_24px_rgba(3,105,161,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-[#024E79] flex items-center justify-center gap-3 group cursor-pointer"
          >
            {landingContent.hero.primaryCta}
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
              <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="mt-4 text-sm font-semibold text-[#475569]">Demo data · simulated execution · no external systems modified</p>
        </div>
      </motion.div>
    </section>
  );
}
