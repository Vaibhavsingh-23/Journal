import { motion } from "framer-motion"
import { Caption } from "../ui/Typography"

interface WordCounterProps {
  words: number
  chars: number
  readingTime: string
}

export function WordCounter({ words, chars, readingTime }: WordCounterProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="flex items-center space-x-4 text-secondary-foreground"
    >
      <Caption>{words} words</Caption>
      <span className="text-border">•</span>
      <Caption>{chars} characters</Caption>
      <span className="text-border hidden md:inline">•</span>
      <Caption className="hidden md:inline">{readingTime}</Caption>
    </motion.div>
  )
}
