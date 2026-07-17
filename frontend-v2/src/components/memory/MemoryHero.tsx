import { motion } from "framer-motion"
import { Display, Body } from "../ui/Typography"

export function MemoryHero() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col text-center space-y-6 mb-16 max-w-4xl mx-auto px-4 md:px-0"
    >
      <div className="w-full h-[300px] md:h-[400px] overflow-hidden rounded-2xl mb-8 relative">
        <div className="absolute inset-0 bg-black/10 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1506744626753-1fa30fd225eb?q=80&w=2000&auto=format&fit=crop" 
          alt="Memory Explorer Hero" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <Display>Memory Explorer</Display>
      <Body className="text-secondary-foreground italic text-xl">
        "Your experiences organized by meaning, not by date."
      </Body>
    </motion.div>
  )
}
