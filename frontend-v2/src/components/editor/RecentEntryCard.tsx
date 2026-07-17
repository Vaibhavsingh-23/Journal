import { motion } from "framer-motion"
import { Body, Caption } from "../ui/Typography"
import { useNavigate } from "react-router-dom"
import type { JournalEntry } from "../../services/api/journal"

interface RecentEntryCardProps {
  entry: JournalEntry
  index: number
}

export function RecentEntryCard({ entry, index }: RecentEntryCardProps) {
  const navigate = useNavigate()
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className="group cursor-pointer py-3 border-b border-border/50 last:border-0"
      onClick={() => navigate(`/journal?id=${entry.id}`)}
    >
      <Caption className="text-secondary-foreground mb-1 group-hover:text-foreground transition-colors">
        {new Date(entry.createdAt || entry.date).toLocaleDateString()}
      </Caption>
      <Body className="text-base text-foreground font-medium group-hover:text-accent transition-colors truncate">{entry.title}</Body>
    </motion.div>
  )
}
