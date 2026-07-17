import React from "react"
import { motion } from "framer-motion"
import { Heading, Body, Caption } from "../ui/Typography"
import { ArrowRight, Edit3 } from "lucide-react"

interface JournalCardProps {
  title: string
  previewText: string
  updatedAt: string
}

export const JournalCard = React.memo(function JournalCard({ title, previewText, updatedAt }: JournalCardProps) {
  const dateStr = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="group flex flex-col bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full"
    >
      <div className="flex items-center justify-between mb-4 text-accent">
        <Edit3 className="w-5 h-5 stroke-[1.5]" />
        <Caption className="text-secondary-foreground font-medium uppercase tracking-wider">Continue Writing</Caption>
      </div>
      <Heading className="mb-3 group-hover:text-accent transition-colors">{title}</Heading>
      <Body className="text-secondary-foreground mb-6 line-clamp-3 flex-1">{previewText}</Body>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <Caption>Last edited {dateStr}</Caption>
        <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  )
})
