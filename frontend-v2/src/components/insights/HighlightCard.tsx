import { motion } from "framer-motion"
import { Display, Subheading } from "../ui/Typography"
import type { Highlight } from "../../types/models"

interface HighlightCardProps {
  highlight: Highlight
  index: number
}

export function HighlightCard({ highlight, index }: HighlightCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-8 md:p-10 rounded-2xl bg-accent/5 border border-accent/10 flex flex-col items-center justify-center text-center h-full"
    >
      <Display className="text-3xl md:text-4xl text-accent mb-3">{highlight.value}</Display>
      <Subheading className="text-secondary-foreground text-sm uppercase tracking-widest">{highlight.label}</Subheading>
    </motion.div>
  )
}
