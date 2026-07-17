import { motion } from "framer-motion"
import { Heading, Body, Caption, Subheading } from "../ui/Typography"
import type { Milestone } from "../../types/models"

interface MilestoneCardProps {
  milestone: Milestone
  index: number
}

export function MilestoneCard({ milestone, index }: MilestoneCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative pl-8 md:pl-12 pb-16 last:pb-0 group"
    >
      {/* Timeline Dot & Line */}
      <div className="absolute left-0 top-2 bottom-0 w-px bg-border/50 group-last:bg-transparent" />
      <div className="absolute left-[-4px] top-2.5 w-2 h-2 rounded-full bg-accent ring-4 ring-background" />

      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border/50 hover:border-accent/30 transition-colors shadow-sm">
        <Caption className="text-secondary-foreground uppercase tracking-wider mb-2">{milestone.date}</Caption>
        <Heading className="mb-4 text-foreground">{milestone.title}</Heading>
        <Body className="text-foreground/80 mb-6">{milestone.summary}</Body>
        
        {milestone.relatedMemories.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <Subheading className="text-xs text-secondary-foreground mb-3">Related Memories</Subheading>
            <div className="flex flex-wrap gap-2">
              {milestone.relatedMemories.map(mem => (
                <span key={mem} className="px-3 py-1 bg-accent/5 text-accent rounded-full text-xs font-medium">
                  {mem}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
