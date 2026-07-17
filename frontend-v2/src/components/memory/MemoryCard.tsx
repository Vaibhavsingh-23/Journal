import { motion } from "framer-motion"
import { Heading, Body, Caption } from "../ui/Typography"
import type { Memory } from "../../types/models"

interface MemoryCardProps {
  memory: Memory
  index: number
  onClick: (memory: Memory) => void
}

export function MemoryCard({ memory, index, onClick }: MemoryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      onClick={() => onClick(memory)}
      className="group cursor-pointer flex flex-col h-full bg-transparent"
    >
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-5">
        <img 
          src={memory.coverImage} 
          alt={memory.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      
      <div className="flex items-center space-x-2 mb-3">
        <Caption className="text-accent uppercase tracking-widest">{memory.category}</Caption>
        <span className="text-border">•</span>
        <Caption className="text-secondary-foreground">{memory.journalCount} entries</Caption>
      </div>
      
      <Heading className="text-foreground group-hover:text-accent transition-colors mb-2 line-clamp-1">{memory.title}</Heading>
      <Body className="text-secondary-foreground line-clamp-2 text-sm">{memory.summary}</Body>
    </motion.div>
  )
}
