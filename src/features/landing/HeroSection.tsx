import { motion } from "framer-motion";
import { landingContent } from "./landingContent";

interface HeroSectionProps {
  onLaunch: () => void;
}

export function HeroSection({ onLaunch }: HeroSectionProps) {
  return (
    <section 
      className="relative flex flex-col items-center justify-center pt-32 pb-24 px-6 text-center max-w-5xl mx-auto" 
      aria-label="Product landing page"
    >
      
      {/* Vibrant Light Source for Glassmorphism */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-[#0F172A]/15 to-[#0369A1]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }}
        className="flex flex-col items-center gap-8 relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[40px] p-8 md:p-16 w-full"
      >
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-black/5 shadow-sm mb-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="flex h-2 w-2 rounded-full bg-[#A16207] animate-pulse" />
          <span className="text-xs font-semibold text-[#404040] tracking-widest uppercase">Platform 2.0 Live</span>
        </motion.div>

        <motion.h1 
          className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold tracking-tight text-[#020617] leading-[1.1] pb-2"
          style={{ fontFamily: "'Lexend', sans-serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {landingContent.hero.title}
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-[#404040] max-w-2xl text-balance leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {landingContent.hero.description}
        </motion.p>

        {/* 3 Benefit Bullets from pattern */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 mt-2 text-sm font-semibold text-[#020617]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-col items-center w-full sm:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            onClick={onLaunch}
            className="w-full sm:w-auto bg-gradient-to-b from-[#0369A1] to-[#025687] hover:from-[#025687] hover:to-[#01426A] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_24px_rgba(3,105,161,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-[#024E79] transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
          >
            {landingContent.hero.primaryCta}
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
              <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
