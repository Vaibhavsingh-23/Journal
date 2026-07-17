import { motion } from "framer-motion"
import { Bold, Italic, Type, Image as ImageIcon } from "lucide-react"

export function WritingToolbar() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-sm z-50 md:hidden"
    >
      <button className="p-2 text-secondary-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
        <Bold className="w-4 h-4" />
      </button>
      <button className="p-2 text-secondary-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
        <Italic className="w-4 h-4" />
      </button>
      <button className="p-2 text-secondary-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
        <Type className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-2" />
      <button className="p-2 text-secondary-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
        <ImageIcon className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
