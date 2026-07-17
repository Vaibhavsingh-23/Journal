import { motion } from "framer-motion"
import { Body, Subheading } from "../ui/Typography"
import { Sparkles } from "lucide-react"

interface ReflectionCardProps {
  category: string
  text: string
  index: number
}

export function ReflectionCard({ category, text, index }: ReflectionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="bg-card p-8 rounded-xl border border-border/50 shadow-sm relative overflow-hidden group hover:border-accent/30 transition-colors"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-accent stroke-[2]" />
        <Subheading className="text-accent text-xs">{category}</Subheading>
      </div>
      
      <Body className="text-foreground leading-relaxed">{text}</Body>
    </motion.div>
  )
}
