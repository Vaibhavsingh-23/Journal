import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"
import type { ReflectionTimelineItem } from "../../types/models"

interface ReflectionTimelineProps {
  items: ReflectionTimelineItem[]
}

export function ReflectionTimeline({ items }: ReflectionTimelineProps) {
  return (
    <div className="max-w-2xl mx-auto border-l border-border/50 ml-4 md:ml-8 pl-8 py-4 space-y-12 relative">
      {items.map((item, index) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute w-2.5 h-2.5 bg-border rounded-full -left-[37px] top-1.5 group-hover:bg-accent transition-colors" />
          
          <div className="flex flex-col">
            <Caption className="text-accent uppercase tracking-widest font-medium mb-1">{item.date}</Caption>
            <Body className="text-foreground group-hover:text-accent transition-colors">{item.title}</Body>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
