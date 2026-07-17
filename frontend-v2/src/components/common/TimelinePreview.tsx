import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"
import type { TimelineEvent } from "../../types/models"

interface TimelinePreviewProps {
  events: TimelineEvent[]
}

export function TimelinePreview({ events }: TimelinePreviewProps) {
  return (
    <div className="relative border-l border-border/50 ml-4 space-y-8 py-4">
      {events.map((event, index) => (
        <motion.div 
          key={event.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
          className="relative pl-8 group cursor-pointer"
        >
          {/* Timeline Dot */}
          <div className="absolute w-2.5 h-2.5 bg-border rounded-full -left-[5px] top-2 group-hover:bg-accent transition-colors" />
          
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
              <Caption className="text-accent uppercase tracking-wider font-medium">{event.timestamp}</Caption>
              <span className="text-border">•</span>
              <Caption className="capitalize">{event.type}</Caption>
            </div>
            <Body className="text-foreground font-medium mb-1">{event.title}</Body>
            <Caption className="text-secondary-foreground line-clamp-2">{event.preview}</Caption>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
