import { motion } from "framer-motion";
import { landingContent } from "./landingContent";

interface FinalCtaProps {
  onLaunch: () => void;
}

export function FinalCta({ onLaunch }: FinalCtaProps) {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mb-24" aria-label="Impact evidence">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="relative w-full rounded-[40px] bg-[#0F172A] text-white overflow-hidden p-12 md:p-20 text-center shadow-[0_24px_64px_rgba(15,23,42,0.3)]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0369A1]/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white" style={{ fontFamily: "'Lexend', sans-serif" }}>
            {landingContent.proof.title}
          </h2>
          <motion.p
            className="text-lg md:text-xl text-[#E8ECF0] max-w-2xl mx-auto mb-10 font-medium"
          >
            {landingContent.proof.subtitle}
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onLaunch}
            className="bg-white text-[#0F172A] hover:bg-gray-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-3 mx-auto group relative z-10"
          >
            Open workspace
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
              <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
