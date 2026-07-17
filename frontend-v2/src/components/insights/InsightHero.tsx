import { motion } from "framer-motion"
import { Display, Body } from "../ui/Typography"

interface InsightHeroProps {
  title: string
  subtitle: string
  image: string
}

export function InsightHero({ title, subtitle, image }: InsightHeroProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col text-center space-y-6 mb-24 max-w-5xl mx-auto px-4 md:px-0"
    >
      <div className="w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl mb-12 relative shadow-lg">
        <div className="absolute inset-0 bg-black/5 z-10" />
        <img 
          src={image} 
          alt="Insights Hero" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <Display>{title}</Display>
      <Body className="text-secondary-foreground italic text-xl md:text-2xl max-w-2xl mx-auto">
        "{subtitle}"
      </Body>
    </motion.div>
  )
}
