import React from "react"
import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"

interface MemoryCardProps {
  title: string
  date: string
  sentence: string
  thumbnailUrl?: string
  index: number
}

export const MemoryCard = React.memo(function MemoryCard({ title, date, sentence, thumbnailUrl, index }: MemoryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
      className="group flex flex-col bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden h-full"
    >
      {thumbnailUrl && (
        <div className="h-40 w-full overflow-hidden border-b border-border/50">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <Caption className="text-accent uppercase tracking-wider mb-2 font-medium">{date}</Caption>
        <Body className="text-foreground flex-1 mb-4">"{sentence}"</Body>
        <Caption className="text-secondary-foreground mt-auto">— {title}</Caption>
      </div>
    </motion.div>
  )
})
