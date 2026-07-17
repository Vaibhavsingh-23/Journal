import React from "react"
import { motion } from "framer-motion"
import { Heading, Body, Caption, Subheading, Quote } from "../ui/Typography"
import { cn } from "../../lib/utils"
import type { TimelineEvent } from "../../types/models"

interface TimelineEventItemProps {
  event: TimelineEvent
  index: number
  isLast?: boolean
}

export const TimelineEventItem = React.memo(function TimelineEventItem({ event, isLast = false }: TimelineEventItemProps) {
  
  // Visual styling based on event type
  const getEventStyles = () => {
    switch (event.type) {
      case 'MILESTONE':
        return "bg-foreground text-background border-foreground shadow-lg"
      case 'REFLECTION':
        return "bg-accent/5 border-accent/20"
      case 'INSIGHT':
        return "bg-secondary/20 border-border/60"
      case 'MEMORY':
        return "bg-card border-border/50"
      default: // JOURNAL
        return "bg-transparent border-transparent pl-0"
    }
  }

  const isMilestone = event.type === 'MILESTONE'
  const isReflection = event.type === 'REFLECTION'
  const isJournal = event.type === 'JOURNAL'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative flex gap-6 md:gap-10 pb-12"
    >
      {/* Timeline Center Line */}
      {!isLast && (
        <div className="absolute left-[39px] top-8 bottom-0 w-px bg-border/40" />
      )}
      
      {/* Date Column (Left) */}
      <div className="w-[80px] shrink-0 text-right pt-1 hidden md:block">
        <Caption className="text-secondary-foreground uppercase tracking-widest">{event.date || event.timestamp || ""}</Caption>
      </div>

      {/* Node (Center) */}
      <div className="relative shrink-0 flex items-start justify-center pt-2 w-[24px] md:w-auto z-10">
        <div className={cn(
          "w-3 h-3 rounded-full ring-4 ring-background",
          isMilestone ? "bg-foreground w-4 h-4" : 
          event.type === 'INSIGHT' ? "bg-accent" : 
          "bg-border"
        )} />
      </div>

      {/* Content Column (Right) */}
      <div className={cn(
        "flex-1 rounded-2xl transition-colors",
        !isJournal && "p-6 md:p-8 border",
        getEventStyles()
      )}>
        
        {/* Mobile Date Header */}
        <Caption className="md:hidden text-secondary-foreground uppercase tracking-widest mb-3 block">
          {event.date || event.timestamp}
        </Caption>

        <div className="flex flex-col gap-4">
          <div>
            {!isJournal && (
              <Subheading className={cn(
                "text-[10px] uppercase tracking-widest mb-2 block",
                isMilestone ? "text-background/70" : "text-accent"
              )}>
                {event.type}
              </Subheading>
            )}
            <Heading className={cn(
              "text-xl md:text-2xl",
              isMilestone && "text-background"
            )}>
              {event.title}
            </Heading>
          </div>

          {event.imageUrl && (
            <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden my-2">
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          {isReflection ? (
            <Quote className="text-foreground/90 not-italic text-lg">{event.summary}</Quote>
          ) : (
            <Body className={cn(
              "leading-relaxed",
              isMilestone ? "text-background/90" : "text-secondary-foreground"
            )}>
              {event.summary}
            </Body>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {event.tags.map(tag => (
                <span 
                  key={tag} 
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    isMilestone ? "bg-background/20 text-background" : "bg-accent/10 text-accent"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})
