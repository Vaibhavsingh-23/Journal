import { motion } from "framer-motion"
import { Subheading, Display } from "../ui/Typography"

interface TimelineStatsProps {
  stats: {
    journals: number
    memories: number
    insights: number
    reflections: number
    streak: number
  }
}

export function TimelineStats({ stats }: TimelineStatsProps) {
  const statItems = [
    { label: "Journals", value: stats.journals },
    { label: "Memories", value: stats.memories },
    { label: "Insights", value: stats.insights },
    { label: "Reflections", value: stats.reflections },
    { label: "Day Streak", value: stats.streak },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="flex flex-wrap justify-center gap-8 md:gap-16 py-8 border-y border-border/50 mb-20 max-w-5xl mx-auto"
    >
      {statItems.map((item) => (
        <div key={item.label} className="text-center">
          <Display className="text-2xl md:text-3xl text-foreground mb-1">{item.value}</Display>
          <Subheading className="text-xs text-secondary-foreground uppercase tracking-widest">{item.label}</Subheading>
        </div>
      ))}
    </motion.div>
  )
}
