import { motion } from "framer-motion"
import { Quote } from "../ui/Typography"
import type { Pattern } from "../../types/models"

interface PatternCardProps {
  pattern: Pattern
  index: number
}

export function PatternCard({ pattern, index }: PatternCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-8 bg-transparent border-l-2 border-accent/30 hover:border-accent transition-colors"
    >
      <Quote className="text-foreground/90 text-lg md:text-xl not-italic">{pattern.text}</Quote>
    </motion.div>
  )
}
