import { motion } from "framer-motion";

interface WorkGraphAnimationProps {
  aiProviderLabel: string;
  scenarioLabel: string;
  scenarioName: string;
}

export function WorkGraphAnimation({ aiProviderLabel, scenarioLabel, scenarioName }: WorkGraphAnimationProps) {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mb-32" aria-label="Workflow visualization">
      <div className="relative w-full rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0369A1]/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative z-10 gap-4">
          <h2 className="text-2xl font-bold text-[#020617]" style={{ fontFamily: "'Lexend', sans-serif" }}>{scenarioName}</h2>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/80 px-4 py-2 rounded-full text-[#0369A1] border border-white shadow-sm">
            {aiProviderLabel}
          </span>
        </div>

        {/* Abstract Workflow Visual */}
        <div className="relative h-64 md:h-80 w-full flex items-center justify-center" aria-label="Samruna product preview">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <motion.path
              d="M 0,100 L 1000,100"
              fill="transparent"
              stroke="#0369A1"
              strokeWidth="2"
              strokeDasharray="8 8"
              initial={{ strokeDashoffset: 16 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="opacity-30"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10" aria-label="Connected automation path">
            <Node title="Pattern found" subtitle={scenarioLabel} delay={0} />
            <Node title="Proposal ready" subtitle="Governed proposal" delay={0.2} />
            <Node title="Execution gated" subtitle="Approval required" delay={0.4} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Node({ title, subtitle, delay }: { title: string; subtitle: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="flex flex-col items-center text-center p-6 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-md hover:shadow-lg transition-shadow"
    >
      <span className="text-sm font-bold text-[#020617] mb-1">{title}</span>
      <span className="text-xs font-medium text-[#404040]">{subtitle}</span>
    </motion.div>
  );
}
