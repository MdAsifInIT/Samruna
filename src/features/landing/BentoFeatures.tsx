import { motion } from "framer-motion";
import { landingContent } from "./landingContent";
import { cn } from "./utils";

export function BentoFeatures() {
  return (
    <section className="max-w-6xl mx-auto px-6 mb-32" aria-label="Landing workflow blocks">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {landingContent.stages.map((stage, i) => (
          <BentoCard key={stage.id} stage={stage} index={i} />
        ))}
      </div>
    </section>
  );
}

function BentoCard({ stage, index }: { stage: typeof landingContent.stages[0], index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[32px] p-8 md:p-10",
        "bg-white/60 backdrop-blur-lg border border-[#E0F2FE] shadow-[0_8px_24px_rgba(3,105,161,0.05)]",
        "hover:shadow-[0_16px_40px_rgba(3,105,161,0.1)] transition-all duration-300 hover:-translate-y-1",
        "flex flex-col gap-4 group"
      )}
    >
      <span className="text-sm font-mono text-[#0369A1]">{stage.id}</span>
      <h3 className="text-2xl font-bold text-[#0C4A6E]" style={{ fontFamily: "'Lexend', sans-serif" }}>{stage.title}</h3>
      <p className="text-[#334155] leading-relaxed font-medium">{stage.description}</p>
    </motion.article>
  );
}
