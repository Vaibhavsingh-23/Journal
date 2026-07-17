import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"
import { Lightbulb } from "lucide-react"

interface InsightCardProps {
  text: string
  index: number
}

export function InsightCard({ text, index }: InsightCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className="group flex flex-col bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-secondary rounded-full text-accent mt-1">
          <Lightbulb className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex-1">
          <Body className="text-foreground leading-relaxed mb-3">{text}</Body>
          <Caption className="text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Explore this pattern &rarr;
          </Caption>
        </div>
      </div>
    </motion.div>
  )
}
