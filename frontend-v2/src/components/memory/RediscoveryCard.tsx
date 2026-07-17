import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"
import { ArrowRight, Lightbulb } from "lucide-react"
import type { Rediscovery } from "../../types/models"

interface RediscoveryCardProps {
  rediscovery: Rediscovery
  index: number
}

export function RediscoveryCard({ rediscovery, index }: RediscoveryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer bg-accent/5 hover:bg-accent/10 border border-accent/10 hover:border-accent/20 p-6 rounded-2xl transition-all duration-300"
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-background rounded-full border border-accent/20 flex-shrink-0 mt-1">
          <Lightbulb className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1">
          <Body className="text-foreground/90 mb-3 text-balance">{rediscovery.text}</Body>
          <div className="flex items-center text-accent group-hover:text-accent/80 transition-colors">
            <Caption className="font-medium tracking-wide">{rediscovery.actionText}</Caption>
            <ArrowRight className="w-3.5 h-3.5 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
