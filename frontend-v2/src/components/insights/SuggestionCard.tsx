import { motion } from "framer-motion"
import { Body } from "../ui/Typography"
import { Lightbulb } from "lucide-react"
import type { Suggestion } from "../../types/models"

interface SuggestionCardProps {
  suggestion: Suggestion
  index: number
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="flex items-start space-x-4 p-6 bg-card border border-border/50 rounded-xl"
    >
      <div className="p-2 bg-accent/10 rounded-full flex-shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 text-accent" />
      </div>
      <Body className="text-foreground/90">{suggestion.text}</Body>
    </motion.div>
  )
}
