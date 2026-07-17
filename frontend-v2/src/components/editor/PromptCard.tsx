import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface PromptCardProps {
  prompt: string
}

export function PromptCard({ prompt }: PromptCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center space-x-3 mb-8 py-3 px-4 bg-accent/5 rounded-md border border-accent/10 w-max max-w-full"
    >
      <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
      <span className="font-serif italic text-accent/80 text-lg leading-tight truncate">{prompt}</span>
    </motion.div>
  )
}
