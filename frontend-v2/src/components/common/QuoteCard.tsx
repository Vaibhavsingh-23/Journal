import { motion } from "framer-motion"
import { Quote } from "../ui/Typography"
import { Sparkles } from "lucide-react"

interface QuoteCardProps {
  quote: string
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm h-full justify-center relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Sparkles className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent stroke-[1.5]" />
          <span className="font-sans text-xs uppercase tracking-widest text-secondary-foreground font-medium">Today's Reflection</span>
        </div>
        <Quote className="text-foreground leading-relaxed">{quote}</Quote>
      </div>
    </motion.div>
  )
}
