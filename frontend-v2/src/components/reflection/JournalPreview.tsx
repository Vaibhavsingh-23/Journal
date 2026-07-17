import { motion } from "framer-motion"
import { Heading, Body, Caption } from "../ui/Typography"
import type { JournalPreviewType } from "../../types/models"

interface JournalPreviewProps {
  journal: JournalPreviewType
}

export function JournalPreview({ journal }: JournalPreviewProps) {
  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="bg-secondary/20 p-8 md:p-12 rounded-xl border border-border/50 max-w-3xl mx-auto mb-16"
    >
      <header className="mb-8 border-b border-border/50 pb-6">
        <Caption className="text-secondary-foreground mb-3">{journal.date}</Caption>
        <Heading className="text-foreground">{journal.title}</Heading>
      </header>
      
      <div className="space-y-6">
        {journal.paragraphs.map((para, index) => (
          <Body key={index} className="text-foreground/90">{para}</Body>
        ))}
      </div>
    </motion.article>
  )
}
