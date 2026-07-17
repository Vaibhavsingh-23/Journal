import { motion } from "framer-motion"
import { Display, Body, Caption } from "../ui/Typography"
import type { Memory } from "../../types/models"

interface FeaturedMemoryCardProps {
  memory: Memory
  index: number
  onClick: (memory: Memory) => void
}

export function FeaturedMemoryCard({ memory, index, onClick }: FeaturedMemoryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      onClick={() => onClick(memory)}
      className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[4/3] md:aspect-[16/9] w-full flex items-end"
    >
      <div className="absolute inset-0 z-0">
        <img 
          src={memory.coverImage} 
          alt={memory.title}
          className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      <div className="relative z-10 p-8 md:p-12 w-full max-w-3xl">
        <div className="flex items-center space-x-3 mb-4">
          <Caption className="text-white/80 uppercase tracking-widest">{memory.dateRange}</Caption>
          <span className="text-white/40">•</span>
          <Caption className="text-white/80">{memory.journalCount} entries</Caption>
        </div>
        <Display className="text-white mb-4 drop-shadow-sm">{memory.title}</Display>
        <Body className="text-white/90 line-clamp-2 md:line-clamp-3">{memory.summary}</Body>
      </div>
    </motion.div>
  )
}
