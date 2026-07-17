import { motion } from "framer-motion"
import { Display, Body } from "../ui/Typography"

export function TimelineHero() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col text-center space-y-6 mb-16 max-w-4xl mx-auto px-4 md:px-0"
    >
      <div className="w-full h-[250px] md:h-[350px] overflow-hidden rounded-2xl mb-8 relative">
        <div className="absolute inset-0 bg-black/10 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=2073&auto=format&fit=crop" 
          alt="Timeline Hero" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <Display>Your Timeline</Display>
      <Body className="text-secondary-foreground italic text-xl">
        "Every journal, memory, and reflection woven into your story."
      </Body>
    </motion.div>
  )
}
