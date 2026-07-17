import { motion } from "framer-motion"
import { Subheading, Display } from "../ui/Typography"

interface StatisticCardProps {
  label: string
  value: string | number
  index: number
}

export function StatisticCard({ label, value, index }: StatisticCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
      className="flex flex-col bg-transparent p-6 rounded-lg border border-border/50 text-center"
    >
      <Display className="text-3xl md:text-4xl text-accent mb-2">{value}</Display>
      <Subheading className="text-xs text-secondary-foreground uppercase tracking-widest">{label}</Subheading>
    </motion.div>
  )
}
