import { motion } from "framer-motion"
import { Heading, Body, Caption } from "../ui/Typography"
import type { Theme } from "../../types/models"

interface ThemeCardProps {
  theme: Theme
  index: number
}

export function ThemeCard({ theme, index }: ThemeCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-8 md:p-10 border border-border/60 rounded-2xl bg-card hover:border-accent/40 transition-colors"
    >
      <div className="mb-6">
        <Caption className="text-accent uppercase tracking-widest font-medium mb-2">{theme.frequency}</Caption>
        <Heading className="text-foreground">{theme.name}</Heading>
      </div>
      <Body className="text-secondary-foreground leading-relaxed">{theme.explanation}</Body>
    </motion.div>
  )
}
