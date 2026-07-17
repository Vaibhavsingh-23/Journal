import { motion } from "framer-motion"
import { Display, Subheading, Body } from "../ui/Typography"

interface ReflectionHeaderProps {
  title: string
  date: string
  heroImage: string
  groundingSentence: string
}

export function ReflectionHeader({ title, date, heroImage, groundingSentence }: ReflectionHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center text-center space-y-6 mb-16"
    >
      <div className="w-full h-48 md:h-64 overflow-hidden rounded-xl mb-6">
        <img 
          src={heroImage} 
          alt="Reflection Header" 
          className="w-full h-full object-cover opacity-90"
        />
      </div>
      
      <Subheading className="text-accent">{date}</Subheading>
      <Display className="max-w-2xl mx-auto">{title}</Display>
      
      <div className="w-12 h-px bg-accent/50 mx-auto mt-4 mb-4" />
      
      <Body className="text-secondary-foreground italic">{groundingSentence}</Body>
    </motion.div>
  )
}
